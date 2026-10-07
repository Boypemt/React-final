/**
 * @file scripts/warm-clues.mjs — อุ่นแคชคำใบ้ก่อนเดโม (Demo Helper)
 * ผู้รับผิดชอบ: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [สคริปต์นี้มีไว้ทำอะไร?]
 *   Gemini ใช้เวลาเจนคำใบ้ 1 ชุด (10 ข้อ) ราว 4–10 วินาที ซึ่งเกินงบ 8 วินาที
 *   ที่ Route Handler ยอมให้ผู้เล่นรอ ผลคือ "ผู้เล่นคนแรก" ของแต่ละตัวละคร
 *   จะได้คำใบ้สำรองไปก่อน แล้วคนถัด ๆ ไปจึงได้คำใบ้ AI จากแคช
 *
 *   ถ้ารันสคริปต์นี้ก่อนนำเสนอ แคชฝั่ง Server จะถูกเติมไว้ล่วงหน้าทั้ง 50 ตัวละคร
 *   ทำให้ตอนเดโมผู้เล่นได้คำใบ้ AI ตัวจริงแบบทันที (source: "cache") ทุกครั้ง
 *
 * [ข้อควรระวัง]
 *   - ใช้ "ก่อนเดโมเท่านั้น" ห้ามเรียกตอน Server เริ่มทำงาน
 *     เพราะจะยิง Gemini 50 ครั้งทุกครั้งที่ deploy = เปลืองโควตาและอาจชน Rate Limit
 *   - ต้องเปิด `npm run dev` ไว้ก่อน แล้วค่อยรัน `npm run warm` ในอีกหน้าต่าง
 *   - แคชเป็นแบบ in-memory (TTL 1 ชั่วโมง) ถ้า restart Server ต้องอุ่นใหม่
 *
 * วิธีใช้:  npm run warm
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const API_URL = process.env.WARM_API_URL || 'http://localhost:3000/api/ai/clues';

/** เว้นช่วงระหว่างคำขอ 4 วินาที เพื่อไม่ให้ยิง Gemini ถี่เกินจนชน Rate Limit */
const GAP_MS = 4000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadCharacters() {
  const file = path.join(PROJECT_ROOT, 'lib', 'data', 'curated-disney.json');
  const characters = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(characters) || characters.length === 0) {
    throw new Error(`ไม่พบข้อมูลตัวละครใน ${file}`);
  }
  return characters;
}

/** ยิง 1 คำขอ แล้วคืนค่า source ที่ Route Handler ตอบมา */
async function warmOne(character) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId: character._id, characterName: character.name }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return { source: `HTTP ${res.status}`, error: data?.error || 'unknown error' };
  }
  return { source: data?.source || 'unknown' };
}

async function main() {
  const characters = loadCharacters();

  console.log(`\n🔥 เริ่มอุ่นแคชคำใบ้ — ${characters.length} ตัวละคร`);
  console.log(`   ปลายทาง: ${API_URL}`);
  console.log(`   เว้นช่วงระหว่างคำขอ: ${GAP_MS / 1000} วินาที\n`);

  const tally = {};
  let index = 0;

  for (const character of characters) {
    index += 1;
    const label = `[${String(index).padStart(2, ' ')}/${characters.length}]`;
    const idName = `${String(character._id).padEnd(6)} ${character.name}`;
    const startedAt = Date.now();

    try {
      const { source, error } = await warmOne(character);
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      tally[source] = (tally[source] || 0) + 1;
      console.log(`${label} ${idName.padEnd(28)} -> ${source.padEnd(9)} (${seconds}s)${error ? ' ' + error : ''}`);
    } catch (err) {
      // ส่วนใหญ่คือ Server ยังไม่เปิด — บอกให้ชัดแล้วหยุด ไม่ต้องยิงต่อให้เสียเวลา
      tally.unreachable = (tally.unreachable || 0) + 1;
      console.log(`${label} ${idName.padEnd(28)} -> ERROR     ${err.message}`);
      console.error(`\n❌ ยิงไปที่ ${API_URL} ไม่สำเร็จ — เปิด \`npm run dev\` ไว้แล้วหรือยัง?\n`);
      process.exitCode = 1;
      return;
    }

    // ตัวสุดท้ายไม่ต้องรอ
    if (index < characters.length) {
      await sleep(GAP_MS);
    }
  }

  console.log('\n📊 สรุปผล:');
  for (const [source, count] of Object.entries(tally)) {
    console.log(`   ${source.padEnd(10)} ${count} ตัวละคร`);
  }
  console.log(
    '\n✅ อุ่นแคชเสร็จแล้ว (TTL 1 ชั่วโมง)\n' +
      '   หมายเหตุ: ตัวที่ขึ้น "fallback" คือ Gemini ตอบช้ากว่างบ 8 วินาที\n' +
      '   แต่งานเจนยังวิ่งเบื้องหลังและลงแคชให้เรียบร้อย — รันซ้ำอีกครั้งจะเห็นเป็น "cache" ทั้งหมด\n'
  );
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาดที่ไม่คาดคิด:', err);
  process.exitCode = 1;
});
