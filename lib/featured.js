/**
 * @file lib/featured.js — เลือก "ตัวละครแนะนำประจำวัน" แบบคงที่ตลอดวัน
 * ผู้เขียน: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [Server หรือ Client?]
 *   เป็นฟังก์ชันบริสุทธิ์ (Pure Function) ใช้ได้ทั้งสองฝั่ง ไม่มี secret ไม่มี Web API
 *   แต่ในทางปฏิบัติถูกเรียกจาก components/home/FeaturedCharacter.jsx ซึ่งเป็น
 *   Server Component เท่านั้น เพื่อให้ HTML ที่ส่งถึงผู้เล่นมีตัวละครมาแล้วตั้งแต่แรก
 *   (ไม่มีจังหวะกระพริบ และไม่เสี่ยง Hydration Mismatch จากการสุ่มคนละค่ากันสองฝั่ง)
 *
 * [ทำไมไม่ใช้ Math.random()?]
 *   ถ้าสุ่มจริง ผู้เล่นรีเฟรชหน้าเดิมก็ได้ตัวละครใหม่ทุกครั้ง คำว่า "ประจำวัน" จะไม่มีความหมาย
 *   และถ้าสุ่มทั้งสองฝั่ง (Server กับ Client) จะได้ค่าไม่ตรงกัน = React ขึ้น Hydration Mismatch
 *   จึงใช้วิธี "แปลงวันที่เป็นตัวเลขแบบคงที่" (Deterministic Hash) แทน
 *   วันเดียวกัน -> ได้ index เดิมเสมอ ไม่ว่าจะเรียกกี่ครั้ง จากเครื่องไหน
 */

/** โซนเวลาที่ใช้ตัดวัน — ผู้เล่นกลุ่มเป้าหมายอยู่ไทย ตัวละครจึงควรเปลี่ยนตอนเที่ยงคืนไทย */
const TIME_ZONE = 'Asia/Bangkok';

/**
 * คืนวันที่ปัจจุบันตามเวลาไทย ในรูปแบบ YYYY-MM-DD
 *
 * ใช้ 'en-CA' เพราะ locale นี้ให้รูปแบบ YYYY-MM-DD ตรง ๆ อยู่แล้ว
 * และกำหนด timeZone ชัดเจน จึงไม่ขึ้นกับโซนเวลาของเครื่อง Server
 * (ถ้า deploy ขึ้น Vercel ที่รันด้วย UTC ผลลัพธ์ก็ยังเป็นวันของไทยเสมอ)
 *
 * @param {Date} [now] - เวลาที่ต้องการแปลง (ใส่เองได้เพื่อเทส)
 * @returns {string} เช่น "2026-10-07"
 */
export function getBangkokDateString(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * แปลงข้อความวันที่ให้เป็นลำดับใน pool ด้วย FNV-1a hash
 *
 * เลือก FNV-1a เพราะกระจายค่าได้ดีแม้ input ต่างกันแค่ตัวเลขวันเดียว
 * (ถ้าใช้วิธีบวกรหัสตัวอักษรเฉย ๆ วันที่ใกล้กันจะได้ตัวละครติดกันเป็นแถว)
 * ใช้ Math.imul เพื่อให้การคูณอยู่ในขอบเขต 32-bit เหมือนกันทุก JS engine
 *
 * @param {string} seed - ข้อความต้นทาง เช่น "2026-10-07"
 * @param {number} poolSize - จำนวนตัวละครทั้งหมด
 * @returns {number} index ในช่วง 0..poolSize-1
 */
export function pickIndexFromSeed(seed, poolSize) {
  if (!Number.isInteger(poolSize) || poolSize <= 0) return 0;

  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  // hash อาจเป็นลบเพราะ overflow แบบ signed 32-bit จึงต้อง abs ก่อนหา mod
  return Math.abs(hash) % poolSize;
}

/**
 * คืนตัวละครแนะนำประจำวัน
 *
 * @param {Array<Object>} pool - รายชื่อตัวละคร (lib/data/curated-disney.json)
 * @param {Date} [now] - เวลาที่ต้องการคำนวณ (ใส่เองได้เพื่อเทส)
 * @returns {{ character: Object|null, dateString: string, index: number }}
 */
export function getFeaturedCharacter(pool, now = new Date()) {
  const dateString = getBangkokDateString(now);

  if (!Array.isArray(pool) || pool.length === 0) {
    return { character: null, dateString, index: 0 };
  }

  const index = pickIndexFromSeed(dateString, pool.length);
  return { character: pool[index], dateString, index };
}
