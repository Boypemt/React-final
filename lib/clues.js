import { getFallbackClues } from '@/lib/ai/fallbackClues';
import curatedCharacters from '@/lib/data/curated-disney.json';

/**
 * Service Adapter ดึงคำใบ้สำหรับตัวละคร
 *
 * [เจ้าของไฟล์เดิม] ปัณณวิชญ์ (682110181) — วาง Adapter ไว้รอ
 * [ผู้ต่องาน]      เมธาสิทธิ์ (682110189) — เชื่อม POST /api/ai/clues ตาม "ไกด์ 1" เรียบร้อย
 *
 * [Server หรือ Client? — Decision Framework]
 *   ฟังก์ชันนี้ถูกเรียกจาก context/GameContext.jsx ซึ่งเป็น Client Component
 *   จึงทำงานในเบราว์เซอร์ และ fetch ด้วย path แบบ relative ('/api/ai/clues') ได้
 *   เหตุผลที่ต้องยิงผ่าน Route Handler ของเราเองแทนการยิง Gemini ตรง ๆ:
 *     - GEMINI_API_KEY ต้องไม่หลุดออกจาก Server (กฎความปลอดภัยใน Proposal ข้อ 3)
 *     - แคช batch 10 คำใบ้อยู่ฝั่ง Server ผู้เล่นทุกคนใช้ร่วมกัน ประหยัดโควตา AI
 *   ส่วน Fallback ใช้ไฟล์ JSON ในเครื่อง จึงทำงานได้แม้ออฟไลน์หรือ API ล่ม
 *
 * @param {number} characterId - รหัสตัวละคร Disney
 * @param {string} characterName - ชื่อตัวละคร Disney
 * @returns {Promise<[string, string, string]>} คำใบ้ 3 ระดับ [ยาก, ปานกลาง, ง่าย]
 */
export async function getCharacterClues(characterId, characterName) {
  try {
    // ตัดการรอที่ 12 วินาที (Route Handler ตั้ง timeout ของ Gemini ไว้ 8 วินาที
    // บวกเวลาเดินทางบนเครือข่าย) กันหน้าเกมค้างที่ข้อความ "กำลังดาวน์โหลดคำใบ้..."
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let res;
    try {
      res = await fetch('/api/ai/clues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, characterName }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      throw new Error(`/api/ai/clues responded ${res.status}`);
    }

    const data = await res.json();

    // ตรวจรูปร่างข้อมูลก่อนใช้ — ClueBox คาดหวัง array ของ 3 สตริงเสมอ
    // ถ้าปล่อยค่าผิดรูปเข้าไป หน้าเกมจะพังทั้งหน้า (White Screen of Death)
    const isValidShape =
      Array.isArray(data?.clues) &&
      data.clues.length === 3 &&
      data.clues.every((clue) => typeof clue === 'string' && clue.trim().length > 0);

    if (!isValidShape) {
      throw new Error('/api/ai/clues returned an unexpected shape');
    }

    return data.clues;
  } catch (error) {
    // แผนสำรอง: กลับไปใช้ mock-clues.json / คำใบ้ Template เหมือนพฤติกรรมเดิม
    // เพื่อให้เกมยังเล่นต่อได้แม้ Route Handler หรือเครือข่ายมีปัญหา
    console.error('[clues] fetch failed, using local fallback clues:', error);

    const character = curatedCharacters.find((c) => c._id === characterId) || null;
    return getFallbackClues(characterId, characterName, character);
  }
}
