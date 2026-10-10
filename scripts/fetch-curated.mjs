/**
 * @file scripts/fetch-curated.mjs — ดึงตัวละครเพิ่มจาก Disney API จริง
 * ผู้เขียน: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 * ไฟล์ปลายทาง: lib/data/curated-disney.json (ไฟล์ของปัณณวิชญ์ 682110181)
 *
 * [สคริปต์นี้ทำอะไร]
 *   แผนงานระบุว่าต้องมีตัวละคร curated 50 ตัว แต่ในไฟล์มีแค่ 25 ตัว
 *   สคริปต์นี้จึงไปดึงอีก 25 ตัวจาก Disney API ตัวจริง (https://api.disneyapi.dev)
 *   แล้ว "ต่อท้าย" ลงไฟล์เดิม โดยไม่แตะ 25 ตัวแรกแม้แต่ไบต์เดียว
 *
 * [กฎที่สคริปต์นี้บังคับ]
 *   - ทุกฟิลด์มาจาก API เท่านั้น ไม่มีการพิมพ์ข้อมูลจากความจำลงไป
 *   - ถ้าค้นชื่อแล้วเจอหลายรายการ เลือกตัวที่มี films มากที่สุด (= ตัวละครหลัก)
 *     และพิมพ์ _id ที่เลือกออกมาให้ตรวจสอบได้
 *   - รับเฉพาะตัวที่ imageUrl มีจริงและเปิดได้ (HTTP 200) + films อย่างน้อย 1 เรื่อง
 *   - ชื่อต้องไม่ซ้ำกับที่มีอยู่แล้วและไม่ซ้ำกันเอง
 *   - เว้นระยะ 300ms ทุกคำขอ เพื่อไม่ให้ยิง API ถี่เกินไป
 *   - ถ้าหาครบ 25 ตัวไม่ได้ จะ "ไม่เขียนไฟล์" แล้วรายงานจำนวนที่ได้ (ห้ามแต่งข้อมูลเอง)
 *
 * วิธีใช้:  node scripts/fetch-curated.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = path.join(__dirname, '..', 'lib', 'data', 'curated-disney.json');

const API_BASE = 'https://api.disneyapi.dev';
const REQUEST_GAP_MS = 150;
const TARGET_NEW_COUNT = process.argv[2] ? parseInt(process.argv[2], 10) : 50;

/**
 * รายชื่อผู้สมัคร เรียงตามลำดับความสำคัญ
 * ใส่เผื่อไว้จำนวนมาก เพื่อคัดเฉพาะตัวที่ข้อมูลครบและรูปเปิดได้ (HTTP 200)
 * จัดส่วนผสมให้สมดุล: พระเอก-นางเอก / ตัวร้าย / ตัวประกอบคู่หู
 * และกระจายอักษรตัวแรกให้หลากหลาย เพื่อให้การเทียบ "อักษรแรก A-Z" ในโหมด Deduction สนุก
 */
const CANDIDATES = [
  // ฮีโร่ / ตัวละครหลัก
  'Anna', 'Olaf', 'Maui', 'Flynn Rider', 'Lilo', 'Beast', 'Aurora',
  'Pocahontas', 'Tarzan', 'Tinker Bell', 'Winnie the Pooh', 'Tigger',
  'Goofy', 'Donald Duck', 'Minnie Mouse', 'Genie', 'Jasmine', 'Mowgli',
  'Tiana', 'Merida', 'Nemo', 'Dory', 'Dumbo', 'Bambi', 'Kristoff',
  // ตัวร้าย / ปรปักษ์
  'Ursula', 'Captain Hook', 'Cruella De Vil', 'Gaston', 'Mother Gothel',
  'Shere Khan', 'Yzma', 'Queen of Hearts', 'Dr. Facilier', 'Evil Queen',
  'Lady Tremaine', 'Jafar', 'Scar', 'Hades', 'Maleficent', 'Shan Yu',
  'Prince John', 'Clayton', 'King Candy', 'Yokai', 'Bellwether',
  // ตัวประกอบ / คู่หู / เพื่อนแท้
  'Timon', 'Pumbaa', 'Mufasa', 'Nala', 'Rafiki', 'Zazu',
  'Sebastian', 'Flounder', 'Scuttle', 'King Triton',
  'Mrs. Potts', 'Lumiere', 'Cogsworth', 'LeFou',
  'Eeyore', 'Piglet', 'Rabbit', 'Owl', 'Kanga', 'Roo',
  'Pluto', 'Daisy Duck', 'Pete', 'Chip', 'Dale',
  'Alice', 'Wendy Darling', 'Mad Hatter', 'Cheshire Cat', 'White Rabbit',
  'Sven', 'Hans', 'Pascal', 'Maximus', 'Mr. Smee',
  'Grumpy', 'Dopey', 'Doc',
  'Prince Phillip', 'Flora', 'Fauna', 'Merryweather',
  'Fairy Godmother', 'Prince Charming', 'Jaq', 'Gus',
  'Geppetto', 'Jiminy Cricket',
  'Megara', 'Philoctetes', 'Pegasus', 'Pain', 'Panic',
  'Mushu', 'Li Shang',
  'Jane Porter', 'Kala', 'Tantor',
  'John Smith', 'Meeko', 'Percy',
  'Prince Naveen', 'Louis', 'Ray',
  'Robin Hood', 'Little John', 'Maid Marian',
  'Pongo', 'Perdita',
  'Bagheera', 'King Louie', 'Kaa',
  'Duchess', 'Marie',
  'Lady', 'Tramp',
  'Tod', 'Copper',
  'Hiro Hamada', 'Go Go Tomago', 'Wasabi', 'Honey Lemon', 'Fred',
  'Nick Wilde', 'Chief Bogo', 'Clawhauser', 'Flash',
  'Wreck-It Ralph', 'Vanellope von Schweetz',
  'Mirabel Madrigal', 'Isabela Madrigal', 'Luisa Madrigal', 'Bruno Madrigal',
  'Raya', 'Sisu',
  'Kronk', 'Pacha',
  'Pleakley', 'Jumba Jookiba',
  'Mike Wazowski', 'Sulley', 'Remy', 'Lightning McQueen', 'WALL-E',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ค้นตัวละครตามชื่อ คืน array ของผู้สมัครทั้งหมดที่ API ส่งมา */
async function searchByName(name) {
  const url = `${API_BASE}/character?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ตอบ ${res.status}`);
  const json = await res.json();
  // ดักหลุมพรางของ Disney API: ตอบ 200 แต่ data เป็น [] หรือเป็น object เดี่ยว
  if (Array.isArray(json?.data)) return json.data;
  if (json?.data && typeof json.data === 'object') return [json.data];
  return [];
}

