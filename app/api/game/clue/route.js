/**
 * @file app/api/game/clue/route.js — POST /api/game/clue
 *
 * [หน้าที่] ส่งคำใบ้ "ทีละระดับ" ของตัวละครเป้าหมายในรอบปัจจุบัน
 *
 * [สองช่องโหว่ที่ไฟล์นี้ปิด]
 *   1. ของเดิมส่งคำใบ้ครบทั้ง 3 ระดับมาพร้อมกัน แล้วให้ ClueBox ปิดบัง 2 ระดับด้วย CSS
 *      ซึ่ง "ปิดแค่สายตา" — เปิด Network tab ก็อ่านคำใบ้ที่ยังล็อกอยู่ได้ครบ
 *      ตอนนี้ Server ส่งมาแค่ระดับที่ปลดล็อกจริง และปฏิเสธถ้าขอข้ามระดับ
 *   2. ของเดิมตอบ characterName กลับมาด้วย = เฉลยคำตอบตรง ๆ ใน response
 *      ตอนนี้ response ไม่มีทั้งชื่อและ id ของตัวละครเลย
 *
 * Request:  { token, level }
 * Response: { clue, level, revealedLevel, source, token }
 */
import { NextResponse } from 'next/server';
import { getCluesForCharacter } from '@/lib/ai/cluePipeline';
import {
  jsonError,
  MAX_CLUE_LEVEL,
  readJsonBody,
  resealSession,
  resolveGameSession,
} from '@/lib/gameRound';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const { token, level } = parsed.body;

    const session = resolveGameSession(token);
    if (!session.ok) return session.response;

    const { payload, target } = session;

    if (!Number.isInteger(level) || level < 1 || level > MAX_CLUE_LEVEL) {
      return jsonError(`level ต้องเป็นจำนวนเต็ม 1-${MAX_CLUE_LEVEL}`, 400);
    }

    // [กฎสำคัญ] ปลดล็อกได้แค่ "ระดับถัดไปทีละขั้น" เท่านั้น
    // ถ้าปล่อยให้ขอ level 3 ได้เลยตั้งแต่ต้น ผู้เล่นก็ยิง API ตรง ๆ เอาคำใบ้ง่ายสุด
    // ไปเฉลยได้ฟรีโดยไม่เสียคะแนน — ซึ่งเป็นการโกงที่ UI มองไม่เห็น
    if (level > payload.revealedLevel + 1) {
      return jsonError('ยังปลดล็อกคำใบ้ระดับนี้ไม่ได้', 400);
    }

    // ใช้สายการผลิตเดิมทั้งหมด (แคช → ด่าน curated → ยิง Gemini → Fallback)
    // แต่หยิบออกไปใช้แค่ข้อเดียวตามระดับที่ขอ ไม่ส่งทั้งชุดออกไป
    const { clues, source } = await getCluesForCharacter(target);

    const revealedLevel = Math.max(payload.revealedLevel, level);

    return NextResponse.json(
      {
        clue: clues[level - 1],
        level,
        revealedLevel,
        source,
        // ออกซองใหม่ที่จำได้ว่า "ปลดล็อกถึงระดับไหนแล้ว"
        // Client เก็บซองนี้ไว้ใช้ครั้งต่อไป แต่แก้ค่าในซองเองไม่ได้ (auth tag จะไม่ตรง)
        token: resealSession(payload, { revealedLevel }),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[api/game/clue] unexpected error:', error);
    return jsonError('ขอคำใบ้ไม่สำเร็จ กรุณาลองอีกครั้ง', 400);
  }
}
