/**
 * @file app/api/game/reveal/route.js — POST /api/game/reveal
 *
 * [หน้าที่] เฉลยตัวละครลับเมื่อรอบจบลงโดยที่ผู้เล่นยังไม่ทายถูก
 *   - โหมด Deduction: กดปุ่ม "ยอมแพ้เฉลย"
 *   - โหมด Trivia: หมดเวลา 30 วินาที หรือกด "ข้ามด่าน"
 *
 * [ทำไมต้องมี endpoint แยก ไม่รวมกับ /guess?]
 *   เพราะเจตนาต่างกันโดยสิ้นเชิง: /guess ใช้ "ทาย" (เฉลยเฉพาะเมื่อถูก)
 *   ส่วน /reveal คือการ "ประกาศยอมแพ้" ซึ่งเป็นจุดเดียวที่คำตอบถูกปล่อยออกไปได้
 *   โดยไม่ต้องทายถูก แยกไฟล์ไว้ทำให้ตรวจทานได้ง่ายว่า "คำตอบหลุดออกจาก Server ได้กี่ทาง"
 *   (คำตอบ: สามทางเท่านั้น — /guess ตอนถูก, /reveal, และเงาภาพจาก /silhouette)
 *
 * Request:  { token }
 * Response: { character, roundOver: true, nextToken? }
 */
import { NextResponse } from 'next/server';
import {
  jsonError,
  readJsonBody,
  resolveGameSession,
  sealNextRound,
  toRevealedCharacter,
} from '@/lib/gameRound';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const session = resolveGameSession(parsed.body.token);
    if (!session.ok) return session.response;

    const { payload, target } = session;

    const body = {
      character: toRevealedCharacter(target),
      roundOver: true,
    };

    const nextToken = sealNextRound(payload);
    if (nextToken) body.nextToken = nextToken;

    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/game/reveal] unexpected error:', error);
    return jsonError('ขอเฉลยไม่สำเร็จ กรุณาลองอีกครั้ง', 400);
  }
}
