/**
 * @file app/api/ai/clues/route.js — Route Handler อุ่นแคชคำใบ้ (เครื่องมือภายใน)
 * ผู้รับผิดชอบ: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [บทบาทเปลี่ยนไปแล้ว — อ่านก่อนแก้]
 *   เดิม endpoint นี้คือทางที่ "เกมใช้จริง": Client ส่ง characterId + characterName มาขอคำใบ้
 *   ซึ่งเป็นช่องโหว่ซ้อนสองชั้น
 *     1. Client ต้องรู้คำตอบอยู่แล้วจึงส่ง characterId มาได้ = คำตอบอยู่ฝั่งที่เราไม่เชื่อถือ
 *     2. response ตอบ characterName กลับไปด้วย = เฉลยคำตอบใน Network tab ตรง ๆ
 *   ตอนนี้เกมใช้ POST /api/game/clue แทน ซึ่งอ้างอิงตัวละครจากซองที่เข้ารหัสฝั่ง Server
 *   endpoint นี้เหลือหน้าที่เดียวคือให้ scripts/warm-clues.mjs อุ่นแคชทั้ง 50 ตัวก่อนเดโม
 *
 * [ทำไมล็อกให้เปิดเฉพาะตอน development?]
 *   endpoint นี้ตอบคำใบ้ของ "ตัวละครที่ระบุ id มา" ได้อย่างอิสระ
 *   ถ้าเปิดไว้บน production ผู้เล่นจะวนยิงทั้ง 50 id เก็บคำใบ้ไว้เทียบกับคำใบ้ที่เกมแสดง
 *   แล้วย้อนหาคำตอบได้ทันที — เป็นการรั่วทางอ้อมที่ /api/game/clue ปิดไว้แล้วแต่ทางนี้เปิดทิ้ง
 *   สคริปต์อุ่นแคชถูกออกแบบให้รันคู่กับ `npm run dev` บนเครื่องอยู่แล้ว จึงไม่กระทบการใช้งาน
 *
 * สัญญาการตอบกลับ (ตัด characterId / characterName ออกแล้ว): { clues, source }
 */
import { NextResponse } from 'next/server';
import curatedCharacters from '@/lib/data/curated-disney.json';
import { getCluesForCharacter } from '@/lib/ai/cluePipeline';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // ---- ด่านที่ 0: เปิดเฉพาะตอน development ----
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'endpoint นี้เปิดใช้เฉพาะตอน development เท่านั้น' },
        { status: 401 }
      );
    }

    // ---- 1) อ่านและตรวจ Body ----
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body ไม่ใช่ JSON ที่ถูกต้อง' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body ต้องเป็น JSON object' }, { status: 400 });
    }

    // Number.isInteger ครอบคลุมทั้งกรณีไม่ใช่ตัวเลข, NaN, Infinity และเลขทศนิยม
    const { characterId } = body;
    if (!Number.isInteger(characterId) || characterId <= 0) {
      return NextResponse.json({ error: 'characterId ต้องเป็นจำนวนเต็มบวก' }, { status: 400 });
    }

    // ---- 2) ตัวละครต้องอยู่ในชุด curated เท่านั้น จึงจะมีสิทธิ์ยิงถึง Gemini ----
    //
    // [ทำไมต้องกั้นด่านนี้? — ป้องกันการถลุงโควตา (Quota Abuse)]
    //   ถ้าใครก็ยิง characterId อะไรก็ได้ เขาวนลูปส่ง id ไม่ซ้ำกันรัว ๆ
    //   ก็ทำให้เราจ่าย/ชน Rate Limit ของ Gemini จนเกมล่มได้ เพราะทุก id ใหม่
    //   = แคชไม่โดน = ยิง AI จริง 1 ครั้ง การจำกัดให้เหลือเฉพาะตัวละครในชุด curated
    //   ทำให้จำนวนครั้งที่ยิง Gemini มีเพดานชัดเจน = จำนวนตัวละครในไฟล์ต่อ 1 ชั่วโมง (TTL)
    //
    // [หมายเหตุ] characterName ที่เคยรับมาถูกตัดออกจากตรรกะทั้งหมดแล้ว
    //   เราใช้ชื่อจาก curated-disney.json ฝั่ง Server เท่านั้น ทั้งตอนสร้าง Prompt
    //   และตอนกรองคำใบ้ที่สปอยชื่อ — กัน Prompt Injection ผ่านฟิลด์ที่ Client ควบคุมได้
    const character = curatedCharacters.find((c) => c._id === characterId);
    if (!character) {
      return NextResponse.json(
        { error: 'characterId นี้ไม่อยู่ในชุด curated' },
        { status: 400 }
      );
    }

    // ---- 3) ใช้สายการผลิตเดียวกับที่เกมใช้ (แคช → Gemini → Fallback) ----
    //   จุดสำคัญ: ต้องเป็น module เดียวกัน แคชจึงถูกแชร์ให้ /api/game/clue ใช้ได้จริง
    const { clues, source } = await getCluesForCharacter(character);

    return NextResponse.json({ clues, source }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // ด่านสุดท้าย: ห้ามปล่อย 500 ออกไปเด็ดขาด
    // (ไม่ส่งรายละเอียด error กลับไปให้ Client เพราะอาจเผยข้อมูลภายในระบบ)
    console.error('[api/ai/clues] unexpected error:', error);
    return NextResponse.json({ error: 'อุ่นแคชคำใบ้ไม่สำเร็จ' }, { status: 400 });
  }
}
