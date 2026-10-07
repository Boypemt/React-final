'use client';

/**
 * ModeSelector — การ์ดเลือกโหมดการเล่น (Client Island)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมไฟล์นี้ต้องเป็น Client Component? — Decision Framework]
 *   นี่คือ Client Component ชิ้นเดียวที่เพิ่มในหน้าแรก เพราะมี 3 อย่างที่ Server ทำไม่ได้:
 *     1. useState — จำว่าผู้เล่นเลือกโหมดไหนไว้ ก่อนจะกด "เริ่มเล่น"
 *        เป็น state ชั่วคราวใน UI ที่ไม่ต้องบันทึกที่ไหน (ตาม State Decision Framework
 *        ใน Proposal ข้อ 4.3 → ของแบบนี้ใช้ useState ไม่ต้องใส่ Context)
 *     2. onClick / onKeyDown — ต้องรับการกดเมาส์และปุ่มลูกศรจากคีย์บอร์ด
 *     3. useRouter().push() — นำทางไป /play?mode=... ตอนกดปุ่ม
 *        (ถ้าใช้ <Link> ธรรมดาก็ไม่ต้องเป็น Client แต่โจทย์ต้องการให้
 *         "เลือกก่อน แล้วกดเริ่มเล่นทีเดียว" จึงต้องเก็บ state ไว้ก่อน)
 *
 *   ส่วนที่เหลือของหน้าแรก (Hero, ตัวละครประจำวัน, วิธีเล่น) ยังเป็น Server Component
 *   ทั้งหมด เกาะนี้จึงเล็กมากและไม่ทำให้ JS ของหน้าแรกบวม
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MODES, DEFAULT_MODE } from '@/lib/gameModes';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ModeSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState(DEFAULT_MODE);
  const [isNavigating, setIsNavigating] = useState(false);
  const optionRefs = useRef({});

  /**
   * รองรับปุ่มลูกศรตามมาตรฐาน radiogroup ของ WAI-ARIA
   * ผู้ใช้คีย์บอร์ดกด Tab เข้ามาที่กลุ่มครั้งเดียว แล้วใช้ลูกศรเลื่อนตัวเลือก
   * (จึงต้องใส่ tabIndex = -1 ให้ตัวที่ไม่ได้เลือก ดูที่ prop ด้านล่าง)
   */
  const handleKeyDown = (event) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const currentIndex = MODES.findIndex((m) => m.id === selected);
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    // วนรอบ: จากตัวสุดท้ายกดขวาแล้วกลับมาตัวแรก
    const nextIndex = (currentIndex + delta + MODES.length) % MODES.length;
    const nextId = MODES[nextIndex].id;

    setSelected(nextId);
    // ย้ายโฟกัสตามไปด้วย ไม่งั้น screen reader จะไม่ประกาศตัวเลือกใหม่
    optionRefs.current[nextId]?.focus();
  };

  const startGame = () => {
    setIsNavigating(true);
    router.push(`/play?mode=${selected}`);
  };

  return (
    <section id="mode-selector" className="w-full max-w-6xl mx-auto px-4 py-6 scroll-mt-20">
      <h2 className="text-lg sm:text-xl font-bold text-muted-300 mb-1 flex items-center gap-2">
        <span aria-hidden="true">🎯</span> เลือกโหมดการเล่น
      </h2>
      <p className="text-xs sm:text-sm text-muted-500 mb-4">
        ใช้ปุ่มลูกศรเลื่อนเลือกได้ แล้วกด &ldquo;เริ่มเล่น&rdquo;
      </p>

      {/* mobile first: เรียงลงเป็นคอลัมน์ก่อน แล้วค่อยเป็น 2 คอลัมน์ตอนจอ md ขึ้นไป */}
      <div
        role="radiogroup"
        aria-label="เลือกโหมดการเล่น"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
      >
        {MODES.map((mode) => {
          const isSelected = selected === mode.id;
          return (
            <div
              key={mode.id}
              ref={(el) => {
                optionRefs.current[mode.id] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              // เฉพาะตัวที่เลือกอยู่ที่รับ Tab ได้ ที่เหลือเข้าถึงด้วยลูกศร
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(mode.id)}
              onKeyDown={(e) => {
                // Space/Enter บนตัวเลือกที่โฟกัสอยู่ = เลือกตัวนั้น
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setSelected(mode.id);
                }
              }}
              className={[
                'cursor-pointer rounded-card border p-4 sm:p-5 text-left transition',
                'hover:-translate-y-0.5',
                isSelected
                  ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/15'
                  : 'border-surface-700/70 bg-surface-900/80 hover:border-surface-700 hover:bg-surface-800/60',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-3xl shrink-0">
                  {mode.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-white">{mode.name}</h3>
                    {isSelected && (
                      <Badge tone="success" size="sm">
                        เลือกอยู่
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-500 mt-0.5">
                    {mode.subtitle}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-muted-400 leading-relaxed">
                    {mode.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {mode.chips.map((chip) => (
                      <Badge key={chip} tone={isSelected ? 'brand' : 'neutral'} size="sm">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button onClick={startGame} size="lg" disabled={isNavigating} className="sm:w-auto">
          <span aria-hidden="true">🚀</span>
          {isNavigating ? 'กำลังเข้าเกม…' : 'เริ่มเล่น'}
        </Button>
        <p className="text-xs text-muted-500 sm:ml-2">
          จะเข้าสู่{' '}
          <code className="text-muted-400">/play?mode={selected}</code>
        </p>
      </div>
    </section>
  );
}
