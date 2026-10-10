/**
 * @file app/api/game/start/route.js — POST /api/game/start
 *
 * [หน้าที่] Server เป็นคนสุ่มตัวละครเป้าหมาย แล้วเก็บไว้ใน "ซองที่เข้ารหัส" (sealed token)
 *
 * [ทำไมย้ายการสุ่มมาฝั่ง Server? — นี่คือหัวใจของการแก้ช่องโหว่]
 *   โค้ดเดิมสุ่มตัวละครใน GameContext ซึ่งเป็น Client Component
 *   คำตอบจึงอยู่ใน React state ตั้งแต่วินาทีแรก = เปิด React DevTools ดูได้เลย
 *   ตอนนี้ Client ได้รับแค่ซองที่อ่านไม่ออก + เลขด่าน ไม่มีทั้งชื่อ, id และรูป
 *
 * Response: { token, round, totalRounds }
 */
import { NextResponse } from 'next/server';
import { createGameSession, jsonError, readJsonBody, ROUNDS_PER_MODE } from '@/lib/gameRound';
import { isGameSecretConfigured } from '@/lib/gameToken';

// node:crypto ต้องใช้ Node runtime (ไม่ใช่ Edge) — ประกาศไว้ให้ชัดกันตั้งค่าเพี้ยนภายหลัง
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    if (!isGameSecretConfigured()) {
      console.error('[api/game/start] GAME_SECRET is missing or shorter than 32 bytes');
      return jsonError(
        'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า GAME_SECRET — ดูวิธีสร้างได้ใน .env.local.example',
        401
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const { mode } = parsed.body;
    if (!Object.hasOwn(ROUNDS_PER_MODE, mode)) {
      return jsonError("mode ต้องเป็น 'trivia' หรือ 'deduction'", 400);
    }

    const session = createGameSession(mode);

    return NextResponse.json(session, {
      // ซองนี้ผูกกับผู้เล่นคนเดียวและรอบเดียว ห้ามให้ proxy หรือเบราว์เซอร์เก็บไว้ใช้ซ้ำ
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    // Proposal กำหนดว่า API ต้องไม่หลุดเป็น 500 — บันทึก log ไว้ฝั่ง Server เท่านั้น
    console.error('[api/game/start] unexpected error:', error);
    return jsonError('เริ่มเกมไม่สำเร็จ กรุณาลองอีกครั้ง', 400);
  }
}