/** รูปเปิดได้จริงไหม (บาง URL ใน API ตายแล้ว) */
async function imageIsReachable(url) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    // บาง CDN ไม่รองรับ HEAD ให้ลอง GET แทน
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    return res.status === 200;
  } catch {
    return false;
  }
}

/** เอาเฉพาะ 8 ฟิลด์ตามสัญญา และเรียงลำดับให้ตรงกับไฟล์เดิมเป๊ะ ๆ */
function toEntry(raw) {
  const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);
  return {
    _id: raw._id,
    name: String(raw.name).trim(),
    imageUrl: raw.imageUrl,
    films: list(raw.films),
    shortFilms: list(raw.shortFilms),
    tvShows: list(raw.tvShows),
    videoGames: list(raw.videoGames),
    parkAttractions: list(raw.parkAttractions),
  };
}

/** จัดรูปแบบให้เหมือนไฟล์เดิม: key ละบรรทัด แต่ array อยู่บรรทัดเดียว */
function formatEntry(c) {
  const arr = (a) => `[${a.map((x) => JSON.stringify(x)).join(', ')}]`;
  return [
    '  {',
    `    "_id": ${c._id},`,
    `    "name": ${JSON.stringify(c.name)},`,
    `    "imageUrl": ${JSON.stringify(c.imageUrl)},`,
    `    "films": ${arr(c.films)},`,
    `    "shortFilms": ${arr(c.shortFilms)},`,
    `    "tvShows": ${arr(c.tvShows)},`,
    `    "videoGames": ${arr(c.videoGames)},`,
    `    "parkAttractions": ${arr(c.parkAttractions)}`,
    '  }',
  ].join('\n');
}

