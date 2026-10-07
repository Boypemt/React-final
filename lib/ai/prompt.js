/**
 * @file lib/ai/prompt.js — Prompt Engineering สำหรับ Gemini
 * ผู้รับผิดชอบ: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [Server หรือ Client?] — ไฟล์นี้เป็น "ตัวสร้างสตริง" ล้วน ๆ ไม่มี secret
 * และไม่มี Web API แต่ถูก import เฉพาะจาก lib/ai/gemini.js ซึ่งเป็น server-only
 * จึงไม่มีทางหลุดไปอยู่ใน Client Bundle และไม่เปิดเผยกลยุทธ์ Prompt ให้ผู้เล่น
 * (ถ้า Prompt หลุดไปฝั่ง Client ผู้เล่นจะเดาแพตเทิร์นคำใบ้ได้ = เกมเสียสมดุล)
 */

/** จำนวนคำใบ้ต่อ 1 batch — Proposal ระบุว่า "ให้ AI เจนคำถามทีเดียว ชุดละ 10 คำใบ้" */
export const CLUES_PER_BATCH = 10;

/** สัดส่วนความยากที่ต้องการในแต่ละ batch (รวม = 10) */
export const DIFFICULTY_QUOTA = { hard: 4, medium: 3, easy: 3 };

/** ระดับความยากที่ยอมรับได้ (ใช้ร่วมกับ responseSchema และขั้น post-validate) */
export const DIFFICULTIES = ['hard', 'medium', 'easy'];

/**
 * แปลง array ของข้อมูลให้เป็นบรรทัดอ่านง่ายสำหรับ Prompt
 * ตัดให้เหลือไม่เกิน `limit` รายการ เพื่อคุม Token และลดโอกาส AI สับสน
 */
function formatList(label, items, limit = 6) {
  if (!Array.isArray(items) || items.length === 0) {
    return `- ${label}: (ไม่มีข้อมูล)`;
  }
  const shown = items.slice(0, limit);
  const more = items.length > shown.length ? ` (และอื่น ๆ อีก ${items.length - shown.length} รายการ)` : '';
  return `- ${label} [ทั้งหมด ${items.length} รายการ]: ${shown.join(', ')}${more}`;
}

/**
 * สร้างคำที่ "ห้ามปรากฏในคำใบ้" จากชื่อตัวละคร
 * เช่น "Mickey Mouse" -> ["Mickey Mouse", "Mickey", "Mouse"]
 * เพื่อกัน AI เผลอใบ้ชื่อตรง ๆ หรือใบ้แค่บางส่วนของชื่อ (ซึ่งง่ายเกินไป)
 *
 * @param {string} characterName
 * @returns {string[]}
 */
