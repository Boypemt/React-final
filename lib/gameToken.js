/**
 * @file lib/gameToken.js — ซองปิดผนึกสถานะเกม (Sealed Game Token) · Server Only
 *
 * [ปัญหาที่ไฟล์นี้แก้ — ทำไมคำตอบต้องไม่อยู่ฝั่ง Client]
 *   เบราว์เซอร์คือ "สภาพแวดล้อมที่เราไม่เชื่อถือ" (untrusted client)
 *   ทุกอย่างที่ส่งไปถึงเบราว์เซอร์ ผู้เล่นเปิดดูได้หมด ไม่ว่าจะเป็น
 *     - Network tab (ทั้ง payload ที่ส่งไปและ response ที่ตอบกลับ)
 *     - Elements tab (เช่น src ของ <img> ที่ชื่อไฟล์มีชื่อตัวละครติดมาด้วย)
 *     - React DevTools (state/props ทุกตัวใน component tree)
 *   ดังนั้น "ความลับ" (ตัวละครเป้าหมาย) ต้องอยู่ฝั่ง Server เท่านั้น
 *
 * [ทำไมใช้ Token ที่เข้ารหัส ไม่ใช่ Map ในหน่วยความจำ?]
 *   วิธีที่ง่ายกว่าคือเก็บ sessionId -> ตัวละคร ไว้ใน Map ระดับ module
 *   แต่บน Vercel (Serverless) ทุก request อาจตกลงไปที่ instance คนละตัว
 *   และ instance ถูกแช่แข็ง/ฆ่าได้ทุกเมื่อ = Map หายกลางเกม ผู้เล่นเล่นต่อไม่ได้
 *   จึงใช้วิธี "Stateless Token": เอาสถานะเกมใส่ซองที่เข้ารหัสแล้วฝากไว้กับ Client
 *   Server ไม่ต้องจำอะไรเลย แต่ Client ก็อ่านไม่ออกเพราะไม่มีกุญแจ
 *   (แนวคิดเดียวกับ Encrypted Session Cookie / JWE)
 *
 * [ทำไม AES-256-GCM ไม่ใช่แค่ลายเซ็น (HMAC)?]
 *   ถ้าใช้แค่ลายเซ็น payload จะยังอ่านได้ (base64 ไม่ใช่การเข้ารหัส) = คำตอบหลุดทันที
 *   GCM ให้ทั้งสองอย่างในขั้นตอนเดียว:
 *     - ความลับ (Confidentiality): Client อ่าน payload ไม่ออก
 *     - ความสมบูรณ์ (Integrity): ถ้าแก้ไบต์ใดก็ตาม auth tag จะไม่ตรง แล้วถอดรหัสไม่ผ่าน
 *       ผู้เล่นจึงแก้ round หรือ revealedLevel ในซองเองไม่ได้
 */
import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/** รุ่นของรูปแบบ Token — ผูกไว้กับ AAD เพื่อให้ซองรุ่นเก่าใช้กับรุ่นใหม่ไม่ได้ */
const TOKEN_VERSION = 'v1';

/**
 * อายุของซอง 2 ชั่วโมง
 * [ทำไมต้องมีวันหมดอายุ?] กันการเก็บซองเก่าไปใช้ซ้ำแบบไม่จำกัดเวลา (replay)
 * และกันกรณีผู้เล่นเปิดแท็บค้างไว้ข้ามวันแล้วกลับมาเล่นต่อด้วยสถานะที่เก่าเกินจริง
 */
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

const IV_BYTES = 12; // ความยาวมาตรฐานของ nonce สำหรับ AES-GCM
const TAG_BYTES = 16; // auth tag ของ GCM
const KEY_BYTES = 32; // AES-256 ต้องใช้กุญแจ 32 ไบต์

/**
 * Additional Authenticated Data — ไม่ได้ถูกเข้ารหัส แต่ถูกรวมในการคำนวณ auth tag
 * ทำให้ซองจากระบบอื่น/รุ่นอื่นที่ใช้กุญแจเดียวกันเอามาใช้ข้ามกันไม่ได้
 */
const AAD = Buffer.from(`disney-clue-guesser/game-token/${TOKEN_VERSION}`, 'utf8');

/** โหมดที่ยอมรับ — ตรวจตอนถอดรหัสด้วย ไม่ใช่แค่ตอนรับ input */
const VALID_MODES = ['trivia', 'deduction'];

/**
 * อ่านกุญแจจาก GAME_SECRET
 *
 * [ทำไมไม่มี NEXT_PUBLIC_ นำหน้า?] ตัวแปรที่ขึ้นต้นด้วย NEXT_PUBLIC_ จะถูก Next.js
 * ฝังลงไปใน JavaScript Bundle ฝั่ง Client = กุญแจหลุด = ผู้เล่นถอดรหัสซองเองได้
 *
 * @throws {Error} เมื่อยังไม่ได้ตั้งค่า หรือตั้งค่าสั้นเกินไป (Route Handler จับไปตอบ 401)
 */
