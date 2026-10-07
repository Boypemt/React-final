/**
 * @file lib/ai/gemini.js — ตัวเชื่อม Google Gemini (Server Only)
 * ผู้รับผิดชอบ: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมต้อง Server Only?]
 *   1. ไฟล์นี้อ่าน process.env.GEMINI_API_KEY ซึ่งเป็นความลับ
 *      ถ้าโค้ดก้อนนี้ถูก import จาก Client Component คีย์จะถูกฝังลง Bundle
 *      และใครก็ขโมยไปใช้จนโควตาเราหมดได้
 *   2. 'server-only' เป็นแพ็กเกจที่ Next.js ติดมาให้ มันจะทำให้ build พังทันที
 *      ถ้ามีใครในทีมเผลอ import ไฟล์นี้จากฝั่ง Client — เป็น Guard ระดับ compile-time
 *      ปลอดภัยกว่าการเขียนคอมเมนต์เตือนเพียว ๆ
 */
import 'server-only';
import { GoogleGenAI } from '@google/genai';
import { buildCluesPrompt, CLUES_RESPONSE_SCHEMA, CLUES_PER_BATCH, DIFFICULTIES } from './prompt';

/**
 * งบเวลาที่ "ผู้เล่นรอได้" — เกิน 8 วินาทีถือว่านานเกินไปสำหรับรอบจับเวลา 30 วินาที
 * Route Handler จะเลิกรอที่จุดนี้แล้วตอบ Fallback ทันที
 * แต่ "ไม่ยกเลิก" การเจน เพื่อให้ผลลัพธ์ไปลงแคชให้ผู้เล่นคนถัดไปใช้
 */
export const AI_RESPONSE_BUDGET_MS = 8000;

/**
 * เพดานเวลาสูงสุดของการเจนเบื้องหลัง — ใช้ AbortController ตัดจริง
 * กันกรณี Gemini ค้างแบบไม่ตอบอะไรเลย (เคยเจน 129 วินาทีตอนทดสอบ)
 * แล้วปล่อยให้ connection ค้างกิน resource ของ Server ไปเรื่อย ๆ
 */
const AI_HARD_TIMEOUT_MS = 25000;

/**
 * โมเดลเริ่มต้น: gemini-3.1-flash-lite
 * หมายเหตุ: gemini-2.5-flash ที่เขียนไว้ใน Proposal ตอนนี้ Google ปิดรับคีย์ใหม่แล้ว
 * (ตอบ 404 "no longer available to new users") จึงต้องเปลี่ยนมาใช้รุ่นนี้
 * เปลี่ยนรุ่นได้จาก GEMINI_MODEL ใน .env.local โดยไม่ต้องแก้โค้ด
 */
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

/** หน่วงเวลาก่อนลองใหม่เมื่อ Gemini ตอบ 503 (โควตาฟรีมักเจอ "high demand" เป็นช่วง ๆ) */
const RETRY_DELAY_MS = 600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** มีคีย์ให้ใช้ไหม — Route Handler เรียกเช็กก่อน เพื่อข้ามไป Fallback ได้ทันทีโดยไม่เสียเวลา */
export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** Gemini ล่มชั่วคราวหรือเปล่า (503 / UNAVAILABLE) — แบบนี้ "ลองใหม่ได้" */
function isTransientError(error) {
  const message = String(error?.message || '');
  return error?.status === 503 || message.includes('"code":503') || message.includes('UNAVAILABLE');
}

/**
 * คัดกรองผลลัพธ์ชั้นแรก: เอาเฉพาะรายการที่มี text เป็นสตริงและ difficulty ถูกต้องตามสัญญา
 * (การตรวจว่า "สปอยชื่อตัวละครไหม" ทำอีกชั้นใน Route Handler)
 */
