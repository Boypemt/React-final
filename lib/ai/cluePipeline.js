/**
 * @file lib/ai/cluePipeline.js — สายการผลิตคำใบ้ (แคช + ยิง Gemini + Fallback) · Server Only
 * ผู้รับผิดชอบเดิม: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมย้ายออกมาจาก app/api/ai/clues/route.js?]
 *   ตอนนี้มีผู้เรียกสองทาง และทั้งสองต้อง "ใช้แคชก้อนเดียวกัน":
 *     1. POST /api/game/clue   — ทางที่เกมใช้จริง (ไม่เคยเอ่ยชื่อตัวละครกลับไปให้ Client)
 *     2. POST /api/ai/clues    — endpoint อุ่นแคชก่อนเดโม (เปิดเฉพาะตอน dev)
 *   ถ้าปล่อยให้โค้ดแคชอยู่ในไฟล์ route.js ของใครของมัน จะกลายเป็นแคชสองก้อน
 *   = อุ่นแคชไว้แล้วแต่เกมไม่ได้ใช้ และยิง Gemini ซ้ำสองเท่า
 *   ย้ายมาไว้ที่ module เดียวกัน ตัวแปรระดับ module จึงถูกแชร์กันทั้งสองเส้นทาง
 *
 * [Server Only เพราะอะไร?] ไฟล์นี้ import lib/ai/gemini.js ที่อ่าน GEMINI_API_KEY
 *   ถ้าโดน import จากฝั่ง Client คีย์จะถูกฝังลง Bundle — 'server-only' ทำให้ build พังก่อน
 */
import 'server-only';
import { after } from 'next/server';
import { generateCluesBatch, hasGeminiKey, AI_RESPONSE_BUDGET_MS } from './gemini';
import { getFallbackClues } from './fallbackClues';
import { getBannedTerms, DIFFICULTIES } from './prompt';

/** TTL ของแคช 1 ชั่วโมง — คำใบ้ของตัวละครเดิมไม่จำเป็นต้องเจนใหม่บ่อย */
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * แคชในหน่วยความจำ: characterId -> { clues: Array<{text, difficulty}>, expiresAt: number }
 *
 * [ทำไมใช้ Map ระดับ module?]
 *   ตัวแปรระดับ module จะอยู่รอดข้าม request ภายใน Server process เดียวกัน
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
 * (ทั้งตอนสร้าง Prompt และตอนกรองคำใบ้ที่สปอยชื่อ) ไม่เคยใช้ชื่อที่ Client ส่งมา
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
    console.error(`[cluePipeline] background generation failed for ${characterId}:`, error);
  });

  inFlight.set(characterId, task);
  return task;
}

/**
 * ขอคำใบ้ 3 ระดับของตัวละครหนึ่งตัว — ฟังก์ชันนี้ "ห้ามโยน error" เด็ดขาด
 * Proposal กำหนดว่าเกมต้องเล่นต่อได้แม้ AI ล่มหรือไม่มี API Key เลย
 *
 * @param {Object} character - ข้อมูลตัวละครจาก curated-disney.json (ต้องผ่านด่าน curated มาแล้ว)
 * @returns {Promise<{ clues: [string, string, string], source: 'cache'|'ai'|'fallback' }>}
 */
export async function getCluesForCharacter(character) {
  const characterId = character._id;

  try {
    // ---- 1) อ่านแคชก่อน เพื่อไม่ให้ชน Rate Limit ของ Gemini ----
    const cached = cluesCache.get(characterId);
    if (cached && cached.expiresAt > Date.now()) {
      return { clues: pickThreeClues(cached.clues), source: 'cache' };
    }

    // ---- 2) ไม่มีคีย์ก็ไม่ต้องเสียเวลายิง ใช้ Fallback เลย ----
    if (!hasGeminiKey()) {
      console.error('[cluePipeline] GEMINI_API_KEY is missing — serving fallback clues');
      return {
        clues: getFallbackClues(characterId, character.name, character),
        source: 'fallback',
      };
    }

    // ---- 3) ยิง Gemini ขอ batch 10 ข้อในครั้งเดียว แต่รอไม่เกิน 8 วินาที ----
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
      after(generation.catch(() => {}));

      console.error(
        `[cluePipeline] AI exceeded the ${AI_RESPONSE_BUDGET_MS}ms budget for character ${characterId} — serving fallback, generation continues in background`
      );
      return {
        clues: getFallbackClues(characterId, character.name, character),
        source: 'fallback',
      };
    }

    return { clues: pickThreeClues(outcome), source: 'ai' };
  } catch (error) {
    // ---- ด่านสุดท้าย: เกมต้องเล่นต่อได้เสมอ ----
    // บันทึกต้นเหตุไว้ที่ Server log เท่านั้น ไม่ส่งรายละเอียดกลับไปให้ Client
    // เพราะข้อความ error อาจเผยข้อมูลภายในระบบ
    console.error('[cluePipeline] unexpected error — serving fallback clues:', error);
    return {
      clues: getFallbackClues(characterId, character.name, character),
      source: 'fallback',
    };
  }
}
