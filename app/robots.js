/**
 * app/robots.js — จัดการข้อกำหนดสำหรับ Web Crawlers / Search Engines
 * อ้างอิงสเปก Next.js 15 Metadata Route: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://disney-clue-guesser.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'], // ป้องกัน crawler เข้าไปยิง API สิ้นเปลืองโควตา AI / Gemini
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
