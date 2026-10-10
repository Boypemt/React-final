/**
 * @file types.js - Central Data Contracts for Disney Clue Guesser (Team Sigma)
 * ไฟล์สัญญากลางสำหรับกำหนด Interface การแลกเปลี่ยนข้อมูลระหว่างสมาชิก 3 คน
 */

/**
 * 1. สัญญาสำหรับ เมธาสิทธิ์ (682110189) - AI Route Handler
 *
 * [POST /api/ai/clues] — เครื่องมืออุ่นแคชก่อนเดโม เปิดเฉพาะตอน development
 *   เดิมเป็นทางที่เกมใช้จริง แต่ตัดออกแล้วเพราะทั้ง request และ response
 *   ต้องเอ่ยถึงตัวละครเป้าหมายตรง ๆ = คำตอบหลุดถึงเบราว์เซอร์
 *
 * @typedef {Object} AICluesRequest
 * @property {number} characterId - รหัสตัวละครในชุด curated (เช่น 4703)
 *
 * @typedef {Object} AICluesResponse
 * @property {[string, string, string]} clues - คำใบ้ [ระดับ 1 (ยาก), ระดับ 2 (ปานกลาง), ระดับ 3 (ง่าย)]
 * @property {'ai'|'cache'|'fallback'} source - ที่มาของคำใบ้ชุดนี้
 */

/**
 * 1.1 สัญญาของกระดานเล่นเกมฝั่ง Server (app/api/game/*)
 *
 * [กฎกลางของทุก endpoint ในกลุ่มนี้]
 *   - สถานะเกมเดินทางไปกับ `token` ซึ่งเป็นซองที่เข้ารหัส AES-256-GCM ฝั่ง Server
 *     Client อ่านไม่ออกและแก้ไม่ได้ (ดู lib/gameToken.js)
 *   - ชื่อ / รหัส / รูปของตัวละครเป้าหมายจะโผล่ใน response ได้ 3 กรณีเท่านั้น
 *     คือทายถูก, ยอมแพ้ และหมดเวลา
 *   - ผิดพลาดเมื่อไรตอบ { error } พร้อม status 400 (input ไม่ถูก) หรือ 401 (ซองไม่ผ่าน)
 *     ไม่มีการปล่อย 500 ออกไป
 *
 * @typedef {Object} GameStartResponse
 * @property {string} token - ซองสถานะเกมของด่านแรก
 * @property {number} round - เลขด่านปัจจุบัน (เริ่มที่ 1)
 * @property {number} totalRounds - จำนวนด่านทั้งหมด (trivia 5, deduction 1)
 *
 * @typedef {Object} GameClueResponse
 * @property {string} clue - ข้อความคำใบ้ "ของระดับที่ขอมาเท่านั้น"
 * @property {number} level - ระดับที่ขอ (1-3)
 * @property {number} revealedLevel - ระดับสูงสุดที่ปลดล็อกแล้ว
 * @property {'ai'|'cache'|'fallback'} source
 * @property {string} token - ซองใบใหม่ที่จำ revealedLevel ล่าสุดไว้
 *
 * @typedef {Object} GameGuessResponse
 * @property {boolean} correct
 * @property {boolean} roundOver
 * @property {Object} [comparison] - ผลเปรียบเทียบคุณลักษณะ (โหมด deduction เท่านั้น)
 * @property {RevealedCharacter} [character] - มีเฉพาะเมื่อ correct === true
 * @property {string} [nextToken] - ซองของด่านถัดไป (โหมด trivia ที่ยังไม่ครบ 5 ด่าน)
 *
 * @typedef {Object} GameRevealResponse
 * @property {RevealedCharacter} character
 * @property {boolean} roundOver
 * @property {string} [nextToken]
 *
 * @typedef {Object} RevealedCharacter
 * @property {number} _id
 * @property {string} name
 * @property {string|null} imageUrl
 * @property {string[]} films
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
