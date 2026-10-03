import mockClues from './data/mock-clues.json';

/**
 * Service Adapter ดึงคำใบ้สำหรับตัวละคร
 * [ไกด์สำหรับ เมธาสิทธิ์ 682110189]:
 * เมื่อทำ Route Handler POST /api/ai/clues เสร็จ
 * ให้แก้ฟังก์ชันนี้เพื่อยิง fetch('/api/ai/clues') จริงแทน mockClues
 * 
 * @param {number} characterId - รหัสตัวละคร Disney
 * @param {string} characterName - ชื่อตัวละคร Disney
 * @returns {Promise<[string, string, string]>} คำใบ้ 3 ระดับ
 */
export async function getCharacterClues(characterId, characterName) {
  // ตรวจสอบจาก Mock Data ในเครื่องก่อนเพื่อความรวดเร็วและเล่นออฟไลน์ได้
  const idStr = String(characterId);
  if (mockClues[idStr] && mockClues[idStr].length === 3) {
    return mockClues[idStr];
  }

  // แผนสำรอง กรณีเป็นตัวละครที่ไม่มีใน Mock Clues
  return [
    `ตัวละครเอกที่มีชื่อเสียงในจักรวาล Disney (${characterName})`,
    `ปรากฏตัวในสื่อบันเทิงของดิสนีย์และมีเอกลักษณ์โดดเด่นไม่ซ้ำใคร`,
    `ตัวละครนี้มีชื่อขึ้นต้นด้วยตัวอักษร "${characterName ? characterName[0].toUpperCase() : '?'}"`
  ];
}