async function main() {
  const originalText = fs.readFileSync(TARGET_FILE, 'utf8');
  const existing = JSON.parse(originalText);

  const usedIds = new Set(existing.map((c) => c._id));
  const usedNames = new Set(existing.map((c) => c.name.toLowerCase()));

  console.log(`\nมีอยู่แล้ว ${existing.length} ตัว — ต้องการเพิ่มอีก ${TARGET_NEW_COUNT} ตัว\n`);

  const accepted = [];
  const rejected = [];

  for (const candidateName of CANDIDATES) {
    if (accepted.length >= TARGET_NEW_COUNT) break;

    await sleep(REQUEST_GAP_MS);

    let matches;
    try {
      matches = await searchByName(candidateName);
    } catch (err) {
      rejected.push([candidateName, `ค้นหาไม่สำเร็จ: ${err.message}`]);
      console.log(`✗ ${candidateName.padEnd(20)} ค้นหาไม่สำเร็จ: ${err.message}`);
      continue;
    }

    if (matches.length === 0) {
      rejected.push([candidateName, 'ไม่พบใน API']);
      console.log(`✗ ${candidateName.padEnd(20)} ไม่พบใน API`);
      continue;
    }

    // เลือกตัวละครหลัก: ชื่อตรงเป๊ะก่อน แล้วค่อยเรียงตามจำนวน films มากสุด
    const exact = matches.filter(
      (m) => String(m?.name || '').trim().toLowerCase() === candidateName.toLowerCase()
    );
    const pool = exact.length ? exact : matches;
    const sorted = [...pool].sort((a, b) => (b?.films?.length || 0) - (a?.films?.length || 0));
    const picked = sorted[0];

    if (matches.length > 1) {
      const others = sorted
        .slice(1, 4)
        .map((m) => `${m._id}(${m?.films?.length || 0} films)`)
        .join(', ');
      console.log(
        `  ℹ ${candidateName}: เจอ ${matches.length} รายการ → เลือก _id=${picked._id} ` +
          `(${picked?.films?.length || 0} films)${others ? ` | ตัวอื่น: ${others}` : ''}`
      );
    }

    const entry = toEntry(picked);

    // ---- เกณฑ์คัดกรอง ----
    if (usedIds.has(entry._id)) {
      rejected.push([candidateName, `_id ${entry._id} ซ้ำกับที่มีอยู่แล้ว`]);
      console.log(`✗ ${candidateName.padEnd(20)} _id ซ้ำ (${entry._id})`);
      continue;
    }
    if (usedNames.has(entry.name.toLowerCase())) {
      rejected.push([candidateName, `ชื่อ "${entry.name}" ซ้ำกับที่มีอยู่แล้ว`]);
      console.log(`✗ ${candidateName.padEnd(20)} ชื่อซ้ำ ("${entry.name}")`);
      continue;
    }
    if (entry.films.length < 1) {
      rejected.push([candidateName, 'ไม่มี films เลย']);
      console.log(`✗ ${candidateName.padEnd(20)} ไม่มี films`);
      continue;
    }
    if (!entry.imageUrl || typeof entry.imageUrl !== 'string') {
      rejected.push([candidateName, 'ไม่มี imageUrl']);
      console.log(`✗ ${candidateName.padEnd(20)} ไม่มี imageUrl`);
      continue;
    }

    await sleep(REQUEST_GAP_MS);
    if (!(await imageIsReachable(entry.imageUrl))) {
      rejected.push([candidateName, 'imageUrl เปิดไม่ได้ (ไม่ใช่ 200)']);
      console.log(`✗ ${candidateName.padEnd(20)} รูปเปิดไม่ได้`);
      continue;
    }

    usedIds.add(entry._id);
    usedNames.add(entry.name.toLowerCase());
    accepted.push(entry);
    console.log(
      `✓ ${String(accepted.length).padStart(2)}. ${entry.name.padEnd(20)} _id=${String(entry._id).padEnd(6)} ` +
        `films=${entry.films.length} tv=${entry.tvShows.length} parks=${entry.parkAttractions.length}`
    );
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`ผ่านเกณฑ์: ${accepted.length} / ${TARGET_NEW_COUNT}`);

  if (accepted.length < TARGET_NEW_COUNT) {
    console.error(
      `\n❌ หาตัวละครที่ข้อมูลครบไม่ถึง ${TARGET_NEW_COUNT} ตัว — ยังไม่เขียนไฟล์\n` +
        `   ได้มาแค่ ${accepted.length} ตัว (ห้ามแต่งข้อมูลเพิ่มเอง)\n`
    );
    if (rejected.length) {
      console.error('เหตุผลที่ตกเกณฑ์:');
      rejected.forEach(([n, why]) => console.error(`   - ${n}: ${why}`));
    }
    process.exitCode = 1;
    return;
  }

  // ---- ต่อท้ายไฟล์แบบไม่แตะข้อความเดิม ----
  // ตัดแค่ ']' ปิดท้ายออก แล้วต่อ entry ใหม่ → 25 ตัวแรกคงเดิมทุกไบต์
  const lastBracket = originalText.lastIndexOf(']');
  const head = originalText.slice(0, lastBracket).replace(/\s+$/, '');
  const merged = `${head},\n${accepted.map(formatEntry).join(',\n')}\n]\n`;

  fs.writeFileSync(TARGET_FILE, merged, 'utf8');

  // ---- ตรวจทานหลังเขียน ----
  const after = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
  const ids = after.map((c) => c._id);
  const names = after.map((c) => c.name);
  console.log(`\n✅ เขียนไฟล์แล้ว: ${after.length} ตัว`);
  console.log(`   _id ซ้ำ: ${ids.length - new Set(ids).size}`);
  console.log(`   ชื่อซ้ำ: ${names.length - new Set(names.map((n) => n.toLowerCase())).size}`);
  console.log(`   อักษรตัวแรกที่มี: ${[...new Set(names.map((n) => n[0].toUpperCase()))].sort().join(' ')}`);
  console.log('\nรายชื่อที่เพิ่ม:');
  accepted.forEach((c, i) => console.log(`  ${String(i + 1).padStart(2)}. ${String(c._id).padEnd(6)} ${c.name}`));
  console.log('');
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exitCode = 1;
});
