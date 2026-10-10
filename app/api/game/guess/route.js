/**
 * @file app/api/game/guess/route.js — POST /api/game/guess
 *
 * [หน้าที่] Server เป็นคนตัดสินว่าเดาถูกหรือผิด แล้วตอบกลับเท่าที่เกมต้องใช้จริง
 *
 * [ทำไมต้องให้ Server ตัดสิน?]
 *   ของเดิม GameContext เรียก validateAnswer() กับ compareAttributes() ฝั่ง Client
 *   ซึ่งทำได้เพราะ Client ถือตัวละครเป้าหมายไว้เต็ม ๆ — นั่นคือตัวช่องโหว่
 *   พอย้ายมาฝั่ง Server แล้ว Client ไม่จำเป็นต้องรู้คำตอบอีกเลย รู้แค่ผลลัพธ์
 *
 * Request:  { token, guessId }
 * Response (deduction): { correct, comparison, character?, roundOver }
 * Response (trivia):    { correct, character?, roundOver, nextToken? }
 *   character จะมีให้เฉพาะ "ตอนเดาถูก" เท่านั้น (ยอมแพ้/หมดเวลาใช้ /api/game/reveal)
 */
import { NextResponse } from 'next/server';
import { compareAttributes } from '@/lib/gameLogic';
import {
  findCuratedCharacter,
  jsonError,
  readJsonBody,
  resolveGameSession,
  sealNextRound,
  toRevealedCharacter,
} from '@/lib/gameRound';

export const runtime = 'nodejs';

/**
 * ตัดฟิลด์ที่ UI ไม่ได้ใช้แต่เผยข้อมูลเป้าหมายออกจากผลเปรียบเทียบ
 *
 * compareAttributes() คืน targetFilmCount (จำนวนหนังของตัวละครลับแบบตัวเลขเป๊ะ ๆ) มาด้วย
 * ซึ่งตารางเปรียบเทียบไม่เคยแสดง — มันแสดงแค่ลูกศร ▲/▼ ว่ามากกว่าหรือน้อยกว่า
 * ปล่อยเลขจริงออกไปเท่ากับแจกตัวกรองที่แคบมาก ๆ ให้คนเปิด Network tab ฟรี ๆ
 * (ผู้เล่น 2-3 ตาก็คัดเหลือตัวละครไม่กี่ตัวจาก 50 ตัวได้) จึงถอดออกก่อนตอบ
 */
function toPublicComparison(comparison) {
  if (!comparison) return null;
  const { targetFilmCount: _targetFilmCount, ...safe } = comparison;
  return safe;
}

export async function POST(request) {
  try {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const { token, guessId } = parsed.body;

    const session = resolveGameSession(token);
    if (!session.ok) return session.response;

    const { payload, target } = session;

    // ตัวละครที่เดาต้องอยู่ในชุด curated เท่านั้น — กันยิง id มั่วเพื่อหยั่งเชิงระบบ
    const guessed = findCuratedCharacter(guessId);
    if (!guessed) {
      return jsonError('guessId ต้องเป็นรหัสตัวละครในชุด curated', 400);
    }

    const correct = guessed._id === target._id;
    const roundOver = correct;

    const body = { correct, roundOver };

    // โหมด Deduction ต้องได้ตารางเปรียบเทียบคุณลักษณะทุกตา เพราะนั่นคือกลไกของเกม
    if (payload.mode === 'deduction') {
      body.comparison = toPublicComparison(compareAttributes(guessed, target));
    }

    // เฉลยตัวละครได้ "เฉพาะตอนเดาถูก" — ก่อนหน้านั้น Client ต้องไม่มีทางรู้
    if (correct) {
      body.character = toRevealedCharacter(target);

      const nextToken = sealNextRound(payload);
      if (nextToken) body.nextToken = nextToken;
    }

    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/game/guess] unexpected error:', error);
    return jsonError('ส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้ง', 400);
  }
}