function cleanBatch(parsed, characterName) {
  const clues = Array.isArray(parsed?.clues) ? parsed.clues : [];

  const cleaned = clues
    .filter((c) => typeof c?.text === 'string' && DIFFICULTIES.includes(c?.difficulty))
    .map((c) => ({ text: c.text.trim(), difficulty: c.difficulty }))
    .filter((c) => c.text.length > 0);

  if (cleaned.length === 0) {
    throw new Error('Gemini returned no usable clues');
  }

  // ได้ไม่ครบ 10 ไม่ถือว่าพัง (ยังสุ่ม 3 ระดับได้) แต่บันทึกไว้ดูแนวโน้มคุณภาพโมเดล
  if (cleaned.length < CLUES_PER_BATCH) {
    console.warn(
      `[gemini] expected ${CLUES_PER_BATCH} clues, got ${cleaned.length} for "${characterName}"`
    );
  }

  return cleaned;
}

/** ยิง Gemini 1 ครั้ง (ไม่มี retry) */
async function callGemini(ai, model, character, signal) {
  const response = await ai.models.generateContent({
    model,
    contents: buildCluesPrompt(character),
    config: {
      // บังคับรูปแบบผลลัพธ์ที่ระดับ API — ไม่ต้องมานั่งแกะ Markdown code fence เอง
      responseMimeType: 'application/json',
      responseSchema: CLUES_RESPONSE_SCHEMA,
      // อุณหภูมิกลาง ๆ: สูงพอให้คำใบ้แต่ละ batch ไม่ซ้ำซาก แต่ไม่สูงจนเพ้อ
      temperature: 0.9,
      // ลดเวลา "คิด" ของโมเดลตระกูล Gemini 3 ลง เพราะงานเขียนคำใบ้ไม่ต้องใช้การให้เหตุผลลึก
      // ช่วยหั่นเวลาตอบจากราว 8 วินาทีเหลือราว 4 วินาที
      thinkingConfig: { thinkingLevel: 'low' },
      abortSignal: signal,
    },
  });

  const raw = response?.text;
  if (!raw) {
    throw new Error('Gemini returned an empty response');
  }

  return cleanBatch(JSON.parse(raw), character?.name);
}

/**
 * เรียก Gemini ขอคำใบ้ 1 batch (10 ข้อ) ด้วย Structured Output
 *
 * Promise ที่คืนออกไปมีเพดานเวลา AI_HARD_TIMEOUT_MS (AbortController)
 * ส่วนการ "เลิกรอ" ที่ 8 วินาทีเป็นหน้าที่ของ Route Handler (ดู AI_RESPONSE_BUDGET_MS)
 *
 * @param {Object} character - ข้อมูลตัวละครจาก curated-disney.json
 * @returns {Promise<Array<{ text: string, difficulty: 'hard'|'medium'|'easy' }>>}
 * @throws {Error} เมื่อไม่มีคีย์ / timeout / Gemini ตอบผิดรูป
 *                 ผู้เรียก (Route Handler) มีหน้าที่ catch แล้วสลับไป Fallback
 */
export async function generateCluesBatch(character) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_HARD_TIMEOUT_MS);

  try {
    try {
      return await callGemini(ai, model, character, controller.signal);
    } catch (error) {
      // โควตาฟรีของ Gemini เจอ 503 "high demand" บ่อย และมักหายไปเองในเสี้ยววินาที
      // จึงลองใหม่ให้อีก 1 ครั้ง (เฉพาะกรณีที่ลองใหม่มีโอกาสสำเร็จจริง)
      if (!isTransientError(error) || controller.signal.aborted) {
        throw error;
      }
      console.warn(`[gemini] transient 503 for "${character?.name}" — retrying once`);
      await sleep(RETRY_DELAY_MS);
      return await callGemini(ai, model, character, controller.signal);
    }
  } catch (error) {
    // แปลง AbortError ให้เป็นข้อความที่อ่านรู้เรื่องตอนดู log
    if (error?.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(`Gemini request aborted after ${AI_HARD_TIMEOUT_MS}ms hard timeout`);
    }
    throw error;
  } finally {
    // เคลียร์ timer ทุกกรณี กัน Handle ค้างใน Node process (เทียบได้กับ cleanup ใน useEffect)
    clearTimeout(timeoutId);
  }
}