export function getBannedTerms(characterName) {
  const name = String(characterName || '').trim();
  if (!name) return [];

  const parts = name
    .split(/[\s\-'"().,]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 3); // คำสั้น ๆ เช่น "of", "the" ไม่ต้องแบน

  return [...new Set([name, ...parts])];
}

/**
 * สร้าง Prompt ฉบับเต็มสำหรับขอคำใบ้ 1 batch (10 ข้อ) จากตัวละคร 1 ตัว
 *
 * @param {Object} character - ข้อมูลตัวละครจาก lib/data/curated-disney.json
 * @param {number} [character._id]
 * @param {string} character.name
 * @param {string[]} [character.films]
 * @param {string[]} [character.shortFilms]
 * @param {string[]} [character.tvShows]
 * @param {string[]} [character.videoGames]
 * @param {string[]} [character.parkAttractions]
 * @returns {string} Prompt ภาษาไทยพร้อมส่งเข้า Gemini
 */
export function buildCluesPrompt(character) {
  const {
    name = '',
    films = [],
    shortFilms = [],
    tvShows = [],
    videoGames = [],
    parkAttractions = [],
  } = character || {};

  const firstLetter = name ? name.trim()[0].toUpperCase() : '?';
  const banned = getBannedTerms(name);

  // ข้อมูลจริงที่ให้ AI ยึดเป็นฐาน — เป็นวิธีลด Hallucination ที่ถูกที่สุด
  // (grounding ด้วยข้อมูลใน repo ดีกว่าปล่อยให้โมเดลนึกเอาเอง)
  const facts = [
    formatList('ภาพยนตร์ (films)', films),
    formatList('ภาพยนตร์สั้น (shortFilms)', shortFilms),
    formatList('ซีรีส์ทีวี (tvShows)', tvShows),
    formatList('วิดีโอเกม (videoGames)', videoGames),
    formatList('เครื่องเล่นในสวนสนุก (parkAttractions)', parkAttractions),
  ].join('\n');

  return `คุณเป็นนักออกแบบคำใบ้ (Clue Designer) ของเกมทายตัวละคร Disney ภาษาไทย

## ตัวละครเป้าหมาย (ความลับ — ผู้เล่นไม่เห็นข้อมูลนี้)
ชื่อ: ${name}
อักษรตัวแรกของชื่อ: ${firstLetter}

## ข้อมูลอ้างอิงที่ยืนยันแล้ว (ใช้เป็นฐานของคำใบ้)
${facts}

## ภารกิจ
สร้างคำใบ้ทั้งหมด ${CLUES_PER_BATCH} ข้อ ในการตอบครั้งเดียว โดยแบ่งระดับความยากดังนี้
- "hard" (ยาก) จำนวน ${DIFFICULTY_QUOTA.hard} ข้อ
- "medium" (ปานกลาง) จำนวน ${DIFFICULTY_QUOTA.medium} ข้อ
- "easy" (ง่าย) จำนวน ${DIFFICULTY_QUOTA.easy} ข้อ

## นิยามระดับความยาก
- hard: คลุมเครือ เป็นนัย พูดถึงธีม/ปูมหลัง/สถานที่ โดยไม่ระบุชื่อเรื่องและไม่ระบุสายพันธุ์ชัดเจน ผู้เล่นต้องคิดหนัก
- medium: เจาะจงขึ้น เช่น ความสัมพันธ์กับตัวละครอื่น ลักษณะภายนอกเด่น ๆ หรือเหตุการณ์สำคัญในเรื่อง
- easy: เกือบเฉลย เช่น ระบุชื่อภาพยนตร์ที่ปรากฏ หรือบอกอักษรตัวแรกของชื่อ

## ประเภทคำใบ้ที่ต้องกระจายให้หลากหลาย (ห้ามซ้ำแนวกันทุกข้อ)
1. บริบทเนื้อเรื่อง / ปูมหลังตัวละคร
2. ถอดความคำคมประจำตัว (paraphrase — อย่ายกประโยคตรงตัวเป็นภาษาอังกฤษทั้งประโยค)
3. ความสัมพันธ์กับตัวละครอื่น (เพื่อน ศัตรู ครอบครัว)
4. ลักษณะภายนอก / เครื่องแต่งกาย / สีเด่น
5. ชื่อภาพยนตร์หรือสื่อที่ปรากฏตัว (อ้างจากข้อมูลอ้างอิงด้านบนเท่านั้น)
6. อักษรตัวแรกของชื่อ — อนุญาตให้ใช้เฉพาะระดับ "easy" และใช้ได้ไม่เกิน 1 ข้อ

## กฎเหล็ก (ผิดข้อใดข้อหนึ่ง = คำใบ้นั้นถูกทิ้ง)
1. ห้ามเขียนชื่อตัวละครหรือส่วนใดส่วนหนึ่งของชื่อลงในคำใบ้โดยเด็ดขาด
   คำที่ห้ามปรากฏ: ${banned.length ? banned.map((t) => `"${t}"`).join(', ') : '(ไม่มี)'}
2. ห้ามใช้ชื่อเล่น ชื่อย่อ หรือคำทับศัพท์ของชื่อตัวละคร (เช่น ถ้าชื่อ "Simba" ห้ามเขียน "ซิมบ้า")
3. คำใบ้ทุกข้อต้องเป็น "ภาษาไทย" ความยาว 1 ประโยค ประมาณ 15–40 คำ
4. ข้อเท็จจริงต้องอ้างจากข้อมูลอ้างอิงด้านบนเป็นหลัก ห้ามแต่งเรื่องที่ไม่มีอยู่จริง
   ถ้าไม่มั่นใจในรายละเอียดใด ให้เลี่ยงไปใช้ข้อเท็จจริงที่ยืนยันได้แทน
5. ห้ามขึ้นต้นคำใบ้ด้วยคำว่า "คำใบ้:" หรือใส่หมายเลขข้อ
6. ตอบกลับเป็น JSON ตาม schema ที่กำหนดเท่านั้น ห้ามมีข้อความอื่นนอก JSON`;
}

/**
 * responseSchema สำหรับ Structured Output ของ Gemini
 * บังคับให้โมเดลคืน { clues: [{ text, difficulty }] } เสมอ
 * ทำให้ไม่ต้องเขียน Regex แกะ Markdown code fence เอง (ลดจุดพังได้มาก)
 */
export const CLUES_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    clues: {
      type: 'ARRAY',
      minItems: CLUES_PER_BATCH,
      maxItems: CLUES_PER_BATCH,
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING', description: 'ตัวคำใบ้ภาษาไทย 1 ประโยค' },
          difficulty: { type: 'STRING', enum: DIFFICULTIES },
        },
        required: ['text', 'difficulty'],
      },
    },
  },
  required: ['clues'],
};
