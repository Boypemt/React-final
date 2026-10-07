/**
 * @file scripts/reconcile-curated.mjs — ซ่อมข้อมูล 25 ตัวแรกให้เป็นข้อมูลจริงจาก Disney API
 * ผู้เขียน: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 * ไฟล์ปลายทาง: lib/data/curated-disney.json + lib/data/mock-clues.json
 *
 * [ทำไมต้องมีสคริปต์นี้]
 *   ตรวจพบว่า 25 ตัวแรกในไฟล์เป็นข้อมูลที่พิมพ์ด้วยมือ ไม่ได้มาจาก API จริง
 *   ผลเสียคือ 1) imageUrl ส่วนใหญ่เป็นลิงก์ตาย (404) และ
 *   2) _id ส่วนใหญ่ชี้ไปที่ "ตัวละครอื่น" คนละตัวกันเลย
 *      เช่น _id 6222 ที่ตั้งใจให้เป็น Simba จริง ๆ คือ "Slaying Mantis"
 *      ทำให้หน้า /characters/[id] ที่ดึง Live API แสดงตัวละครผิดคน
 *
 * [สคริปต์นี้ทำอะไร]
 *   1. GET /character/<_id> แล้วเทียบชื่อที่ API ตอบกับชื่อในไฟล์
 *      - ชื่อตรงกัน  -> ยกข้อมูลทุกฟิลด์จาก API มาทับของเดิม
 *      - ชื่อไม่ตรง   -> ค้นด้วยชื่อ (/character?name=) เลือกตัวที่มี films มากสุด
 *                       แล้วพิมพ์ "old id -> new id" ให้ตรวจสอบ
 *   2. ถ้า _id เปลี่ยน จะย้าย key ใน mock-clues.json ตามไปด้วย
 *      ไม่งั้นคำใบ้สำรองจะไปผูกกับตัวละครผิดคน
 *   3. ตรวจทุกตัว: imageUrl ต้องได้ 200, films >= 1, รวม 50 ตัว, ไม่มี _id/ชื่อซ้ำ
 *      ถ้าตัวไหนไม่ผ่าน จะ "ไม่เขียนไฟล์" และรายงานชื่อออกมา (ห้ามแต่งข้อมูลเอง)
 *
 * หมายเหตุ: 25 ตัวหลัง (ที่เพิ่มด้วย scripts/fetch-curated.mjs) เป็นข้อมูล API อยู่แล้ว
 *          สคริปต์นี้จะคงไว้ตามเดิม แค่จัดรูปแบบให้เหมือนกันทั้งไฟล์
 *
 * วิธีใช้:  node scripts/reconcile-curated.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURATED_FILE = path.join(__dirname, '..', 'lib', 'data', 'curated-disney.json');
const MOCK_CLUES_FILE = path.join(__dirname, '..', 'lib', 'data', 'mock-clues.json');

const API_BASE = 'https://api.disneyapi.dev';
const GAP_MS = 300;
const ORIGINAL_COUNT = 25;

/**
 * ตัวละครที่ "ไม่มีใน Disney API เลย" จึงต้องเปลี่ยนตัวแทน
 *
 * [ทำไมต้องเปลี่ยน] API ชุดนี้ไม่มีตัวละครจากจักรวาล Toy Story อยู่เลย
 *   - "Buzz Lightyear": ค้นด้วย "Buzz Lightyear", "Buzz", "Lightyear" แล้วไม่เจอ
 *   - "Woody": เจอ _id 7364 ชื่อ "Woody" ตรงเป๊ะ แต่เป็น Woody จาก Lilo & Stitch
 *              (films: ["Leroy & Stitch"]) ไม่ใช่นายอำเภอจาก Toy Story
 *   ตรวจซ้ำแล้วว่า Jessie / Rex / Hamm / Mr. Potato Head ก็ไม่มีใน Toy Story ของ API นี้
 *
 * จึงเปลี่ยนเป็นตัวละครจริงจาก The Emperor's New Groove แทน
 * (ได้ทั้งเรื่องใหม่ที่ยังไม่มีในชุด และได้อักษรตัวแรก "Y" ที่ยังไม่มีใครใช้)
 * คำใบ้ของ 2 ตัวนี้ใน mock-clues.json จะถูกลบออก เพราะเขียนถึง Toy Story โดยเฉพาะ
 */
