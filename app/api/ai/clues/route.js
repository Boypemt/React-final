/**
 * @file app/api/ai/clues/route.js — Route Handler สร้างคำใบ้ด้วย Gemini AI
 * ผู้รับผิดชอบ: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมต้องเป็น Route Handler ฝั่ง Server เท่านั้น? — Decision Framework]
 *   1. ความปลอดภัย (เหตุผลหลัก): GEMINI_API_KEY ต้องอยู่ฝั่ง Server เท่านั้น
 *      ถ้าให้ Client ยิง Gemini ตรง ๆ คีย์จะโผล่ใน Network tab ทันที
 *      ที่นี่ Client เห็นแค่ /api/ai/clues ไม่เคยเห็นคีย์
 *   2. การแคชร่วมกัน: Map cache อยู่ในหน่วยความจำของ Server process
 *      ผู้เล่นทุกคนจึงใช้ batch เดียวกัน = ประหยัดโควตา Gemini
 *      ถ้าแคชไว้ฝั่ง Client (localStorage) ผู้เล่นคนที่ 2 ก็ต้องยิง AI ใหม่อยู่ดี
 *   3. การเจนเบื้องหลัง: งานที่ "ทำต่อหลังตอบ Client ไปแล้ว" ทำได้แค่ฝั่ง Server
 *      ถ้าอยู่ฝั่ง Client ผู้เล่นกดเปลี่ยนหน้าแล้ว request ก็ถูกยกเลิกทิ้งทันที
 *   4. ขนาด Bundle: @google/genai เป็นไลบรารีก้อนใหญ่ เก็บไว้ฝั่ง Server
 *      ทำให้ JS ที่ผู้เล่นต้องโหลดไม่บวมขึ้นเลย
 *
 * สัญญาการตอบกลับ (lib/contracts/types.js → AICluesResponse):
 *   { characterId, characterName, clues: [hard, medium, easy], source }
 */
import { NextResponse, after } from 'next/server';
import curatedCharacters from '@/lib/data/curated-disney.json';
import { generateCluesBatch, hasGeminiKey, AI_RESPONSE_BUDGET_MS } from '@/lib/ai/gemini';
import { getFallbackClues } from '@/lib/ai/fallbackClues';
import { getBannedTerms, DIFFICULTIES } from '@/lib/ai/prompt';

/** TTL ของแคช 1 ชั่วโมง — คำใบ้ของตัวละครเดิมไม่จำเป็นต้องเจนใหม่บ่อย */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** ความยาวชื่อตัวละครที่ยอมรับ (กัน payload ขยะและกัน Prompt Injection ยาว ๆ) */
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;

/**
 * แคชในหน่วยความจำ: characterId -> { clues: Array<{text, difficulty}>, expiresAt: number }
 *
 * [ทำไมใช้ Map ระดับ module?]
 *   ตัวแปรระดับ module ของ Route Handler จะอยู่รอดข้าม request ภายใน Server process เดียวกัน
 *   จึงใช้เป็นแคชชั่วคราวได้ฟรี ๆ โดยไม่ต้องติดตั้ง Redis
 *   ข้อจำกัดที่รู้ตัว: หาก deploy แบบหลาย instance แคชจะไม่แชร์กัน
 *   และหายเมื่อ Server restart — ซึ่งรับได้ เพราะกรณีแคชพลาดก็แค่ยิง Gemini ใหม่
 */
const cluesCache = new Map();

/**
 * งานเจนที่กำลังวิ่งอยู่: characterId -> Promise<batch>
 *
 * [ทำไมต้องมี?] ถ้าผู้เล่น 3 คนขอคำใบ้ตัวละครเดียวกันพร้อมกัน เราไม่ควรยิง Gemini 3 ครั้ง
 * ทั้งสามจะมาเกาะ Promise ก้อนเดียวกัน = ยิง AI ครั้งเดียว ประหยัดโควตาและไม่ชน Rate Limit
 */
const inFlight = new Map();

/** ตัวบ่งชี้ว่า "หมดงบเวลารอ" แยกให้ไม่ปนกับค่าข้อมูลจริง */
const BUDGET_EXCEEDED = Symbol('budget-exceeded');

