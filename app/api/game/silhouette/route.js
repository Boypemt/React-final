/**
 * @file app/api/game/silhouette/route.js — GET /api/game/silhouette?token=...
 *
 * [หน้าที่] Server ดาวน์โหลดรูปตัวละครเป้าหมายมาเอง แล้วส่งต่อ (proxy) ให้เบราว์เซอร์
 *
 * [ทำไมต้อง proxy ทั้งที่รูปก็ถูกทำเป็นเงาดำอยู่แล้ว?]
 *   เพราะของเดิมใส่ URL จริงลงใน <img src> แล้วค่อยทำให้ดำด้วย CSS filter
 *   แต่ CSS filter ไม่ได้ปิดอะไรเลยในทางเทคนิค — เปิด Elements tab ดู src ก็เห็น
 *     https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png
 *   ชื่อไฟล์บอกคำตอบตรง ๆ และ Network tab ก็โชว์ URL เดียวกันซ้ำอีกชั้น
 *   พอเปลี่ยนมาเป็น /api/game/silhouette?token=... เบราว์เซอร์เห็นแค่ซองที่อ่านไม่ออก
 *   ส่วนไบต์ของรูปยังมาถึงครบ จึงยังทำเงาด้วย CSS filter ได้เหมือนเดิมเป๊ะ ๆ
 *
 * [SSRF? ไม่มี] URL ที่ fetch มาจาก curated-disney.json ฝั่ง Server เท่านั้น
 *   Client ส่งมาได้แค่ซองที่เข้ารหัส ไม่เคยมีโอกาสระบุ URL ปลายทางเอง
 */
import { resolveGameSession } from '@/lib/gameRound';

export const runtime = 'nodejs';

/** ไม่รอรูปนานเกินไป กัน request ค้างกิน resource ของ Server */
const IMAGE_FETCH_TIMEOUT_MS = 8000;

/**
 * เงาสำรองแบบไม่ระบุตัวตน — ใช้เมื่อโหลดรูปต้นทางไม่สำเร็จ
 *
 * [ทำไมไม่ fallback ไปใช้รูป Mickey Mouse เหมือนโค้ดเดิม?]
 *   เพราะนั่นคือ "การเฉลยผิด ๆ": ผู้เล่นจะเข้าใจว่าคำตอบคือ Mickey
 *   รูปร่างกลาง ๆ ที่ไม่ใช่ตัวละครใดเลยจึงปลอดภัยกว่าทั้งต่อเกมและต่อผู้เล่น
 */
const GENERIC_SILHOUETTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <g fill="#94a3b8">
    <circle cx="80" cy="54" r="30"/>
    <path d="M80 92c-27 0-48 18-48 41v27h96v-27c0-23-21-41-48-41z"/>
  </g>
</svg>`;

function genericSilhouetteResponse() {
  return new Response(GENERIC_SILHOUETTE_SVG, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get('token');

    const session = resolveGameSession(token);
    if (!session.ok) return session.response;

    const imageUrl = session.target.imageUrl;
    if (!imageUrl) return genericSilhouetteResponse();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

    let upstream;
    try {
      upstream = await fetch(imageUrl, { signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = upstream.headers.get('content-type') || '';

    // ถ้าต้นทางตอบไม่ใช่รูป (เช่นหน้า error HTML) อย่าส่งต่อให้เบราว์เซอร์
    if (!upstream.ok || !upstream.body || !contentType.startsWith('image/')) {
      console.error(
        `[api/game/silhouette] upstream image unusable (status ${upstream.status}, type "${contentType}")`
      );
      return genericSilhouetteResponse();
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // [ทำไม no-store?] ถ้าปล่อยให้แคช เบราว์เซอร์หรือ CDN อาจเก็บคู่ token↔รูปไว้
        // แล้วเอามาเทียบย้อนหลังได้ และผู้เล่นจะเห็นรูปของรอบก่อนค้างอยู่ตอนขึ้นด่านใหม่
        'Cache-Control': 'no-store',
        // ไม่ส่ง header อื่นจากต้นทางต่อ (เช่น ETag หรือ Content-Disposition)
        // เพราะบางต้นทางแปะชื่อไฟล์ไว้ใน header = ชื่อตัวละครหลุดทางหลังบ้าน
      },
    });
  } catch (error) {
    console.error('[api/game/silhouette] unexpected error:', error);
    // ไม่ปล่อย 500 ออกไป — แต่เส้นทางนี้ต้องตอบเป็น "รูป" ไม่ใช่ JSON
    // เพราะปลายทางคือ <img> ถ้าตอบ JSON เบราว์เซอร์จะขึ้นรูปแตก
    // ซองที่แกะไม่ผ่านถูกจับไปตอบ 401 ที่ resolveGameSession ก่อนแล้ว
    // ที่เหลือจึงเป็นปัญหาเครือข่ายของรูป — ส่งเงากลาง ๆ ไปให้เกมเล่นต่อได้
    return genericSilhouetteResponse();
  }
}