const REPLACEMENTS = {
  'Woody': 'Yzma',
  'Buzz Lightyear': 'Kuzco',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ดึงตัวละครตาม _id — คืน null ถ้าไม่พบหรือข้อมูลว่าง */
async function fetchById(id) {
  const res = await fetch(`${API_BASE}/character/${id}`, { headers: { accept: 'application/json' } });
  if (!res.ok) return null;
  const json = await res.json();
  // ดักหลุมพราง: API อาจตอบ 200 แต่ data เป็น [] หรือเป็น array
  const d = Array.isArray(json?.data) ? json.data[0] : json?.data;
  return d && d._id ? d : null;
}

/** ค้นตามชื่อ คืนรายการผู้สมัครทั้งหมด */
async function searchByName(name) {
  const res = await fetch(`${API_BASE}/character?name=${encodeURIComponent(name)}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (Array.isArray(json?.data)) return json.data;
  if (json?.data && typeof json.data === 'object') return [json.data];
  return [];
}

/** เลือกตัวละครหลัก: ชื่อตรงเป๊ะมาก่อน แล้วเรียงตามจำนวน films มากสุด */
function pickMain(matches, wantedName) {
  const exact = matches.filter(
    (m) => String(m?.name || '').trim().toLowerCase() === wantedName.trim().toLowerCase()
  );
  const pool = exact.length ? exact : matches;
  return [...pool].sort((a, b) => (b?.films?.length || 0) - (a?.films?.length || 0))[0] || null;
}

/**
 * แยกคำสำคัญออกจากชื่อเรื่อง เพื่อใช้เทียบแบบหยาบ ๆ
 * ตัดวงเล็บ เครื่องหมาย เลขภาค และเลขโรมันออก เหลือคำยาว >= 4 ตัวอักษร
 * เช่น "Hercules (film)" -> ["hercules"], "The Lion King II" -> ["lion","king"]
 */
function titleTokens(titles) {
  const STOP = new Set(['the', 'and', 'a', 'an', 'of', 'in', 'film', 'movie', 'part', 'ii', 'iii', 'iv']);
  const out = new Set();
  for (const t of titles) {
    String(t)
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
      .forEach((w) => out.add(w));
  }
  return out;
}

/**
 * กันเคสชื่อพ้องกัน (Name Collision)
 *
 * [ทำไมต้องมีด่านนี้] ค้นคำว่า "Woody" ใน API แล้วได้ _id 7364 ชื่อ "Woody" ตรงเป๊ะ
 * แต่ตัวนั้นคือ Woody จากเรื่อง Lilo & Stitch ไม่ใช่ Woody นายอำเภอจาก Toy Story
 * ถ้าเชื่อแค่ "ชื่อตรงกัน" ข้อมูลผิดคนจะหลุดเข้าไฟล์ และคำใบ้ใน mock-clues
 * (ตุ๊กตาคาวบอย, แอนดี้, งูในรองเท้าบู๊ต) จะไปผูกกับตัวละครคนละเรื่องเลย
 *
 * วิธีตรวจ: ชื่อเรื่องที่ตัวละครปรากฏ ต้องมีคำสำคัญร่วมกับข้อมูลเดิมอย่างน้อย 1 คำ
 * (ใช้เฉพาะกรณีที่หาด้วยการค้นชื่อ ถ้า _id เดิมถูกต้องอยู่แล้วก็เชื่อได้เลย)
 *
 * @returns {boolean} true = น่าเชื่อถือ, false = น่าสงสัย ให้ตีตกไปรายงาน
 */
function looksLikeSameCharacter(originalEntry, picked) {
  const oldTokens = titleTokens([
    ...(originalEntry.films || []),
    ...(originalEntry.tvShows || []),
  ]);
  const newTokens = titleTokens([...(picked.films || []), ...(picked.tvShows || [])]);
  if (oldTokens.size === 0) return true; // ไม่มีข้อมูลเดิมให้เทียบ ก็ปล่อยผ่าน
  for (const t of newTokens) if (oldTokens.has(t)) return true;
  return false;
}

async function imageStatus(url) {
  if (!url || typeof url !== 'string') return 'ไม่มี URL';
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (r.status === 405 || r.status === 403) r = await fetch(url, { method: 'GET', redirect: 'follow' });
    return r.status;
  } catch {
    return 'fetch failed';
  }
}

/** เอาเฉพาะ 8 ฟิลด์ตามสัญญา เรียงลำดับให้ตรงกับไฟล์เดิม */
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

/** จัดรูปแบบให้เหมือนกันทั้งไฟล์: key ละบรรทัด แต่ array อยู่บรรทัดเดียว */
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
  const all = JSON.parse(fs.readFileSync(CURATED_FILE, 'utf8'));
  const original = all.slice(0, ORIGINAL_COUNT);
  const added = all.slice(ORIGINAL_COUNT);

  console.log(`\nซ่อมข้อมูล ${original.length} ตัวแรก (คง ${added.length} ตัวหลังไว้ตามเดิม)\n`);

  const report = [];
  const idChanges = [];
  const failures = [];
  const reconciled = [];
  const replaced = [];     // [ชื่อเดิม, idเดิม, ชื่อใหม่, idใหม่]
  const droppedIds = [];   // _id เดิมที่ถูกถอดออก -> ต้องลบ key ใน mock-clues

  /**
   * หาตัวแทนให้ตัวละครที่ API ไม่มี
   * @returns {Promise<Object|null>} entry ที่ผ่านเกณฑ์แล้ว หรือ null
   */
  async function resolveReplacement(oldEntry) {
    const wanted = REPLACEMENTS[oldEntry.name];
    if (!wanted) return null;

    await sleep(GAP_MS);
    let matches = [];
    try {
      matches = await searchByName(wanted);
    } catch {
      return null;
    }
    const picked = pickMain(matches, wanted);
    if (!picked) return null;

    const entry = toEntry(picked);
    if (entry.films.length < 1) return null;

    await sleep(GAP_MS);
    if ((await imageStatus(entry.imageUrl)) !== 200) return null;

    return entry;
  }

  for (const old of original) {
    await sleep(GAP_MS);
    const oldImg = await imageStatus(old.imageUrl);

    let picked = null;
    let how = '';
    let pendingIdChange = null;

    // 1) ลองตาม _id เดิมก่อน
    await sleep(GAP_MS);
    let byId = null;
    try {
      byId = await fetchById(old._id);
    } catch { /* ถือว่าหาไม่เจอ ไปค้นด้วยชื่อต่อ */ }

    if (byId && String(byId.name).trim().toLowerCase() === old.name.trim().toLowerCase()) {
      picked = byId;
      how = 'id ถูกต้อง';
    } else {
      // 2) _id ผิดหรือว่าง -> ค้นด้วยชื่อ
      await sleep(GAP_MS);
      let matches = [];
      try {
        matches = await searchByName(old.name);
      } catch { /* ปล่อยให้ตกเกณฑ์ด้านล่าง */ }
      picked = pickMain(matches, old.name);
      how = byId ? `id เดิมเป็น "${byId.name}"` : 'id เดิมหาไม่เจอ';
      // บันทึก "id เปลี่ยน" ไว้ก่อน แต่จะยืนยันทีหลังเมื่อผ่านด่านกันชื่อพ้องแล้ว
      // (ถ้าไม่ยืนยัน รายงานจะขึ้น id ของตัวที่ถูกตีตกไปด้วย ซึ่งทำให้เข้าใจผิด)
      if (picked) {
        pendingIdChange = [old.name, old._id, picked._id, how, matches.length];
      }
    }

    // ตรวจว่าใช้ตัวที่ค้นมาได้จริงไหม: ต้องมีตัวตน และต้องไม่ใช่ชื่อพ้องคนละตัวละคร
    const isCollision = picked && how !== 'id ถูกต้อง' && !looksLikeSameCharacter(old, picked);
    if (!picked || isCollision) {
      const why = !picked
        ? `หาใน API ไม่เจอเลย (${how})`
        : `_id ${picked._id} ชื่อตรงกันแต่เป็นคนละตัวละคร — ปรากฏใน ${JSON.stringify((picked.films || []).slice(0, 3))} ไม่เกี่ยวกับข้อมูลเดิม ${JSON.stringify((old.films || []).slice(0, 3))}`;

      // ลองหาตัวแทนตามที่กำหนดไว้ใน REPLACEMENTS
      const substitute = await resolveReplacement(old);
      if (substitute) {
        reconciled.push(substitute);
        replaced.push([old.name, old._id, substitute.name, substitute._id]);
        droppedIds.push(String(old._id));
        console.log(
          `⇄ ${old.name.padEnd(16)} ถอดออก (${why.slice(0, 60)}…) → ใช้ "${substitute.name}" _id=${substitute._id} films=${substitute.films.length} แทน`
        );
        continue;
      }

      failures.push([old.name, why]);
      console.log(`✗ ${old.name.padEnd(16)} ${why}`);
      continue;
    }

    // ผ่านด่านกันชื่อพ้องแล้ว จึงยืนยันว่า id นี้เปลี่ยนจริง
    if (pendingIdChange) idChanges.push(pendingIdChange);

    const entry = toEntry(picked);

    if (entry.films.length < 1) {
      failures.push([old.name, `_id ${entry._id} ไม่มี films`]);
      console.log(`✗ ${old.name.padEnd(16)} _id ${entry._id} ไม่มี films`);
      continue;
    }

    await sleep(GAP_MS);
    const newImg = await imageStatus(entry.imageUrl);
    if (newImg !== 200) {
      failures.push([old.name, `imageUrl ของ _id ${entry._id} ตอบ ${newImg}`]);
      console.log(`✗ ${old.name.padEnd(16)} รูปตอบ ${newImg}`);
      continue;
    }

    reconciled.push(entry);
    report.push({
      name: old.name,
      apiName: entry.name,
      oldId: old._id,
      newId: entry._id,
      oldFilms: (old.films || []).length,
      newFilms: entry.films.length,
      oldImg,
      newImg,
      how,
    });
    console.log(
      `✓ ${entry.name.padEnd(18)} _id ${String(old._id).padEnd(6)}${old._id !== entry._id ? `-> ${String(entry._id).padEnd(6)}` : '      '} ` +
        `films ${String(report.at(-1).oldFilms).padStart(2)} -> ${String(entry.films.length).padStart(2)}  ` +
        `รูป ${String(oldImg).padEnd(4)} -> ${newImg}`
    );
  }

  console.log('\n────────────────────────────────────────');

  if (failures.length) {
    console.error(`\n❌ มี ${failures.length} ตัวที่ไม่ผ่านเกณฑ์ — ยังไม่เขียนไฟล์ (ห้ามแต่งข้อมูลเอง):`);
    failures.forEach(([n, why]) => console.error(`   - ${n}: ${why}`));
    process.exitCode = 1;
    return;
  }

  // ---- ตรวจ _id / ชื่อ ซ้ำกับ 25 ตัวหลัง ----
  const merged = [...reconciled, ...added];
  const ids = merged.map((c) => c._id);
  const names = merged.map((c) => c.name.toLowerCase());
  const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
  const dupNames = names.filter((v, i) => names.indexOf(v) !== i);

  if (merged.length !== 50 || dupIds.length || dupNames.length) {
    console.error(`\n❌ ตรวจไม่ผ่าน — ยังไม่เขียนไฟล์`);
    console.error(`   จำนวน: ${merged.length} (ต้องเป็น 50)`);
    if (dupIds.length) console.error(`   _id ซ้ำ: ${[...new Set(dupIds)].join(', ')}`);
    if (dupNames.length) console.error(`   ชื่อซ้ำ: ${[...new Set(dupNames)].join(', ')}`);
    process.exitCode = 1;
    return;
  }

  // ---- เขียน curated-disney.json ----
  fs.writeFileSync(CURATED_FILE, `[\n${merged.map(formatEntry).join(',\n')}\n]\n`, 'utf8');

  // ---- ย้าย key ใน mock-clues.json ตาม _id ที่เปลี่ยน ----
  const mockRaw = JSON.parse(fs.readFileSync(MOCK_CLUES_FILE, 'utf8'));
  const remapped = {};
  const movedKeys = [];
  const deletedKeys = [];
  // สร้างแผนที่ oldId -> newId จากรายการที่เปลี่ยน
  const idMap = new Map(report.filter((r) => r.oldId !== r.newId).map((r) => [String(r.oldId), String(r.newId)]));
  const dropSet = new Set(droppedIds);
  for (const [key, clues] of Object.entries(mockRaw)) {
    // ตัวละครที่ถูกถอดออก: ลบคำใบ้ทิ้ง เพราะข้อความเขียนถึงตัวละครนั้นโดยเฉพาะ
    // ถ้าปล่อยไว้แล้วย้าย key ไปให้ตัวแทน คำใบ้จะบรรยายผิดตัวละครทันที
    if (dropSet.has(key)) {
      deletedKeys.push(key);
      continue;
    }
    const newKey = idMap.get(key) || key;
    remapped[newKey] = clues;
    if (newKey !== key) movedKeys.push([key, newKey]);
  }
  // คงรูปแบบเดิมของ mock-clues.json (key -> array ของ 3 สตริง)
  const mockText =
    '{\n' +
    Object.entries(remapped)
      .map(([k, v]) => `  "${k}": [\n${v.map((s) => `    ${JSON.stringify(s)}`).join(',\n')}\n  ]`)
      .join(',\n') +
    '\n}\n';
  fs.writeFileSync(MOCK_CLUES_FILE, mockText, 'utf8');

  // ---- รายงานผล ----
  console.log(`\n✅ เขียนไฟล์แล้ว`);
  console.log(`   curated-disney.json : ${merged.length} ตัว`);
  console.log(`   mock-clues.json     : ${Object.keys(remapped).length} key (ย้าย ${movedKeys.length} key)`);

  if (idChanges.length) {
    console.log(`\n=== _id ที่เปลี่ยน (${idChanges.length} ตัว) ===`);
    idChanges.forEach(([n, o, nw, how, cnt]) =>
      console.log(`   ${n.padEnd(16)} ${String(o).padEnd(6)} -> ${String(nw).padEnd(6)}  (${how}, เจอ ${cnt} รายการ)`)
    );
  }

  if (replaced.length) {
    console.log(`\n=== ตัวละครที่เปลี่ยนตัวแทน (API ไม่มีของเดิม) ===`);
    replaced.forEach(([on, oi, nn, ni]) =>
      console.log(`   ${on} (${oi})  ->  ${nn} (${ni})`)
    );
  }

  if (movedKeys.length) {
    console.log(`\n=== key ใน mock-clues.json ที่ย้าย ===`);
    movedKeys.forEach(([o, n]) => console.log(`   "${o}" -> "${n}"`));
  }

  if (deletedKeys.length) {
    console.log(`\n=== key ใน mock-clues.json ที่ลบ (ตัวละครถูกถอดออก) ===`);
    deletedKeys.forEach((k) => console.log(`   "${k}"`));
  }

  console.log('\n=== ตาราง ก่อน/หลัง ของ 25 ตัวแรก ===');
  console.log('ชื่อ(API)          _id เดิม -> ใหม่   films เดิม->ใหม่   รูป เดิม->ใหม่   ซ่อมรูปแล้ว?');
  console.log('─'.repeat(92));
  for (const r of report) {
    const fixed = r.oldImg !== 200 && r.newImg === 200 ? '✅ ซ่อมแล้ว' : r.oldImg === 200 ? '— ดีอยู่แล้ว' : '?';
    console.log(
      `${r.apiName.padEnd(18)} ${String(r.oldId).padEnd(6)} -> ${String(r.newId).padEnd(7)} ` +
        `${String(r.oldFilms).padStart(2)} -> ${String(r.newFilms).padStart(2)}           ` +
        `${String(r.oldImg).padEnd(4)} -> ${String(r.newImg).padEnd(4)}   ${fixed}`
    );
  }
  console.log('');
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exitCode = 1;
});
