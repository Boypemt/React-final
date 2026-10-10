'use client';

/**
 * Nav — แถบเมนูนำทาง (Client Island)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมไฟล์นี้ต้องเป็น Client Component? — Decision Framework]
 *   โปรเจกต์นี้ยึดหลัก "Server เป็นค่าเริ่มต้น แยกเป็น Client เฉพาะเท่าที่จำเป็น"
 *   แต่ Nav มี 3 อย่างที่ทำฝั่ง Server ไม่ได้เลย:
 *     1. usePathname() — ต้องรู้ว่า "ตอนนี้อยู่หน้าไหน" เพื่อไฮไลต์เมนู
 *        ค่านี้เปลี่ยนตอน client-side navigation โดยไม่ขอ HTML ใหม่จาก Server
 *        ถ้าเรนเดอร์ฝั่ง Server ครั้งเดียว เมนูจะค้างไฮไลต์หน้าแรกตลอด
 *     2. useState — เปิด/ปิดเมนูแฮมเบอร์เกอร์บนมือถือ เป็น state ใน UI ล้วน ๆ
 *     3. localStorage — เป็น Web API ที่มีแต่ในเบราว์เซอร์ ฝั่ง Server ไม่มี
 *
 *   ขอบเขตของเกาะนี้ถูกจำกัดไว้แค่แถบเมนู (ประมาณ 3 KB)
 *   ส่วน layout.jsx, footer และเนื้อหาหน้าอื่นยังเป็น Server Component ทั้งหมด
 *   จึงไม่กระทบขนาด JS ของทั้งเว็บ
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'หน้าแรก', icon: '🏠' },
  { href: '/play', label: 'เล่นเกม', icon: '🎮' },
  { href: '/characters', label: 'สารานุกรม', icon: '📖' },
  { href: '/scoreboard', label: 'อันดับ', icon: '🏆' },
  { href: '/achievement', label: 'เหรียญรางวัล', icon: '🏅' },
];

/** คีย์ที่ปัณณวิชญ์บันทึกผลการเล่นรอบล่าสุดไว้ (ตาม PANNAWIT-DEVELOPMENT-PLAN ไกด์ 2) */
const LAST_SESSION_KEY = 'disney_last_session';

export default function Nav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScore, setLastScore] = useState(null);

  /**
   * อ่านคะแนนล่าสุดจาก localStorage
   *
   * [ทำไมต้องอ่านใน useEffect ไม่อ่านตอน render?]
   *   HTML ชุดแรกถูกสร้างจากฝั่ง Server ซึ่งไม่มี localStorage
   *   ถ้าอ่านค่าตอน render ฝั่ง client เลย ผลลัพธ์จะไม่ตรงกับ HTML ของ Server
   *   = React จะขึ้น Hydration Mismatch Error ทันที
   *   การอ่านใน useEffect ทำให้รอบแรกเรนเดอร์ตรงกับ Server (คือไม่แสดงอะไร)
   *   แล้วค่อยอัปเดตหลัง hydrate เสร็จ ซึ่งปลอดภัยเสมอ
   */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_SESSION_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      // ข้อมูลใน localStorage แก้ด้วยมือได้ จึงต้องตรวจชนิดก่อนใช้ทุกครั้ง
      if (typeof parsed?.score === 'number' && Number.isFinite(parsed.score)) {
        setLastScore(parsed.score);
      }
    } catch {
      // ข้อมูลเสียหาย (JSON พัง) หรือเบราว์เซอร์ปิด storage ไว้
      // ไม่ต้องทำอะไร — ปล่อยให้ badge ไม่แสดง ดีกว่าทำให้หน้าเว็บพังทั้งหน้า
      setLastScore(null);
    }
  }, []);

  /**
   * ปิดเมนูมือถือเมื่อเปลี่ยนหน้า
   * ถ้าไม่ทำ เมนูจะค้างเปิดคาหน้าใหม่ เพราะ Next.js ไม่ได้ remount component นี้
   */
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  /**
   * หน้านี้กำลังถูกเปิดอยู่หรือไม่
   * /play ต้องยัง active ตอนเป็น /play?mode=deduction หรือ /play?mode=trivia
   * ซึ่ง usePathname() คืนค่า '/play' เฉย ๆ (ไม่รวม query string) จึงเทียบตรง ๆ ได้
   * ส่วนหน้าอื่นเผื่อกรณีมี sub-route ในอนาคตด้วย startsWith
   */
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  const linkClasses = (href) =>
    [
      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition',
      isActive(href)
        ? 'bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20'
        : 'text-muted-400 hover:text-white hover:bg-surface-800',
    ].join(' ');

  return (
    <header className="sticky top-0 z-50 border-b border-surface-700/70 bg-surface-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* โลโก้ */}
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight hover:opacity-90 transition"
          >
            <span aria-hidden="true">🏰</span>
            <span className="bg-gradient-to-r from-brand-400 via-secondary-300 to-accent-400 bg-clip-text text-transparent">
              Disney Guesser
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* คะแนนล่าสุด — แสดงเฉพาะเมื่ออ่านค่าได้จริง */}
            {lastScore !== null && (
              <span
                className="hidden sm:inline-flex items-center gap-1 rounded-pill border border-warning-500/30 bg-warning-500/15 px-2 py-1 text-[11px] font-semibold text-warning-300"
                title="คะแนนรอบล่าสุดของคุณ"
              >
                <span aria-hidden="true">⭐</span>
                {lastScore.toLocaleString('th-TH')}
              </span>
            )}

            {/* เมนูจอใหญ่ (mobile first: ซ่อนไว้ก่อน แล้วโชว์ตอนจอ md ขึ้นไป) */}
            <nav aria-label="เมนูหลัก" className="hidden md:flex items-center gap-1">
              {LINKS.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  // aria-current บอก screen reader ว่านี่คือหน้าที่กำลังเปิดอยู่
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={linkClasses(href)}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Link>
              ))}
            </nav>

            {/* ปุ่มแฮมเบอร์เกอร์ (เฉพาะจอเล็ก) */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-surface-700 text-muted-300 hover:text-white hover:bg-surface-800 transition"
            >
              {/* ไอคอนวาดด้วย SVG ไม่ต้องโหลดไลบรารีไอคอนเพิ่ม */}
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {isMenuOpen ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* เมนูจอเล็กแบบกางลงมา */}
      {isMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="เมนูหลัก (มือถือ)"
          className="md:hidden border-t border-surface-700/70 bg-surface-900/95 px-4 py-3"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map(({ href, label, icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`${linkClasses(href)} w-full`}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {lastScore !== null && (
            <p className="mt-3 pt-3 border-t border-surface-700/70 text-[11px] text-muted-500">
              คะแนนรอบล่าสุด:{' '}
              <span className="font-semibold text-warning-300">{lastScore.toLocaleString('th-TH')}</span>
            </p>
          )}
        </nav>
      )}
    </header>
  );
}
