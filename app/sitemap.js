import curatedCharacters from '@/lib/data/curated-disney.json';

/**
 * app/sitemap.js — สร้าง Sitemap อัตโนมัติสำหรับ Next.js 15 App Router
 * อ้างอิงสเปก: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://disney-clue-guesser.vercel.app';
  const currentDate = new Date();

  // 1. หน้าหลักทั้งหมดของแอปพลิเคชัน (Static Core Pages)
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/play`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/scoreboard`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/achievement`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // 2. หน้ารายละเอียดตัวละคร Disney จาก Curated Pool ทั้ง 50 ตัว (Dynamic Codex Pages)
  const characterRoutes = curatedCharacters.map((character) => ({
    url: `${baseUrl}/characters/${character._id}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...characterRoutes];
}
