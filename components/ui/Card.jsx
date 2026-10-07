/**
 * Card — กล่องการ์ดกลางของโปรเจกต์ (Design System)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [วิธีใช้ — สำหรับสิรวิชญ์ (/scoreboard, /achievement) และทุกคนในทีม]
 *   import Card from '@/components/ui/Card';
 *
 *   <Card>เนื้อหาอะไรก็ได้</Card>
 *
 *   // มีหัวข้อในการ์ด
 *   <Card title="อันดับสูงสุด" subtitle="อัปเดตทุก 30 วินาที">
 *     <LeaderboardTable />
 *   </Card>
 *
 *   // เน้นพิเศษ (ขอบฟ้าเรืองแสง) เช่นการ์ดเหรียญที่ปลดล็อกแล้ว
 *   <Card highlight>...</Card>
 *
 *   // ไม่ต้องมี padding ด้านใน (เช่นใส่ตารางเต็มกรอบ)
 *   <Card padding="none"><table .../></Card>
 *
 * props: title, subtitle, highlight (bool), padding ('none'|'sm'|'md'|'lg'),
 *        as (เปลี่ยน tag เช่น as="section"), className, children
 *
 * [Server หรือ Client?]
 *   เป็น Server Component (ไม่มี 'use client') เพราะเป็นแค่กล่องแสดงผล
 *   ไม่มี state ไม่มี event = ไม่ต้องส่ง JS ไปรันที่เบราว์เซอร์เลย
 */

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
};

export default function Card({
  title,
  subtitle,
  highlight = false,
  padding = 'md',
  as: Tag = 'div',
  className = '',
  children,
}) {
  const classes = [
    'rounded-card border bg-surface-900/80 backdrop-blur-sm',
    highlight
      ? 'border-brand-500/50 shadow-lg shadow-brand-500/10'
      : 'border-surface-700/70 shadow-md shadow-black/20',
    PADDING[padding] ?? PADDING.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes}>
      {(title || subtitle) && (
        <div className={padding === 'none' ? 'px-4 pt-4 pb-2' : 'mb-3'}>
          {title && <h3 className="text-sm sm:text-base font-bold text-muted-300">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </Tag>
  );
}