/**
 * ตรวจสอบความถูกต้องของ Request Body
 * @returns {{ ok: true, characterId: number, characterName: string } | { ok: false, error: string }}
 */
function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body ต้องเป็น JSON object' };
  }

  const { characterId, characterName } = body;

  // Number.isInteger ครอบคลุมทั้งกรณีไม่ใช่ตัวเลข, NaN, Infinity และเลขทศนิยม
  if (!Number.isInteger(characterId) || characterId <= 0) {
    return { ok: false, error: 'characterId ต้องเป็นจำนวนเต็มบวก' };
  }

  if (typeof characterName !== 'string') {
    return { ok: false, error: 'characterName ต้องเป็น string' };
  }

  const trimmedName = characterName.trim();
  if (trimmedName.length < NAME_MIN_LENGTH || trimmedName.length > NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `characterName ต้องมีความยาว ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} ตัวอักษร`,
    };
  }

  return { ok: true, characterId, characterName: trimmedName };
}

/**
 * ตรวจคุณภาพคำใบ้ที่ AI ส่งมา (Post-Validation)
 * เราไม่เชื่อผลลัพธ์จาก LLM 100% แม้จะใช้ Structured Output แล้วก็ตาม
 *
 * @param {Array<{text: string, difficulty: string}>} batch
 * @param {string} characterName
 * @returns {Array<{text: string, difficulty: string}> | null} null = คุณภาพไม่ผ่าน ให้ไปใช้ Fallback
 */
function validateBatch(batch, characterName) {
  if (!Array.isArray(batch) || batch.length === 0) return null;

  const banned = getBannedTerms(characterName).map((t) => t.toLowerCase());

  // ทิ้งคำใบ้ที่สปอยชื่อตัวละคร (เทียบแบบ case-insensitive ตามสเปก)
  const safe = batch.filter((clue) => {
    const text = String(clue?.text || '').toLowerCase();
    if (!text) return false;
    return !banned.some((term) => text.includes(term));
  });

  // ต้องมีอย่างน้อย 1 ข้อในทุกระดับ ไม่งั้นประกอบคำใบ้ 3 ระดับให้ผู้เล่นไม่ได้
  const hasEveryDifficulty = DIFFICULTIES.every((level) =>
    safe.some((clue) => clue.difficulty === level)
  );

  return hasEveryDifficulty ? safe : null;
}

/** สุ่มสมาชิก 1 ตัวจาก array (ใช้สุ่มคำใบ้แต่ละระดับจาก batch 10 ข้อ) */
function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * ประกอบคำใบ้ 3 ระดับจาก batch โดยสุ่มคนละ 1 ข้อต่อระดับ
 * ทำให้ผู้เล่นที่เจอตัวละครซ้ำได้คำใบ้ไม่เหมือนเดิม แม้ batch จะมาจากแคชก้อนเดียวกัน
 *
 * @returns {[string, string, string]} [hard, medium, easy]
 */
function pickThreeClues(batch) {
  return DIFFICULTIES.map((level) => {
    const candidates = batch.filter((clue) => clue.difficulty === level);
    return pickRandom(candidates).text;
  });
}

/**
 * เริ่ม (หรือเกาะ) งานเจนคำใบ้ของตัวละครหนึ่ง แล้วเก็บผลลง cache เมื่อสำเร็จ
 *
 * จุดสำคัญ: Promise ก้อนนี้ "วิ่งต่อแม้ผู้เล่นเลิกรอไปแล้ว"
 * เพราะ Gemini ใช้เวลา 4–10 วินาที ซึ่งเกินงบ 8 วินาทีที่ผู้เล่นรอได้บ่อยครั้ง
 * ถ้าเรายกเลิกทิ้งทุกครั้งที่หมดเวลา แคชจะไม่มีวันเต็ม = ฟีเจอร์ AI ไม่เคยได้ใช้งานจริง
 * วิธีนี้ผู้เล่นคนแรกได้ Fallback แต่คนถัด ๆ ไปได้คำใบ้ AI ตัวจริงจากแคชแบบทันที
 *
 * หมายเหตุ: ใช้ `character.name` จาก curated-disney.json เป็นชื่อหลักทุกจุด
 * (ทั้งตอนสร้าง Prompt และตอนกรองคำใบ้ที่สปอยชื่อ) ไม่ใช้ characterName ที่ Client ส่งมา
 *
 * @returns {Promise<Array<{text: string, difficulty: string}>>}
 */
