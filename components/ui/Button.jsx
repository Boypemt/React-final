import Link from 'next/link';

/**
 * Button — ปุ่มกลางของโปรเจกต์ (Design System)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [วิธีใช้ — สำหรับสิรวิชญ์ (/scoreboard, /achievement) และทุกคนในทีม]
 *   import Button from '@/components/ui/Button';
 *
 *   // เป็นลิงก์ (ใส่ href แล้วจะ render เป็น <Link> ของ Next.js ให้เอง)
 *   <Button href="/play">เริ่มเล่น</Button>
 *   <Button href="/scoreboard" variant="secondary" size="sm">ดูอันดับ</Button>
 *
 *   // เป็นปุ่มกดจริง (ไม่ใส่ href จะ render เป็น <button>)
 *   <Button type="submit" variant="primary" fullWidth>บันทึกคะแนน</Button>
 *   <Button variant="ghost" onClick={handleClose}>ปิด</Button>
 *
 * variant : 'primary' (ฟ้าเด่น) | 'secondary' (อินดิโกโปร่ง) | 'ghost' (ไม่มีพื้น)
 * size    : 'sm' | 'md' (ค่าเริ่มต้น) | 'lg'
 * props อื่น ๆ ส่งผ่านไปที่ element จริงทั้งหมด (type, onClick, disabled, aria-* ฯลฯ)
 *
 * [Server หรือ Client?]
 *   ไฟล์นี้ไม่มี 'use client' จึงเป็น Server Component โดยค่าเริ่มต้น
 *   = ไม่เพิ่มขนาด JS ที่ส่งไปให้ผู้เล่นเลย เพราะตัวมันเองไม่มี state/event
 *   แต่ถ้านำไปใช้ "ข้างใน" Client Component (เช่นฟอร์มที่มี onClick)
 *   Next.js จะรวมมันเข้า Client Bundle ให้อัตโนมัติ ส่ง onClick ได้ปกติ
 */

const VARIANTS = {
  primary:
    'bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/20 border border-brand-500/40',
  secondary:
    'bg-secondary-600/20 hover:bg-secondary-600/35 text-secondary-300 font-semibold border border-secondary-500/40',
  ghost:
    'bg-transparent hover:bg-surface-800 text-muted-400 hover:text-white font-medium border border-transparent',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1',
  md: 'text-sm px-4 py-2 gap-1.5',
  lg: 'text-base px-6 py-3 gap-2',
};

export default function Button({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-xl transition',
    'hover:scale-[1.02] active:scale-[0.98]',
    // disabled:* ครอบคลุมทั้ง <button disabled> และกรณีใส่ aria-disabled
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // มี href = เป็นการนำทาง ใช้ <Link> เพื่อให้ได้ client-side navigation ของ Next.js
  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  // ไม่มี href = เป็นปุ่มสั่งงาน ต้องระบุ type เพื่อไม่ให้เผลอ submit ฟอร์ม
  return (
    <button className={classes} type={rest.type ?? 'button'} {...rest}>
      {children}
    </button>
  );
}
