/**
 * @file gameLogic.js - Pure functions for Disney Clue Guesser Game Engine
 */

/**
 * เปรียบเทียบคุณลักษณะระหว่างตัวละครที่ผู้เล่นทาย (guessed) กับตัวละครเป้าหมาย (target)
 * อิงตามฟิลด์จริงจาก Disney API
 * 
 * @param {Object} guessed - ข้อมูลตัวละครที่ทาย
 * @param {Object} target - ข้อมูลตัวละครเป้าหมายปริศนา
 * @returns {Object} ผลการเปรียบเทียบในแต่ละมิติ (match, mismatch, higher, lower)
 */
export function compareAttributes(guessed, target) {
  if (!guessed || !target) return null;

  // 1. ตรวจสอบว่ามีภาพยนตร์ร่วมกันหรือไม่ (Shared Film)
  const guessedFilms = Array.isArray(guessed.films) ? guessed.films : [];
  const targetFilms = Array.isArray(target.films) ? target.films : [];
  const sharedFilms = guessedFilms.some(film => targetFilms.includes(film));

  // 2. เปรียบเทียบจำนวนภาพยนตร์ที่ปรากฏ (Films Count)
  const gFilmCount = guessedFilms.length;
  const tFilmCount = targetFilms.length;
  let filmCountStatus = 'match';
  if (gFilmCount < tFilmCount) filmCountStatus = 'higher';
  else if (gFilmCount > tFilmCount) filmCountStatus = 'lower';

  // 3. ตรวจสอบสถานะการปรากฏในซีรีส์ทีวี (TV Show presence)
  const gTv = (guessed.tvShows?.length || 0) > 0;
  const tTv = (target.tvShows?.length || 0) > 0;
  const tvStatus = gTv === tTv ? 'match' : 'mismatch';

  // 4. ตรวจสอบสถานะการมีเครื่องเล่นในสวนสนุก Disney (Park Attraction presence)
  const gPark = (guessed.parkAttractions?.length || 0) > 0;
  const tPark = (target.parkAttractions?.length || 0) > 0;
  const parkStatus = gPark === tPark ? 'match' : 'mismatch';

  // 5. เปรียบเทียบตัวอักษรแรกของชื่อตามลำดับพจนานุกรม A-Z (First Letter)
  const gChar = (guessed.name || '')[0]?.toUpperCase() || '';
  const tChar = (target.name || '')[0]?.toUpperCase() || '';
  let letterStatus = 'match';
  if (gChar < tChar) letterStatus = 'higher';
  else if (gChar > tChar) letterStatus = 'lower';

  return {
    sharedFilms: sharedFilms ? 'match' : 'mismatch',
    filmCountStatus,
    guessedFilmCount: gFilmCount,
    targetFilmCount: tFilmCount,
    tvStatus,
    hasTv: gTv,
    parkStatus,
    hasPark: gPark,
    letterStatus,
    guessedLetter: gChar,
    isCorrectName: guessed._id === target._id || guessed.name.toLowerCase().trim() === target.name.toLowerCase().trim()
  };
}

/**
 * คำนวณคะแนนในแต่ละด่าน
 * - คะแนนเต็มตั้งต้น: 1,000 คะแนน
 * - หักคำใบ้ที่ 2: -250 คะแนน
 * - หักคำใบ้ที่ 3: -500 คะแนน
 * - หักการเดาผิด: -50 คะแนนต่อครั้ง
 * - โบนัสเวลาที่เหลือ: วินาทีที่เหลือ * 10 คะแนน
 * 
 * @param {number} cluesUsed - จำนวนคำใบ้ที่เปิด (1, 2 หรือ 3)
 * @param {number} timeLeftSeconds - วินาทีที่เหลือ (0-30)
 * @param {number} incorrectGuessesCount - จำนวนครั้งที่เดาผิดในด่านนี้
 * @returns {number} คะแนนที่ได้ (ขั้นต่ำ 0)
 */
export function calculateRoundScore(cluesUsed, timeLeftSeconds, incorrectGuessesCount = 0) {
  let baseScore = 1000;

  // หักคะแนนตามคำใบ้ที่ขอเพิ่ม
  if (cluesUsed === 2) baseScore -= 250;
  else if (cluesUsed >= 3) baseScore -= 500;

  // หักคะแนนจากการเดาผิด
  const guessPenalty = incorrectGuessesCount * 50;

  // โบนัสความเร็ว
  const timeBonus = Math.max(0, timeLeftSeconds) * 10;

  const total = baseScore - guessPenalty + timeBonus;
  return Math.max(100, total); // ขั้นต่ำได้ 100 คะแนนถ้าตอบถูก
}

/**
 * ตรวจสอบความถูกต้องของคำตอบ (Case-insensitive & Trim whitespace)
 * 
 * @param {string} userGuess - คำตอบที่ผู้ใช้พิมพ์
 * @param {string} correctName - ชื่อตัวละครที่ถูกต้อง
 * @returns {boolean}
 */
export function validateAnswer(userGuess, correctName) {
  if (!userGuess || !correctName) return false;
  return userGuess.trim().toLowerCase() === correctName.trim().toLowerCase();
}

/**
 * สุ่มตัวละคร N ตัวไม่ซ้ำกันจาก Curated Pool
 * 
 * @param {Array} pool - อาร์เรย์ของตัวละคร
 * @param {number} count - จำนวนที่ต้องการสุ่ม (ค่าเริ่มต้น 5)
 * @returns {Array} รายการตัวละครที่สุ่มได้
 */
export function getRandomCharacters(pool, count = 5) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}

/**
 * คำนวณคะแนนสำหรับโหมด PokéGuesser Deduction
 * - คะแนนเริ่มต้น: 1,000 คะแนน (ทายถูกครั้งแรก)
 * - หักคะแนนการทายผิด: -75 คะแนนต่อครั้ง
 * - คะแนนขั้นต่ำ: 100 คะแนน
 * 
 * @param {number} guessCount - จำนวนครั้งทั้งหมดที่ใช้ทาย (รวมครั้งที่ถูก)
 * @returns {number} คะแนนที่ได้
 */
export function calculateDeductionScore(guessCount = 1) {
  const penalty = Math.max(0, guessCount - 1) * 75;
  return Math.max(100, 1000 - penalty);
}

/**
 * แปลงประวัติการทายใน Deduction Mode ให้เป็นชุด Emoji สไตล์ Wordle / PokéGuesser สำหรับแชร์
 * 
 * @param {Array} guessHistory - รายการประวัติการเดา
 * @returns {string} ข้อความตาราง Emoji
 */
export function generateShareableGrid(guessHistory = []) {
  if (!Array.isArray(guessHistory) || guessHistory.length === 0) return '';
  const rows = guessHistory.map(entry => {
    const c = entry.comparison;
    if (!c) return '';
    const f = c.sharedFilms === 'match' ? '🟩' : '🟥';
    const count = c.filmCountStatus === 'match' ? '🟩' : (c.filmCountStatus === 'higher' ? '⬆️' : '⬇️');
    const tv = c.tvStatus === 'match' ? '🟩' : '🟥';
    const park = c.parkStatus === 'match' ? '🟩' : '🟥';
    const l = c.letterStatus === 'match' ? '🟩' : (c.letterStatus === 'higher' ? '⬆️' : '⬇️');
    return `${f}${count}${tv}${park}${l}`;
  });

  // แสดงจากเดาครั้งแรกไปยังครั้งล่าสุด
  return [...rows].reverse().join('\n');
}

