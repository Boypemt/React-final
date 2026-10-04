import curatedCharacters from './data/curated-disney.json';

/**
 * ดึงข้อมูลตัวละครจาก Live Disney API (https://api.disneyapi.dev/character/:id)
 * พร้อมระบบ Next.js ISR Cache (24 ชม.) และจัดการ Edge Cases อย่างรัดกุม
 * 
 * @param {string|number} id - รหัสตัวละคร Disney
 * @returns {Promise<Object|null>} ข้อมูลตัวละคร หรือ null หากไม่พบ
 */
export async function fetchCharacter(id) {
  // 1. ตรวจสอบว่า id เป็นตัวเลขที่ถูกต้องหรือไม่
  if (!id || isNaN(Number(id))) {
    return null;
  }

  const numId = Number(id);

  try {
    const res = await fetch(`https://api.disneyapi.dev/character/${numId}`, {
      next: { revalidate: 86400 } // ISR แคชข้อมูล 24 ชั่วโมงตาม Day 7
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();

    // ★ CRITICAL EDGE CASE: Disney API ส่ง HTTP 200 แต่ data เป็น Array ว่าง [] เมื่อไม่พบ ID
    if (!json?.data || Array.isArray(json.data) || !json.data._id) {
      return null;
    }

    return json.data;
  } catch (error) {
    console.error(`Error fetching character #${id}:`, error);

    // แผนสำรอง กรณีเครือข่ายขัดข้อง ให้ค้นหาจาก Local Curated Pool ในเครื่อง
    const fallback = curatedCharacters.find(c => c._id === numId);
    return fallback || null;
  }
}