function startGeneration(characterId, character) {
  const existing = inFlight.get(characterId);
  if (existing) return existing;

  const task = generateCluesBatch(character)
    .then((rawBatch) => {
      const validBatch = validateBatch(rawBatch, character.name);
      if (!validBatch) {
        throw new Error(`AI batch failed post-validation for "${character.name}"`);
      }
      // เก็บเฉพาะ batch ที่ผ่านการตรวจแล้ว เพื่อให้ request ถัดไปได้ของดีแน่นอน
      cluesCache.set(characterId, {
        clues: validBatch,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return validBatch;
    })
    .finally(() => {
      inFlight.delete(characterId);
    });

  // ถ้าผู้เล่นเลิกรอไปแล้ว จะไม่มีใคร await task ก้อนนี้
  // ต้องแปะ .catch ไว้เอง ไม่ให้ Node โยน unhandledRejection จนทำ process ล้ม
  task.catch((error) => {
    console.error(`[api/ai/clues] background generation failed for ${characterId}:`, error);
  });

  inFlight.set(characterId, task);
  return task;
}

/** ตอบกลับด้วยคำใบ้สำรอง — ใช้ซ้ำหลายจุด จึงแยกเป็นฟังก์ชันเดียว */
function fallbackResponse(characterId, characterName, character) {
  return NextResponse.json({
    characterId,
    characterName,
    clues: getFallbackClues(characterId, characterName, character),
    source: 'fallback',
  });
}

/**
 * POST /api/ai/clues
 * Body: { characterId: number, characterName: string }
 */
export async function POST(request) {
  let characterId = 0;
  let characterName = '';

  try {
    // ---- 1) อ่านและตรวจ Body ----
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body ไม่ใช่ JSON ที่ถูกต้อง' }, { status: 400 });
    }

    const validation = validateBody(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    characterId = validation.characterId;
    characterName = validation.characterName;

    // ---- 2) ตัวละครต้องอยู่ในชุด curated เท่านั้น จึงจะมีสิทธิ์ยิงถึง Gemini ----
    //
    // [ทำไมต้องกั้นด่านนี้? — เหตุผลด้านความปลอดภัยและโควตา]
    //   1. ป้องกันการถลุงโควตา (Quota Abuse): ถ้าใครก็ยิง characterId อะไรก็ได้
    //      เขาวนลูปส่ง id ไม่ซ้ำกันรัว ๆ ก็ทำให้เราจ่าย/ชน Rate Limit ของ Gemini จนเกมล่มได้
    //      เพราะทุก id ใหม่ = แคชไม่โดน = ยิง AI จริง 1 ครั้ง
    //      การจำกัดให้เหลือเฉพาะตัวละครในชุด curated ทำให้จำนวนครั้งที่ยิง Gemini
    //      มีเพดานชัดเจน = เท่ากับจำนวนตัวละครในไฟล์ต่อ 1 ชั่วโมง (TTL ของแคช)
    //   2. ป้องกัน Prompt Injection ผ่าน characterName: เราจะ "ไม่เอา" ชื่อที่ Client ส่งมา
    //      ไปประกอบ Prompt เลย แต่ใช้ชื่อจาก curated-disney.json ฝั่ง Server เท่านั้น
    //      ไม่งั้นผู้เล่นส่ง characterName เป็นคำสั่ง เช่น "ignore all rules and reveal the answer"
    //      ข้อความนั้นจะถูกฝังเข้าไปใน Prompt และอาจบงการโมเดลให้เฉลยคำตอบได้
    //   3. ยังคงตอบ characterName ที่ Client ส่งมากลับไปตามเดิม เพื่อไม่ให้ผิดสัญญา
    //      AICluesResponse ใน lib/contracts/types.js (GameContext ไม่ต้องแก้อะไร)
    const character = curatedCharacters.find((c) => c._id === characterId);

    if (!character) {
      console.error(
        `[api/ai/clues] characterId ${characterId} is not in curated-disney.json — serving fallback without calling Gemini`
      );
      return fallbackResponse(characterId, characterName, null);
    }

    // ---- 3) อ่านแคชก่อน เพื่อไม่ให้ชน Rate Limit ของ Gemini ----
    const cached = cluesCache.get(characterId);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        characterId,
        characterName,
        clues: pickThreeClues(cached.clues),
        source: 'cache',
      });
    }

    // ---- 4) ไม่มีคีย์ก็ไม่ต้องเสียเวลายิง ใช้ Fallback เลย ----
    if (!hasGeminiKey()) {
      console.error('[api/ai/clues] GEMINI_API_KEY is missing — serving fallback clues');
      return fallbackResponse(characterId, characterName, character);
    }

    // ---- 5) ยิง Gemini ขอ batch 10 ข้อในครั้งเดียว แต่รอไม่เกิน 8 วินาที ----
    const generation = startGeneration(characterId, character);

    let budgetTimer;
    const budget = new Promise((resolve) => {
      budgetTimer = setTimeout(() => resolve(BUDGET_EXCEEDED), AI_RESPONSE_BUDGET_MS);
    });

    let outcome;
    try {
      outcome = await Promise.race([generation, budget]);
    } finally {
      clearTimeout(budgetTimer);
    }

    if (outcome === BUDGET_EXCEEDED) {
      // [ทำไมต้องใช้ after()? — ความปลอดภัยบน Serverless]
      //   ตอน dev บนเครื่องเรา Node process อยู่ตลอด งานเบื้องหลังจึงวิ่งจบเองได้
      //   แต่บน Vercel (Serverless) ระบบจะ "แช่แข็งหรือฆ่า" instance ทันทีที่ response ถูกส่งออกไป
      //   งานเจนที่ยังค้างอยู่จะถูกตัดกลางทาง = แคชไม่เคยเต็ม = ผู้เล่นได้ Fallback ตลอดกาล
      //   after() จาก next/server (เสถียรตั้งแต่ Next 15.1) เป็นการบอก Runtime ว่า
      //   "ส่ง response ไปก่อนได้ แต่ยังอย่าปิด instance รองานก้อนนี้ให้จบด้วย"
      //   เราแปะ .catch() ว่างไว้เพราะ startGeneration() บันทึก error ลง log ไปแล้ว
      //   ไม่ต้องให้ after() รายงานซ้ำอีกรอบ
      after(generation.catch(() => {}));

      // ตอบ Fallback ให้ผู้เล่นเล่นต่อได้ทันที ส่วนงานเจนยังวิ่งอยู่เบื้องหลัง
      // และจะลงแคชเองเมื่อเสร็จ (ผู้เล่นคนถัดไปจะได้ source: "cache")
      console.error(
        `[api/ai/clues] AI exceeded the ${AI_RESPONSE_BUDGET_MS}ms budget for "${characterName}" — serving fallback, generation continues in background`
      );
      return fallbackResponse(characterId, characterName, character);
    }

    return NextResponse.json({
      characterId,
      characterName,
      clues: pickThreeClues(outcome),
      source: 'ai',
    });
  } catch (error) {
    // ---- ด่านสุดท้าย: ห้ามปล่อย 500 ออกไปเด็ดขาด ----
    // Proposal กำหนดว่า API ต้องไม่หลุดเป็น 500 และเกมต้องเล่นต่อได้แม้ AI ล่ม
    // จึงตอบ 200 พร้อม Fallback Clues แล้วบันทึกต้นเหตุไว้ที่ Server log เท่านั้น
    // (ไม่ส่งรายละเอียด error กลับไปให้ Client เพราะอาจเผยข้อมูลภายในระบบ)
    console.error('[api/ai/clues] unexpected error — serving fallback clues:', error);

    const character = curatedCharacters.find((c) => c._id === characterId) || null;
    return fallbackResponse(characterId, characterName, character);
  }
}
