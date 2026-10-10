'use server';

import { revalidatePath } from 'next/cache';
import { scoreSchema, flattenScoreErrors } from '@/lib/scoreSchema';
import { addEntry } from '@/lib/scoreboardStore';

/**
 * @file app/scoreboard/actions.js — Server Action บันทึกคะแนน
 * กลุ่ม Sigma · Disney Character Clue Guesser
 *
 * [ทำไมใช้ Server Action ไม่ใช่ Route Handler?]
 *   งานนี้คือ "mutation ที่ผูกกับฟอร์มหน้าเดียว" ไม่ได้ต้องการ public API
 *   Server Action จึงเหมาะกว่าเพราะ:
 *     1. เรียกได้เหมือนเรียกฟังก์ชันปกติจาก Client Component
 *        ไม่ต้องเขียน fetch, ไม่ต้องกำหนด URL, ไม่ต้อง JSON.stringify เอง
 *     2. เรียก revalidatePath() ได้ตรง ๆ หลังบันทึกเสร็จ
 *        หน้า /scoreboard ของผู้เล่นคนอื่นจึงเห็นคะแนนใหม่ทันที
 *     3. โค้ดทั้งก้อนนี้ทำงานฝั่ง Server เท่านั้น ไม่ถูกส่งไปเบราว์เซอร์
 *   (ส่วน /api/ai/clues เป็น Route Handler เพราะเป็น endpoint ที่ `lib/clues.js`
 *    เรียกด้วย fetch และอาจถูกเรียกจากที่อื่นในอนาคต — คนละรูปแบบการใช้งาน)
 *
 * [กฎความปลอดภัย: ห้ามเชื่อข้อมูลจาก Client]
 *   ฟอร์มตรวจด้วย zodResolver ฝั่ง Client มาแล้วชั้นหนึ่ง แต่ชั้นนั้นเป็นเพียง
 *   เรื่องประสบการณ์ผู้ใช้ ผู้ใช้ปิด JavaScript, แก้ค่าใน DevTools หรือ
 *   ยิง Server Action ตรง ๆ ได้ จึงต้องตรวจซ้ำที่นี่ด้วย schema ก้อนเดียวกัน
 *   (Server Action ทุกตัวเป็น endpoint ที่เข้าถึงได้จากภายนอกโดยปริยาย)
 */

/**
 * บันทึกคะแนนลงกระดานผู้นำ
 *
 * @param {Object} data - { name, gameMode, score, timeSpentSeconds, guessesCount?, correctCount?, firstClueWins? }
 * @returns {Promise<{ ok: true, entry: Object, persisted: boolean } | { ok: false, errors: Record<string, string> }>}
 */
export async function submitScore(data) {
  // ---- 1) ตรวจข้อมูลด้วย schema เดียวกับฝั่ง Client ----
  const parsed = scoreSchema.safeParse(data);

  if (!parsed.success) {
    // ส่ง error กลับเป็น object { ชื่อฟิลด์: ข้อความ } ให้ฟอร์มเอาไปแสดงใต้ช่องกรอกได้
    return { ok: false, errors: flattenScoreErrors(parsed.error) };
  }

  // ---- 2) บันทึกลงคลังฝั่ง Server ----
  try {
    const { entry, persisted } = await addEntry(parsed.data);

    // ---- 3) ล้างแคชหน้า /scoreboard ----
    // ถ้าไม่เรียก ผู้เล่นคนอื่นจะยังเห็นตารางอันดับเวอร์ชันเก่าที่ Next.js แคชไว้
    revalidatePath('/scoreboard');

    return { ok: true, entry, persisted };
  } catch (error) {
    // ไม่ปล่อย error ดิบขึ้นไป เพราะจะทำให้หน้าเกมพังทั้งหน้า
    // บันทึกต้นเหตุไว้ฝั่ง Server แล้วตอบข้อความกลาง ๆ ให้ผู้ใช้
    console.error('[submitScore] บันทึกคะแนนไม่สำเร็จ:', error);
    return {
      ok: false,
      errors: { form: 'บันทึกคะแนนไม่สำเร็จ กรุณาลองอีกครั้ง' },
    };
  }
}
