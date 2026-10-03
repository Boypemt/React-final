/**
 * @file types.js - Central Data Contracts for Disney Clue Guesser (Team Sigma)
 * ไฟล์สัญญากลางสำหรับกำหนด Interface การแลกเปลี่ยนข้อมูลระหว่างสมาชิก 3 คน
 */

/**
 * 1. สัญญาสำหรับ เมธาสิทธิ์ (682110189) - AI Route Handler
 * @typedef {Object} AICluesRequest
 * @property {number} characterId - รหัสตัวละครจาก Disney API (เช่น 4703)
 * @property {string} characterName - ชื่อตัวละครภาษาอังกฤษ (เช่น "Mickey Mouse")
 * 
 * @typedef {Object} AICluesResponse
 * @property {number} characterId
 * @property {string} characterName
 * @property {[string, string, string]} clues - คำใบ้ [ระดับ 1 (ยาก), ระดับ 2 (ปานกลาง), ระดับ 3 (ง่าย)]
 */

/**
 * 2. สัญญาสำหรับ สิรวิชญ์ (682110199) - Scoreboard Route Handler & Form
 * @typedef {Object} GameResultPayload
 * @property {string} playerName - ชื่อผู้เล่น (2-30 ตัวอักษร)
 * @property {number} score - คะแนนรวมทั้ง 5 ด่าน
 * @property {number} roundsPlayed - จำนวนด่านทั้งหมด (5 ด่าน)
 * @property {number} correctAnswers - จำนวนด่านที่ทายถูก
 * @property {number} guessesCount - จำนวนครั้งที่เดารวม
 * @property {number} timeSpentSeconds - เวลารวมที่ใช้ไป (วินาที)
 * @property {string} mode - โหมดการเล่น (เช่น "classic")
 * @property {string} playedAt - เวลาที่เล่นจบ ISO String
 */

/**
 * 3. ข้อมูลตัวละครมาตรฐานจาก Disney API
 * @typedef {Object} DisneyCharacter
 * @property {number} _id - รหัสตัวละคร
 * @property {string} name - ชื่อตัวละคร
 * @property {string} [imageUrl] - ลิงก์รูปภาพ
 * @property {string[]} films - รายชื่อภาพยนตร์
 * @property {string[]} shortFilms - ภาพยนตร์สั้น
 * @property {string[]} tvShows - ซีรีส์ทีวี
 * @property {string[]} videoGames - วิดีโอเกม
 * @property {string[]} parkAttractions - เครื่องเล่นในสวนสนุก
 */

export const CONTRACT_VERSIONS = {
  version: '1.0.0',
  team: 'Sigma'
};
