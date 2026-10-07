/**
 * @file lib/ai/fallbackClues.js — คำใบ้สำรองเมื่อ AI ใช้งานไม่ได้
 * ผู้รับผิดชอบ: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [Server หรือ Client?] — ไฟล์นี้ "ใช้ได้ทั้งสองฝั่ง" โดยตั้งใจ
 *   ไม่มี secret ไม่มี Web API อ่านแค่ JSON ในโปรเจกต์
 *   เหตุผล: Route Handler ฝั่ง Server เรียกใช้เป็นแผนสำรองเมื่อ Gemini ล้ม
 *   และถ้าอนาคตอยากให้ฝั่ง Client กันเหนียวตอน network หลุด ก็ import ได้เลย
 *   โดยไม่ทำให้ Bundle บวมหรือคีย์หลุด (ต่างจาก lib/ai/gemini.js ที่เป็น server-only)
 */
import mockClues from '@/lib/data/mock-clues.json';

/**
 * สร้างคำใบ้ 3 ระดับแบบ Template จากข้อมูลตัวละครที่มีอยู่ในเครื่อง
 * ใช้เมื่อตัวละครนั้นไม่มีใน mock-clues.json
 *
 * @param {string} characterName
 * @param {Object} [character] - ข้อมูลจาก curated-disney.json (อาจเป็น null ถ้าหาไม่เจอ)
 * @returns {[string, string, string]} [hard, medium, easy]
 */
function buildTemplateClues(characterName, character) {
  const name = String(characterName || '').trim();
  const films = Array.isArray(character?.films) ? character.films : [];
  const tvShows = Array.isArray(character?.tvShows) ? character.tvShows : [];
  const firstLetter = name ? name[0].toUpperCase() : '?';

  // ระดับ 1 (ยาก): พูดถึงผลงานแบบไม่เอ่ยชื่อเรื่อง
  const hard = films.length
    ? `ตัวละครนี้มีผลงานภาพยนตร์รวม ${films.length} เรื่องในจักรวาล Disney และเป็นที่จดจำของแฟน ๆ มาหลายยุคสมัย`
    : 'ตัวละครที่ปรากฏตัวในสื่อบันเทิงของ Disney และมีเอกลักษณ์เฉพาะตัวที่ไม่ซ้ำใคร';

  // ระดับ 2 (ปานกลาง): เปิดจำนวนผลงานทีวี/หนัง ให้ขอบเขตแคบลง
  let medium;
  if (tvShows.length) {
    medium = `เคยออกจอแก้วในซีรีส์ทีวีมาแล้ว ${tvShows.length} เรื่อง นอกเหนือจากผลงานภาพยนตร์`;
  } else if (films.length > 1) {
    medium = `ปรากฏตัวในภาพยนตร์หลายภาคต่อเนื่องกัน รวมแล้วมากถึง ${films.length} เรื่อง`;
  } else {
    medium = 'เป็นตัวละครที่มีบทบาทโดดเด่นจนถูกนำไปทำเป็นสินค้าและเครื่องเล่นในสวนสนุก';
  }

  // ระดับ 3 (ง่าย): เฉลยชื่อเรื่อง + อักษรตัวแรก (ตามกฎคือ first-letter ใช้ได้แค่ระดับง่าย)
  const easy = films.length
    ? `ปรากฏตัวในภาพยนตร์เรื่อง "${films[0]}" และชื่อขึ้นต้นด้วยตัวอักษร "${firstLetter}"`
    : `ตัวละคร Disney ที่ชื่อขึ้นต้นด้วยตัวอักษร "${firstLetter}"`;

  return [hard, medium, easy];
}

/**
 * ขอคำใบ้สำรอง 3 ระดับ — ฟังก์ชันนี้ "ห้ามโยน error" เด็ดขาด
 * เพราะมันคือด่านสุดท้ายก่อนที่ผู้เล่นจะเจอหน้าจอพัง
 *
 * ลำดับการหา:
 *   1. mock-clues.json (คำใบ้ที่ปัณณวิชญ์เขียนไว้ คุณภาพดีที่สุด)
 *   2. Template จากข้อมูลจริงใน curated-disney.json
 *
 * @param {number|string} characterId
 * @param {string} characterName
 * @param {Object} [character] - ข้อมูลจาก curated-disney.json
 * @returns {[string, string, string]} คำใบ้ [ยาก, ปานกลาง, ง่าย]
 */
export function getFallbackClues(characterId, characterName, character) {
  const idStr = String(characterId);
  const preset = mockClues[idStr];

  if (Array.isArray(preset) && preset.length === 3) {
    return [preset[0], preset[1], preset[2]];
  }

  return buildTemplateClues(characterName, character);
}
