import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GAME_MODES, MAX_SCORE, MAX_TIME_SPENT_SECONDS } from '@/lib/scoreSchema';

/**
 * @file lib/scoreboardStore.js — คลังเก็บคะแนนฝั่ง Server
 * กลุ่ม Sigma · Disney Character Clue Guesser
 *
 * [ทำไมต้องเป็น Server Only?]
 *   ไฟล์นี้ใช้ `node:fs` อ่าน/เขียนไฟล์ ซึ่งเบราว์เซอร์ไม่มี
 *   และคะแนนต้อง "แชร์กันทุกคน" ไม่ใช่เก็บในเครื่องใครเครื่องมัน
 *   `import 'server-only'` เป็น Guard ระดับ compile-time ถ้ามีใครเผลอ import
 *   จากฝั่ง Client จะ build ไม่ผ่านทันที ปลอดภัยกว่าเขียนคอมเมนต์เตือนเพียว ๆ
 *
 * [ทำไมเก็บ state ไว้บน globalThis?]
 *   ตอน `npm run dev` Next.js โหลดไฟล์นี้แยกกันต่อ route (หน้า /scoreboard กับ
 *   Server Action ได้ตัวแปรคนละก้อน) และโหลดใหม่ทุกครั้งที่แก้ไฟล์
 *   globalThis มีก้อนเดียวทั้ง process จึงแชร์กันได้ — แนวทางเดียวกับ
 *   `lib/taskStore.js` ของ Lab Day 8
 *
 * [แผนสำรองเมื่อเขียนไฟล์ไม่ได้]
 *   โฮสติ้งหลายที่ (เช่น Vercel) มีไฟล์ระบบแบบอ่านได้เท่านั้น (read-only)
 *   `fs.writeFile` จะโยน EROFS/EACCES ออกมา ถ้าปล่อยไว้หน้าเว็บจะพัง
 *   จึงตรวจจับแล้วสลับไปเก็บในหน่วยความจำต่อ เกมยังบันทึกคะแนนได้ปกติ
 *   (ข้อแลกเปลี่ยนที่รู้ตัว: ข้อมูลหายเมื่อ restart — ยอมรับได้สำหรับโปรเจกต์เรียน
 *   ถ้าใช้งานจริงควรเปลี่ยนไปใช้ฐานข้อมูลหรือ Redis)
 */

const DATA_FILE = path.join(process.cwd(), 'lib', 'data', 'scoreboard.json');

/** เก็บในไฟล์สูงสุด 1,000 รายการ กันไฟล์โตไม่มีที่สิ้นสุด */
const MAX_STORED_ENTRIES = 1000;

/** แสดงบนหน้าเว็บสูงสุด 100 อันดับ */
const MAX_VISIBLE_ENTRIES = 100;

const PERIOD_MS = {
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
};

/**
 * state ที่ต้องอยู่รอดข้าม route และข้าม hot-reload
 * - entries    : สำเนาในหน่วยความจำ (ใช้เป็นแผนสำรองเมื่อเขียนไฟล์ไม่ได้)
 * - memoryOnly : true เมื่อเคยเขียนไฟล์ไม่สำเร็จแล้ว จะไม่ลองเขียนซ้ำอีก
 * - warned     : กันไม่ให้ log ซ้ำรัว ๆ ทุกครั้งที่บันทึก
 */
const store = (globalThis.__scoreboardStore ??= {
  entries: [],
  memoryOnly: false,
  warned: false,
});

/**
 * เคยเขียนไฟล์ไม่สำเร็จแล้วสลับไปใช้หน่วยความจำหรือยัง
 * หน้า /scoreboard เอาไปขึ้นข้อความเตือนให้ผู้ใช้รู้ว่าข้อมูลจะหายเมื่อรีสตาร์ต
 */
export function isPersistenceDegraded() {
  return store.memoryOnly;
}

/** ตรวจว่า 1 รายการในไฟล์ใช้งานได้จริง (ไฟล์อาจถูกแก้ด้วยมือหรือเสียหาย) */
function isValidEntry(entry) {
  return (
    entry &&
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    entry.name.length > 0 &&
    GAME_MODES.includes(entry.gameMode) &&
    Number.isInteger(entry.score) &&
    entry.score >= 0 &&
    entry.score <= MAX_SCORE &&
    Number.isInteger(entry.timeSpentSeconds) &&
    entry.timeSpentSeconds >= 0 &&
    entry.timeSpentSeconds <= MAX_TIME_SPENT_SECONDS &&
    typeof entry.submittedAt === 'string' &&
    Number.isFinite(Date.parse(entry.submittedAt))
  );
}

/**
 * อ่านรายการจากไฟล์
 * @returns {Promise<Array|null>} null = อ่านไฟล์ไม่ได้ (ให้ผู้เรียกไปใช้สำเนาในหน่วยความจำ)
 */