function getSecretKey() {
  const raw = process.env.GAME_SECRET?.trim();

  if (!raw) {
    throw new Error('GAME_SECRET is not configured');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length < KEY_BYTES) {
    throw new Error(
      `GAME_SECRET must decode to at least ${KEY_BYTES} bytes (got ${key.length})`
    );
  }

  // ถ้าใส่มายาวกว่า 32 ไบต์ก็ใช้แค่ 32 ไบต์แรก (AES-256 รับได้เท่านี้)
  return key.subarray(0, KEY_BYTES);
}

/** ตั้งค่า GAME_SECRET ไว้ถูกต้องแล้วหรือยัง — ให้ Route Handler เช็กก่อนเริ่มทำงาน */
export function isGameSecretConfigured() {
  try {
    getSecretKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * ตรวจรูปร่างของ payload ที่ถอดรหัสออกมา
 *
 * [ทำไมต้องตรวจทั้งที่ถอดรหัสผ่านแล้ว?]
 *   auth tag รับประกันแค่ว่า "ไบต์ไม่ถูกแก้" ไม่ได้รับประกันว่า "ข้อมูลสมเหตุสมผล"
 *   ซองที่เราเคยออกเองในรุ่นก่อนหน้าอาจมีรูปร่างต่างไป ถ้าปล่อยผ่านโค้ดข้างหลังจะพัง
 */
function isValidPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;

  const { mode, targets, round, startedAt, revealedLevel } = payload;

  if (!VALID_MODES.includes(mode)) return false;
  if (!Array.isArray(targets) || targets.length === 0) return false;
  if (!targets.every((id) => Number.isInteger(id) && id > 0)) return false;
  if (!Number.isInteger(round) || round < 1 || round > targets.length) return false;
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;
  if (!Number.isInteger(revealedLevel) || revealedLevel < 1 || revealedLevel > 3) return false;

  return true;
}

/**
 * ปิดผนึกสถานะเกมลงซอง
 *
 * @param {{ mode: 'trivia'|'deduction', targets: number[], round: number, startedAt: number, revealedLevel: number }} payload
 * @returns {string} ซองรูปแบบ base64url ของ [iv | authTag | ciphertext]
 * @throws {Error} เมื่อ GAME_SECRET ไม่ถูกต้อง หรือ payload รูปร่างไม่ผ่าน
 */
export function sealGameToken(payload) {
  if (!isValidPayload(payload)) {
    throw new Error('Refusing to seal a malformed game token payload');
  }

  const key = getSecretKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(AAD);

  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  // แปะ iv กับ auth tag ไว้หน้าซอง — ทั้งสองไม่ใช่ความลับ แต่จำเป็นต่อการถอดรหัส
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

/**
 * แกะซองกลับมาเป็นสถานะเกม
 *
 * ไม่โยน error ออกไป แต่คืนผลลัพธ์แบบ discriminated union
 * เพื่อให้ Route Handler แยกได้ว่าควรตอบ 401 (ซองพัง/หมดอายุ) หรือ 401 (ยังไม่ตั้งค่า secret)
 * โดยไม่ต้องเขียน try/catch ซ้ำกันทุกไฟล์
 *
 * @param {unknown} token
 * @returns {{ ok: true, payload: object } | { ok: false, reason: 'SECRET_MISSING'|'TOKEN_MALFORMED'|'TOKEN_TAMPERED'|'TOKEN_EXPIRED' }}
 */
export function openGameToken(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
    return { ok: false, reason: 'TOKEN_MALFORMED' };
  }

  let key;
  try {
    key = getSecretKey();
  } catch {
    return { ok: false, reason: 'SECRET_MISSING' };
  }

  const sealed = Buffer.from(token, 'base64url');
  if (sealed.length <= IV_BYTES + TAG_BYTES) {
    return { ok: false, reason: 'TOKEN_MALFORMED' };
  }

  const iv = sealed.subarray(0, IV_BYTES);
  const tag = sealed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = sealed.subarray(IV_BYTES + TAG_BYTES);

  let payload;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);

    // decipher.final() จะโยน error ทันทีถ้า auth tag ไม่ตรง
    // = ใครแก้ซอง (เช่นลองสลับ round หรือ revealedLevel) จะมาไม่ถึงบรรทัดถัดไป
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    payload = JSON.parse(plaintext.toString('utf8'));
  } catch {
    return { ok: false, reason: 'TOKEN_TAMPERED' };
  }

  if (!isValidPayload(payload)) {
    return { ok: false, reason: 'TOKEN_TAMPERED' };
  }

  if (Date.now() - payload.startedAt > TOKEN_TTL_MS) {
    return { ok: false, reason: 'TOKEN_EXPIRED' };
  }

  return { ok: true, payload };
}
