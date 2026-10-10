import { z } from 'zod';

/**
 * @file lib/scoreSchema.js — Zod Schema กลางสำหรับการส่งคะแนน
 * กลุ่ม Sigma · Disney Character Clue Guesser
 *
 * [Server หรือ Client? — ไฟล์นี้ใช้ "ทั้งสองฝั่ง" โดยตั้งใจ]
 *   ไม่มี 'use client' และไม่มี 'server-only' เพราะต้องถูก import จากทั้งสองที่:
 *     - ฝั่ง Client: components/ScoreSubmissionForm.jsx ใช้ผ่าน zodResolver
 *       เพื่อขึ้นข้อความ error ใต้ช่องกรอกทันทีโดยไม่ต้องรอ Server
 *     - ฝั่ง Server: app/scoreboard/actions.js ใช้ตรวจซ้ำอีกครั้งใน Server Action
 *
 *   [ทำไมต้องตรวจสองรอบด้วย schema ก้อนเดียวกัน?]
 *     การตรวจฝั่ง Client เป็นเรื่อง "ประสบการณ์ผู้ใช้" เท่านั้น ไม่ใช่ความปลอดภัย
 *     เพราะผู้ใช้ปิด JavaScript, แก้ค่าใน DevTools หรือยิง Server Action ตรง ๆ ได้
 *     ฝั่ง Server จึง "ห้ามเชื่อข้อมูลจาก Client" และต้องตรวจใหม่ทุกครั้ง
 *     การแชร์ schema ไฟล์เดียวทำให้กฎทั้งสองฝั่งตรงกันเสมอ แก้ที่เดียวมีผลทั้งคู่
 *     (ถ้าเขียนกฎแยกกันสองที่ สักวันมันจะหลุดไม่ตรงกันแน่นอน)
 */

/** โหมดเกมที่ระบบรองรับ — ต้องตรงกับ context/GameContext.jsx */
export const GAME_MODES = ['deduction', 'trivia'];

/** เพดานคะแนน: โหมด Trivia 5 ด่าน ด่านละ 1,000 + โบนัสเวลา จึงเผื่อไว้มาก */
export const MAX_SCORE = 1_000_000;

/** เพดานเวลา 86,400 วินาที = 24 ชั่วโมง (กันค่าที่เป็นไปไม่ได้) */
export const MAX_TIME_SPENT_SECONDS = 86_400;

/** ตัวช่วยสร้างฟิลด์จำนวนเต็มไม่ติดลบแบบไม่บังคับกรอก (ใช้ซ้ำ 3 ที่) */
const optionalCount = (label) =>
  z
    .number({ error: `${label} ต้องเป็นตัวเลข` })
    .int({ message: `${label} ต้องเป็นจำนวนเต็ม` })
    .min(0, { message: `${label} ต้องไม่เป็นค่าลบ` })
    .optional();

/**
 * Schema สำหรับข้อมูลที่ผู้เล่นส่งมาบันทึกคะแนน
 * ใช้ร่วมกันทั้ง react-hook-form (ฝั่ง Client) และ Server Action (ฝั่ง Server)
 */
export const scoreSchema = z.object({
  name: z
    .string({ error: 'กรุณากรอกชื่อผู้เล่น' })
    // .trim() ทำงานก่อน .min() จึงกัน input ที่เป็นช่องว่างล้วนได้
    .trim()
    .min(2, { message: 'ชื่อผู้เล่นต้องมีอย่างน้อย 2 ตัวอักษร' })
    .max(24, { message: 'ชื่อผู้เล่นต้องไม่เกิน 24 ตัวอักษร' }),

  gameMode: z.enum(GAME_MODES, { error: 'โหมดเกมไม่ถูกต้อง' }),

  score: z
    .number({ error: 'คะแนนต้องเป็นตัวเลข' })
    .int({ message: 'คะแนนต้องเป็นจำนวนเต็ม' })
    .min(0, { message: 'คะแนนต้องไม่เป็นค่าลบ' })
    .max(MAX_SCORE, { message: `คะแนนต้องไม่เกิน ${MAX_SCORE.toLocaleString('th-TH')}` }),

  timeSpentSeconds: z
    .number({ error: 'เวลาที่ใช้ต้องเป็นตัวเลข' })
    .int({ message: 'เวลาที่ใช้ต้องเป็นจำนวนเต็ม (วินาที)' })
    .min(0, { message: 'เวลาที่ใช้ต้องไม่เป็นค่าลบ' })
    .max(MAX_TIME_SPENT_SECONDS, { message: 'เวลาที่ใช้ไม่สมเหตุสมผล' }),

  guessesCount: optionalCount('จำนวนครั้งที่เดา'),
  correctCount: optionalCount('จำนวนข้อที่ตอบถูก'),
  firstClueWins: optionalCount('จำนวนครั้งที่ตอบถูกจากคำใบ้แรก'),
});

/**
 * แปลงผลลัพธ์ error ของ Zod ให้เป็น object แบน ๆ { ชื่อฟิลด์: ข้อความ }
 * เพื่อให้ Server Action ส่งกลับไปแสดงใต้ช่องกรอกได้ง่าย
 *
 * @param {import('zod').ZodError} error
 * @returns {Record<string, string>}
 */
export function flattenScoreErrors(error) {
  const result = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    // เก็บเฉพาะข้อความแรกของแต่ละฟิลด์ ไม่ต้องยิงรวด ๆ ให้ผู้ใช้สับสน
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
