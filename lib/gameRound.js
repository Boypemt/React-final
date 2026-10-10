/**
 * @file lib/gameRound.js — ตัวช่วยฝั่ง Server สำหรับจัดการรอบเกม · Server Only
 *
 * [หน้าที่] รวมงานที่ Route Handler ทั้ง 5 ตัวใต้ app/api/game/ ต้องใช้ร่วมกัน
 *   - สุ่มตัวละครเป้าหมาย (ความลับ ห้ามหลุดถึง Client)
 *   - แกะซอง Token แล้วหาว่า "รอบนี้เป้าหมายคือใคร"
 *   - ประกอบ response มาตรฐาน { error } พร้อม status
 *
 * [ทำไมแยกเป็น lib/ ไม่ใช่ไฟล์ใต้ app/api/?]
 *   เพื่อให้ 'server-only' คุ้มครองได้ชัดเจน และกันทีมเผลอ import จาก Client Component
 *   (ถ้ามีใครเผลอ import ไฟล์นี้ในฝั่ง Client, build จะพังทันที = เจอก่อนขึ้น production)
 */
import 'server-only';
import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import curatedCharacters from '@/lib/data/curated-disney.json';
import { openGameToken, sealGameToken } from '@/lib/gameToken';

/** จำนวนด่านของแต่ละโหมด — Trivia 5 ด่าน, Deduction ตัวละครลับ 1 ตัว */
export const ROUNDS_PER_MODE = { trivia: 5, deduction: 1 };

/** คำใบ้มี 3 ระดับ (ยาก → ปานกลาง → ง่าย) */
export const MAX_CLUE_LEVEL = 3;

/** ตอบกลับความผิดพลาดในรูปแบบเดียวกันทุกที่: { error } */
export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * อ่าน JSON body อย่างปลอดภัย
 * @returns {Promise<{ ok: true, body: object } | { ok: false, response: NextResponse }>}
 */
export async function readJsonBody(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError('Request body ไม่ใช่ JSON ที่ถูกต้อง', 400) };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, response: jsonError('Request body ต้องเป็น JSON object', 400) };
  }

  return { ok: true, body };
}

/**
 * สุ่มตัวละครไม่ซ้ำกัน n ตัวจากชุด curated ด้วย Fisher-Yates
 *
 * [ทำไมใช้ crypto.randomInt ไม่ใช่ Math.random?]
 *   Math.random ของ V8 เป็น PRNG ที่ "เดาสถานะต่อไปได้" ถ้ารู้ผลลัพธ์ก่อนหน้าพอสมควร
 *   ในเกมทายคำตอบ ความสุ่มคือส่วนหนึ่งของความลับ — ถ้าเดาลำดับการสุ่มได้
 *   ก็เท่ากับเดาคำตอบได้โดยไม่ต้องแกะ Token เลย จึงใช้ CSPRNG ให้ปิดช่องนี้ไปเลย
 *   (ราคาที่จ่ายคือความเร็วที่ช้าลงระดับไมโครวินาที ซึ่งไม่มีผลกับเกม)
 */
function pickRandomCharacterIds(count) {
  const pool = curatedCharacters.map((character) => character._id);

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * สร้าง session ใหม่: สุ่มเป้าหมายแล้วปิดผนึกลงซอง
 *
 * @param {'trivia'|'deduction'} mode
 * @returns {{ token: string, round: number, totalRounds: number }}
 */
export function createGameSession(mode) {
  const totalRounds = ROUNDS_PER_MODE[mode];
  const targets = pickRandomCharacterIds(totalRounds);

  const token = sealGameToken({
    mode,
    targets,
    round: 1,
    startedAt: Date.now(),
    revealedLevel: 1,
  });

  return { token, round: 1, totalRounds: targets.length };
}

/**
 * แกะซองแล้วหาตัวละครเป้าหมายของรอบปัจจุบัน
 *
 * @param {unknown} token
 * @returns {{ ok: true, payload: object, target: object } | { ok: false, response: NextResponse }}
 */
export function resolveGameSession(token) {
  const opened = openGameToken(token);

  if (!opened.ok) {
    // [ทำไมไม่บอกสาเหตุละเอียด?] ข้อความ error ที่ละเอียดเกินไปช่วยให้คนลอง
    // แก้ซองรู้ว่า "แก้ตรงไหนแล้วใกล้สำเร็จ" จึงบอกแค่พอให้ผู้เล่นจริงเริ่มเกมใหม่ได้
    if (opened.reason === 'SECRET_MISSING') {
      return {
        ok: false,
        response: jsonError('เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า GAME_SECRET', 401),
      };
    }
    if (opened.reason === 'TOKEN_EXPIRED') {
      return { ok: false, response: jsonError('รอบเกมหมดอายุแล้ว กรุณาเริ่มเกมใหม่', 401) };
    }
    return { ok: false, response: jsonError('ซองสถานะเกมไม่ถูกต้อง กรุณาเริ่มเกมใหม่', 401) };
  }

  const { payload } = opened;
  const targetId = payload.targets[payload.round - 1];
  const target = curatedCharacters.find((character) => character._id === targetId);

  if (!target) {
    // เกิดได้เฉพาะกรณี curated-disney.json ถูกแก้หลังจากออกซองไปแล้ว
    return { ok: false, response: jsonError('รอบเกมนี้ใช้ต่อไม่ได้แล้ว กรุณาเริ่มเกมใหม่', 401) };
  }

  return { ok: true, payload, target };
}

/** ออกซองใหม่สำหรับรอบปัจจุบัน (เช่นหลังเปิดคำใบ้เพิ่ม) */
export function resealSession(payload, changes = {}) {
  return sealGameToken({ ...payload, ...changes });
}

/**
 * ออกซองของ "ด่านถัดไป" — คืน null ถ้าเล่นครบทุกด่านแล้ว
 *
 * [ทำไมต้องแยกเป็นซองใบใหม่ ไม่แก้ซองใบเดิม?]
 *   ระหว่างที่ Modal สรุปผลด่านนี้ยังค้างอยู่ ผู้เล่นยังต้องเห็นเงาของตัวละครด่านนี้
 *   ถ้ารีบเลื่อน round ในซองใบเดิม เงาจะกระพริบเป็นตัวละครด่านหน้าทันที
 *   จึงให้ Client ถือซองสองใบ แล้วค่อยสลับตอนกดปุ่ม "เข้าสู่ด่านถัดไป"
 */
export function sealNextRound(payload) {
  if (payload.round >= payload.targets.length) return null;

  return sealGameToken({
    ...payload,
    round: payload.round + 1,
    revealedLevel: 1,
  });
}

/**
 * ข้อมูลตัวละครที่ "ปล่อยให้ Client เห็นได้" — ใช้เฉพาะตอนเฉลยแล้วเท่านั้น
 * ตัดฟิลด์ที่เกมไม่ได้ใช้ออก (shortFilms, videoGames, parkAttractions)
 * เพื่อให้ response เล็กและไม่เผยข้อมูลเกินจำเป็น
 */
export function toRevealedCharacter(target) {
  return {
    _id: target._id,
    name: target.name,
    imageUrl: target.imageUrl ?? null,
    films: Array.isArray(target.films) ? target.films : [],
  };
}

/** ตัวละครที่ผู้เล่นเดา ต้องอยู่ในชุด curated เท่านั้น (กัน payload ขยะและกันยิง id มั่ว) */
export function findCuratedCharacter(id) {
  if (!Number.isInteger(id) || id <= 0) return null;
  return curatedCharacters.find((character) => character._id === id) ?? null;
}
