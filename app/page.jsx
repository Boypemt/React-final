/**
 * app/page.jsx — หน้าแรก (Home)
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมหน้านี้เป็น Server Component? — Decision Framework]
 *   ไฟล์นี้ไม่มี 'use client' จึงเป็น Server Component ตามค่าเริ่มต้นของ Next.js 15
 *     1. เนื้อหาเกือบทั้งหน้าเป็นข้อความคงที่ (Hero, วิธีเล่น, แถบท้าย)
 *        เรนเดอร์ฝั่ง Server แล้วส่ง HTML สำเร็จไปเลย ได้ First Contentful Paint เร็ว
 *        และไม่ต้องส่ง JavaScript ไปรันที่เบราว์เซอร์สำหรับส่วนเหล่านี้เลย
 *     2. ตัวละครแนะนำประจำวันเลือกจากวันที่ฝั่ง Server (ดู lib/featured.js)
 *        ถ้าเลือกฝั่ง Client จะเสี่ยง Hydration Mismatch เพราะนาฬิกาเครื่องผู้เล่น
 *        อาจอยู่คนละโซนเวลากับ Server
 *     3. มีเพียง <ModeSelector /> ที่เป็น "เกาะ Client" เพราะต้องเก็บ state
 *        ของโหมดที่เลือกและสั่ง router.push() ตอนกดปุ่ม
 *
 * [ทำไมต้องใส่ revalidate?]
 *   ถ้าไม่ใส่ Next.js จะ prerender หน้านี้ "ครั้งเดียวตอน build" (Static)
 *   ตัวละครประจำวันก็จะค้างเป็นตัวของวันที่ build ตลอดไป ไม่เปลี่ยนตามวันจริง
 *   การตั้ง revalidate = 300 ทำให้หน้าถูกสร้างใหม่ทุก 5 นาที (ISR)
 *   จึงยังได้ความเร็วของหน้า static แต่ตัวละครจะสลับภายใน 5 นาทีหลังเที่ยงคืนไทย
 */
import { MODES } from '@/lib/gameModes';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ModeSelector from '@/components/home/ModeSelector';
import FeaturedCharacter from '@/components/home/FeaturedCharacter';

/** สร้างหน้าใหม่ทุก 5 นาที เพื่อให้ตัวละครประจำวันเปลี่ยนตามวันจริง */
export const revalidate = 300;

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col pb-10">
      {/* ===================== 1. Hero ===================== */}
      {/* ใช้ <PageHeader size="hero" /> จาก Design System เพื่อให้หัวข้อหน้าแรก
          ใช้ไล่สีและระยะห่างชุดเดียวกับหน้าอื่น ๆ ที่สิรวิชญ์จะทำต่อ */}
      <PageHeader
        size="hero"
        title="ทายตัวละคร Disney ด้วยคำใบ้ AI"
        description="ท้าทายความรอบรู้เรื่องแอนิเมชันดิสนีย์ เดาชื่อตัวละครจากคำใบ้ที่ Gemini AI สร้างให้ พร้อมตารางเปรียบเทียบคุณลักษณะสไตล์ PokéGuesser จากตัวละครจริง 50 ตัว"
        badge={
          <Badge tone="brand" size="sm">
            <span aria-hidden="true">✨</span> Final Project กลุ่ม Sigma
          </Badge>
        }
      >
        {/* ลิงก์ไปที่ตัวเลือกโหมดด้านล่าง (ไม่ข้ามขั้นไปเริ่มเกมทันที
            เพื่อให้ผู้เล่นใหม่ได้อ่านก่อนว่าสองโหมดต่างกันอย่างไร) */}
        <Button href="#mode-selector" size="lg">
          <span aria-hidden="true">🎯</span> เลือกโหมดแล้วเริ่มเล่น
        </Button>
        <Button href="/scoreboard" variant="ghost" size="lg">
          <span aria-hidden="true">🏆</span> ดูกระดานผู้นำ
        </Button>
      </PageHeader>

      {/* ===================== 2. เลือกโหมด (Client Island) ===================== */}
      <ModeSelector />

      {/* ===================== 3. ตัวละครแนะนำประจำวัน ===================== */}
      <FeaturedCharacter />

      {/* ===================== 4. วิธีเล่น ===================== */}
      <section className="w-full max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-lg sm:text-xl font-bold text-muted-300 mb-4 flex items-center gap-2">
          <span aria-hidden="true">📘</span> วิธีเล่น
        </h2>

        {/* mobile first: คอลัมน์เดียวก่อน แล้วแยกสองคอลัมน์ตอนจอ md ขึ้นไป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {MODES.map((mode) => (
            <Card key={mode.id} as="article">
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true" className="text-2xl">
                  {mode.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-white">{mode.name}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-muted-500">
                    {mode.subtitle}
                  </p>
                </div>
              </div>

              <ol className="space-y-2.5">
                {mode.steps.map((step, i) => (
                  <li key={step} className="flex gap-2.5 text-xs sm:text-sm text-muted-400">
                    <span
                      aria-hidden="true"
                      className="shrink-0 w-5 h-5 rounded-pill bg-brand-500/20 text-brand-300 text-[11px] font-bold flex items-center justify-center"
                    >
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4">
                <Button href={`/play?mode=${mode.id}`} variant="secondary" size="sm">
                  เล่นโหมดนี้เลย
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===================== 5. แถบเทคโนโลยีที่ใช้ ===================== */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-2">
        <div className="rounded-card border border-surface-700/70 bg-surface-900/50 px-4 py-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          <span className="text-xs text-muted-500">ขับเคลื่อนด้วย</span>
          <Badge tone="brand" size="sm">
            Disney API
          </Badge>
          <span className="text-xs text-muted-600">+</span>
          <Badge tone="accent" size="sm">
            Gemini AI
          </Badge>
        </div>
      </section>
    </div>
  );
}
