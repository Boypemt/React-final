/**
 * PageHeader — หัวข้อหน้าแบบเดียวกันทุกหน้า (Design System)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [วิธีใช้ — สำหรับสิรวิชญ์ (/scoreboard, /achievement) และทุกคนในทีม]
 *   import PageHeader from '@/components/ui/PageHeader';
 *
 *   <PageHeader
 *     icon="🏆"
 *     title="กระดานผู้นำ"
 *     description="อันดับผู้ทำคะแนนสูงสุด อัปเดตทุก 30 วินาที"
 *   />
 *
 *   // มีปุ่ม/ตัวกรองวางด้านขวา (บนมือถือจะตกลงมาอยู่บรรทัดใหม่เอง)
 *   <PageHeader icon="🏅" title="เหรียญรางวัล">
 *     <Button href="/play" size="sm">เล่นต่อ</Button>
 *   </PageHeader>
 *
 *   // size="hero" สำหรับหัวหน้าแรก: ตัวใหญ่ขึ้นและจัดกลางทั้งหมด
 *   <PageHeader size="hero" title="..." description="..." badge={<Badge/>}>
 *     <Button size="lg">เริ่มเล่น</Button>
 *   </PageHeader>
 *
 * props: icon (emoji), title (บังคับ), description, badge (วางเหนือหัวข้อ),
 *        children (ปุ่ม/ตัวกรอง), size ('md' | 'hero'), className
 *
 * [Server หรือ Client?]
 *   Server Component — ข้อความหัวข้อเป็นเนื้อหาคงที่ ไม่ต้องใช้ JS ฝั่ง client
 *   ช่วยให้ First Contentful Paint เร็ว เพราะ HTML มาพร้อมเนื้อหาตั้งแต่แรก
 */
export default function PageHeader({
  icon,
  title,
  description,
  badge,
  size = 'md',
  className = '',
  children,
}) {
  const isHero = size === 'hero';

  const wrapperClasses = [
    'w-full max-w-6xl mx-auto px-4',
    isHero ? 'pt-10 pb-6 sm:pt-14 text-center' : 'pt-6 pb-4 sm:pt-8',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={wrapperClasses}>
      {badge && <div className="mb-5">{badge}</div>}

      {/* mobile first: ตั้งต้นเรียงลงเป็นคอลัมน์ แล้วค่อยแยกซ้าย-ขวาตอนจอ sm ขึ้นไป
          ส่วน hero จัดกลางตลอดทุกขนาดจอ */}
      <div
        className={
          isHero
            ? 'flex flex-col items-center gap-0'
            : 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
        }
      >
        <div className="min-w-0">
          <h1
            className={[
              'flex items-center gap-2 font-black tracking-tight',
              isHero
                ? 'justify-center flex-wrap text-3xl sm:text-5xl lg:text-6xl leading-tight'
                : 'text-2xl sm:text-3xl',
            ].join(' ')}
          >
            {icon && (
              <span aria-hidden="true" className="shrink-0">
                {icon}
              </span>
            )}
            <span className="bg-gradient-to-r from-brand-400 via-secondary-300 to-accent-400 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          {description && (
            <p
              className={
                isHero
                  ? 'mt-4 text-sm sm:text-lg text-muted-400 max-w-2xl mx-auto leading-relaxed'
                  : 'mt-1.5 text-xs sm:text-sm text-muted-400 leading-relaxed'
              }
            >
              {description}
            </p>
          )}
        </div>

        {children && (
          <div
            className={
              isHero
                ? 'mt-7 flex flex-col sm:flex-row items-center justify-center gap-3'
                : 'flex items-center gap-2 shrink-0'
            }
          >
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
