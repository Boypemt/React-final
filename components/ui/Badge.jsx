/**
 * Badge — ป้ายเล็กทรงแคปซูล (Design System)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [วิธีใช้ — สำหรับสิรวิชญ์ (/scoreboard, /achievement) และทุกคนในทีม]
 *   import Badge from '@/components/ui/Badge';
 *
 *   <Badge tone="success">🟩 ตรงกัน</Badge>
 *   <Badge tone="danger">🟥 ไม่ตรง</Badge>
 *   <Badge tone="warning">⬆️ มากกว่า</Badge>
 *   <Badge tone="brand">คำใบ้ 1</Badge>
 *   <Badge tone="neutral" size="sm">classic</Badge>
 *
 * tone: 'neutral' (ค่าเริ่มต้น) | 'brand' | 'success' | 'danger' | 'warning' | 'accent'
 * size: 'sm' | 'md' (ค่าเริ่มต้น)
 *
 * [หมายเหตุเรื่องสี]
 *   tone success/danger/warning ตั้งค่าให้ตรงกับ badge ในตาราง Deduction
 *   ของปัณณวิชญ์ (components/game/GuessHistoryTable.jsx) คือ
 *   emerald = 🟩 ตรงกัน, rose = 🟥 ไม่ตรง, amber = ⬆️⬇️ มาก/น้อยกว่า
 *   เพื่อให้ผู้เล่นเห็นสีเดียวกันสื่อความหมายเดียวกันทั่วทั้งเว็บ
 *
 * [Server หรือ Client?]
 *   Server Component — เป็นแค่ <span> ที่จัดสีให้ ไม่มี interactivity
 */

const TONES = {
  neutral: 'bg-surface-800 text-muted-300 border-surface-700',
  brand: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
  accent: 'bg-accent-500/20 text-accent-300 border-accent-500/30',
  success: 'bg-success-500/20 text-success-400 border-success-500/30',
  danger: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  warning: 'bg-warning-500/20 text-warning-300 border-warning-500/30',
};

const SIZES = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2 py-1 gap-1',
};

export default function Badge({ tone = 'neutral', size = 'md', className = '', children }) {
  const classes = [
    'inline-flex items-center rounded-pill border font-semibold whitespace-nowrap',
    TONES[tone] ?? TONES.neutral,
    SIZES[size] ?? SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
