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

/**
 * ดึงรายการตัวละครจาก Live Disney API (พร้อมระบบค้นหาและแบ่งหน้า)
 * 
 * @param {Object} options
 * @param {number} [options.page=1] - หน้าที่ต้องการ
 * @param {number} [options.pageSize=24] - จำนวนรายการต่อหน้า
 * @param {string} [options.name=''] - คำค้นหาชื่อตัวละคร
 * @returns {Promise<{ characters: Array, totalPages: number, count: number, page: number, isFallback: boolean }>}
 */
export async function fetchCharacters({ page = 1, pageSize = 24, name = '' } = {}) {
  const queryName = typeof name === 'string' ? name.trim() : '';
  const numPage = Math.max(1, Number(page) || 1);
  const numPageSize = Math.max(1, Math.min(100, Number(pageSize) || 24));

  try {
    let url = '';
    if (queryName) {
      url = `https://api.disneyapi.dev/character?name=${encodeURIComponent(queryName)}`;
      if (numPage > 1) {
        url += `&page=${numPage}&pageSize=${numPageSize}`;
      }
    } else {
      url = `https://api.disneyapi.dev/character?page=${numPage}&pageSize=${numPageSize}`;
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 } // ISR แคชรายการ 1 ชั่วโมง
    });

    if (!res.ok) {
      throw new Error(`Disney API responded with status ${res.status}`);
    }

    const json = await res.json();
    const characters = Array.isArray(json?.data)
      ? json.data
      : (json?.data && typeof json.data === 'object' && json.data._id ? [json.data] : []);

    const totalPages = json?.info?.totalPages ?? (characters.length > 0 ? 1 : 0);
    const count = json?.info?.count ?? characters.length;

    return {
      characters,
      totalPages,
      count,
      page: numPage,
      isFallback: false
    };
  } catch (error) {
    console.error('Error fetching characters list from Disney API:', error);

    // แผนสำรอง: กรองจากชุดตัวละคร curated ในเครื่อง
    let filtered = curatedCharacters;
    if (queryName) {
      const q = queryName.toLowerCase();
      filtered = curatedCharacters.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.films && c.films.some(f => f.toLowerCase().includes(q)))
      );
    }

    const totalPages = Math.ceil(filtered.length / numPageSize) || (filtered.length > 0 ? 1 : 0);
    const startIndex = (numPage - 1) * numPageSize;
    const paginated = filtered.slice(startIndex, startIndex + numPageSize);

    return {
      characters: paginated,
      totalPages,
      count: filtered.length,
      page: numPage,
      isFallback: true
    };
  }
}

