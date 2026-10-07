/**
 * app/layout.jsx — Root Layout ของทั้งเว็บ
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมไฟล์นี้ยังเป็น Server Component? — Decision Framework]
 *   ไฟล์นี้ไม่มี 'use client' จึงเป็น Server Component ตามค่าเริ่มต้นของ Next.js 15
 *   เหตุผลที่ "ต้อง" เป็น Server:
 *     1. export const metadata ใช้ได้เฉพาะใน Server Component
 *        ถ้าใส่ 'use client' ที่นี่ <title> และ description จะหายไปจาก HTML
 *        = SEO เสียและแชร์ลิงก์ไม่ขึ้นชื่อเรื่อง
 *     2. โครงหน้า (html/body/main/footer) เป็นเนื้อหาคงที่ ไม่มี interactivity
 *        เรนเดอร์ฝั่ง Server ได้ HTML พร้อมใช้ทันที First Contentful Paint เร็ว
 *     3. next/font/google ประมวลผลตอน build ฝั่ง Server แล้ว self-host ไฟล์ฟอนต์เอง
 *        ผู้เล่นจึงไม่ต้องยิงไปโหลดจาก Google ตอนเปิดเว็บ (เร็วกว่าและไม่รั่วข้อมูลผู้ใช้)
 *
 *   ส่วนที่ต้องมี interactivity ถูกแยกเป็น "เกาะ Client" เล็ก ๆ ชิ้นเดียว
 *   คือ <Nav /> ซึ่งใช้ usePathname() + useState + localStorage
 *   (ดูเหตุผลละเอียดที่หัวไฟล์ components/Nav.jsx)
 *   ผลคือ JS ที่ส่งไปเบราว์เซอร์มีเฉพาะแถบเมนู ไม่ใช่ทั้ง layout
 */
import './globals.css';
import { Noto_Sans_Thai } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

/**
 * ฟอนต์ไทย Noto Sans Thai
 * - variable: '--font-thai' ทำให้เรียกใช้ผ่าน CSS variable ได้
 *   และใน app/globals.css เราผูก --font-sans ให้ชี้มาที่ตัวแปรนี้
 *   จึงมีผลกับทั้งเว็บโดยไม่ต้องไปใส่ class font-* ทีละ component
 * - display: 'swap' แสดงข้อความด้วยฟอนต์สำรองก่อน ไม่ปล่อยให้จอว่าง
 *   ระหว่างรอฟอนต์โหลด (ป้องกันปัญหา Flash of Invisible Text)
 */
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-thai',
  display: 'swap',
});

export const metadata = {
  title: 'Disney Clue Guesser — เกมทายตัวละคร Disney ด้วยคำใบ้ AI',
  description: 'เกมทายชื่อตัวละคร Disney จากคำใบ้ AI และระบบเปรียบเทียบคุณลักษณะสไตล์ PokéGuesser',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`dark ${notoSansThai.variable}`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        {/* เกาะ Client ชิ้นเดียวของ layout — ไฮไลต์เมนูตามหน้าที่เปิดอยู่ */}
        <Nav />

        <main className="flex-1 flex flex-col">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
