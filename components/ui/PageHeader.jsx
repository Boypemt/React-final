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
 * props: icon (emoji), title (บังคับ), description, children (วางขวา), className
 *
 * [Server หรือ Client?]
 *   Server Component — ข้อความหัวข้อเป็นเนื้อหาคงที่ ไม่ต้องใช้ JS ฝั่ง client
 *   ช่วยให้ First Contentful Paint เร็ว เพราะ HTML มาพร้อมเนื้อหาตั้งแต่แรก
 */
export default function PageHeader({ icon, title, description, className = '', children }) {
  const wrapperClasses = ['w-full max-w-6xl mx-auto px-4 pt-6 pb-4 sm:pt-8', className]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={wrapperClasses}>
      {/* mobile first: ตั้งต้นเรียงลงเป็นคอลัมน์ แล้วค่อยแยกซ้าย-ขวาตอนจอ sm ขึ้นไป */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight">
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
            <p className="mt-1.5 text-xs sm:text-sm text-muted-400 leading-relaxed">{description}</p>
          )}
        </div>

        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </header>
  );
}