async function readFromFile() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error('[scoreboardStore] scoreboard.json ไม่ใช่ array — ถือว่าว่างเปล่า');
      return [];
    }
    // ทิ้งเฉพาะรายการที่เสีย ไม่ทิ้งทั้งไฟล์ เพื่อไม่ให้คะแนนคนอื่นหายไปด้วย
    const valid = parsed.filter(isValidEntry);
    if (valid.length !== parsed.length) {
      console.error(
        `[scoreboardStore] ข้ามรายการที่ข้อมูลไม่ถูกต้อง ${parsed.length - valid.length} รายการ`
      );
    }
    return valid;
  } catch (error) {
    // ยังไม่มีไฟล์ = ยังไม่มีใครส่งคะแนน ถือว่าว่างเปล่า ไม่ใช่ error
    if (error?.code === 'ENOENT') return [];
    console.error('[scoreboardStore] อ่าน scoreboard.json ไม่สำเร็จ:', error);
    return null;
  }
}

/**
 * เขียนรายการลงไฟล์
 * @returns {Promise<boolean>} false = เขียนไม่ได้ (เช่นโฮสติ้ง read-only)
 */
async function writeToFile(entries) {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
    return true;
  } catch (error) {
    if (!store.warned) {
      console.error(
        '[scoreboardStore] เขียน scoreboard.json ไม่สำเร็จ — สลับไปเก็บในหน่วยความจำ:',
        error?.code || error
      );
      store.warned = true;
    }
    return false;
  }
}

/** เรียงอันดับ: คะแนนมากก่อน → ใช้เวลาน้อยก่อน → ส่งทีหลังก่อน */
function compareEntries(left, right) {
  return (
    right.score - left.score ||
    left.timeSpentSeconds - right.timeSpentSeconds ||
    Date.parse(right.submittedAt) - Date.parse(left.submittedAt)
  );
}

/** รวมรายการทั้งหมดจากแหล่งที่ใช้งานได้จริงในขณะนั้น */
async function readAllEntries() {
  if (store.memoryOnly) return store.entries;

  const fromFile = await readFromFile();
  if (fromFile === null) return store.entries;

  // sync สำเนาในหน่วยความจำไว้เสมอ เผื่อว่าการเขียนครั้งต่อไปล้มเหลว
  store.entries = fromFile;
  return fromFile;
}

/**
 * ดึงรายการคะแนนสำหรับแสดงบนหน้า /scoreboard
 *
 * @param {{ mode?: 'all'|'deduction'|'trivia', period?: 'all'|'week'|'month' }} [options]
 * @returns {Promise<Array>} เรียงอันดับแล้ว สูงสุด 100 รายการ
 */
export async function getEntries({ mode = 'all', period = 'all' } = {}) {
  const entries = await readAllEntries();
  const now = Date.now();
  const windowMs = PERIOD_MS[period] ?? null;

  return entries
    .filter((entry) => mode === 'all' || entry.gameMode === mode)
    .filter((entry) => !windowMs || now - Date.parse(entry.submittedAt) <= windowMs)
    .sort(compareEntries)
    .slice(0, MAX_VISIBLE_ENTRIES);
}

/**
 * เพิ่มคะแนน 1 รายการ
 *
 * หมายเหตุ: ฟังก์ชันนี้ "ไม่ validate" ข้อมูลเอง เพราะ Server Action
 * (app/scoreboard/actions.js) ตรวจด้วย scoreSchema มาก่อนแล้ว
 * หน้าที่ของไฟล์นี้คือการเก็บข้อมูลเท่านั้น (แยกความรับผิดชอบให้ชัด)
 *
 * @param {Object} entry - ข้อมูลที่ผ่าน scoreSchema แล้ว
 * @returns {Promise<{ entry: Object, persisted: boolean }>}
 *          persisted=false หมายถึงเก็บได้แค่ในหน่วยความจำ
 */
export async function addEntry(entry) {
  const stored = {
    id: globalThis.crypto.randomUUID(),
    name: entry.name,
    gameMode: entry.gameMode,
    score: entry.score,
    timeSpentSeconds: entry.timeSpentSeconds,
    ...(entry.guessesCount !== undefined && { guessesCount: entry.guessesCount }),
    ...(entry.correctCount !== undefined && { correctCount: entry.correctCount }),
    ...(entry.firstClueWins !== undefined && { firstClueWins: entry.firstClueWins }),
    submittedAt: new Date().toISOString(),
  };

  const current = await readAllEntries();
  const next = [stored, ...current]
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt))
    .slice(0, MAX_STORED_ENTRIES);

  // อัปเดตสำเนาในหน่วยความจำก่อนเสมอ เพื่อให้อ่านเจอแม้เขียนไฟล์ไม่สำเร็จ
  store.entries = next;

  if (store.memoryOnly) {
    return { entry: stored, persisted: false };
  }

  const ok = await writeToFile(next);
  if (!ok) {
    store.memoryOnly = true;
    return { entry: stored, persisted: false };
  }

  return { entry: stored, persisted: true };
}
