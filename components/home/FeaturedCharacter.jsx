/**
 * FeaturedCharacter — การ์ดตัวละครแนะนำประจำวัน
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [ทำไมเป็น Server Component? — Decision Framework]
 *   ไฟล์นี้ไม่มี 'use client' จึงเป็น Server Component ตามค่าเริ่มต้น เหตุผล:
 *     1. เป็น "ข้อมูล" ไม่ใช่ "การโต้ตอบ" — เลือกตัวละครจากวันที่ แล้วแสดงผล
 *        คำนวณฝั่ง Server ได้เลย ผู้เล่นได้ HTML ที่มีตัวละครมาแล้วตั้งแต่ไบต์แรก
 *        ไม่มี spinner ไม่มีจังหวะกระพริบ (ตรงตามที่เขียนไว้ใน Proposal ข้อ 3)
 *     2. การเฉลยเงาดำทำด้วย CSS ล้วน (group-hover / group-focus-within)
 *        ไม่ต้องใช้ useState หรือ event handler เลย จึงไม่ต้องเป็น Client Component
 *        = ส่ง JavaScript ไปเบราว์เซอร์ 0 ไบต์สำหรับฟีเจอร์นี้
 *     3. ถ้าเลือกตัวละครฝั่ง Client จะเสี่ยง Hydration Mismatch
 *        เพราะนาฬิกาเครื่องผู้เล่นอาจคนละโซนเวลากับ Server
 *
 *   หมายเหตุ: ใช้ <img> ธรรมดา (ไม่ใช่ next/image) เพื่อให้ตรงกับที่ปัณณวิชญ์
 *   ใช้อยู่ทั้ง 7 จุดใน components/game/* และ components/character/*
 *   จะได้พฤติกรรมการโหลดรูปเหมือนกันทั้งเว็บ
 */
import curatedCharacters from '@/lib/data/curated-disney.json';
import { getFeaturedCharacter } from '@/lib/featured';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function FeaturedCharacter() {
  const { character, dateString } = getFeaturedCharacter(curatedCharacters);

  // กันเหนียว: ถ้าไฟล์ข้อมูลว่างเปล่า ก็ไม่ต้องแสดงอะไร ดีกว่าทำให้หน้าพัง
  if (!character) return null;

  const filmCount = character.films?.length ?? 0;
  const tvCount = character.tvShows?.length ?? 0;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-muted-300 flex items-center gap-2">
          <span aria-hidden="true">🌟</span> ตัวละครแนะนำประจำวัน
        </h2>
        <Badge tone="neutral" size="sm">
          {dateString}
        </Badge>
      </div>

      <Card highlight>
        {/*
          group = ตัวจับ hover/focus ของทั้งการ์ด
          group-focus-within ทำให้ "กด Tab มาที่ปุ่ม" ก็เฉลยได้เหมือนกัน
          ไม่ใช่เฉพาะคนที่ใช้เมาส์ hover ได้ (สำคัญกับการเข้าถึงและผู้ใช้มือถือ)
        */}
        <div className="group flex flex-col sm:flex-row items-center gap-5">
          {/* รูปเงาดำ */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center rounded-card bg-gradient-to-b from-surface-800 to-surface-900 border border-surface-700 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={character.imageUrl}
              alt=""
              aria-hidden="true"
              className="max-w-[85%] max-h-[85%] object-contain brightness-0 opacity-70 transition-all duration-500 group-hover:brightness-100 group-hover:opacity-100 group-focus-within:brightness-100 group-focus-within:opacity-100 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            />
            {/* เครื่องหมาย ? หายไปตอนเฉลย */}
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center text-5xl font-black text-warning-400/90 transition-opacity duration-500 group-hover:opacity-0 group-focus-within:opacity-0 select-none"
            >
              ?
            </span>
          </div>

          {/* ข้อมูล */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {/*
              ชื่อถูกซ่อนด้วย blur + select-none จนกว่าจะ hover/focus
              ใช้ opacity/blur ไม่ใช่ hidden เพราะ screen reader ยังต้องอ่านชื่อได้
              (ผู้ใช้ที่มองไม่เห็นไม่ได้มาเล่นเกมทายเงา จึงไม่ถือว่าสปอยล์)
            */}
            <p className="text-xs text-muted-500 mb-1">ชื่อตัวละคร</p>
            <p className="text-xl sm:text-2xl font-black text-white blur-sm select-none transition-all duration-500 group-hover:blur-0 group-hover:select-auto group-focus-within:blur-0">
              {character.name}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge tone="brand" size="sm">
                🎬 {filmCount} ภาพยนตร์
              </Badge>
              {tvCount > 0 && (
                <Badge tone="accent" size="sm">
                  📺 {tvCount} ซีรีส์
                </Badge>
              )}
              <Badge tone="warning" size="sm">
                🔤 ขึ้นต้นด้วย {character.name[0].toUpperCase()}
              </Badge>
            </div>

            <p className="mt-3 text-xs text-muted-400">
              เอาเมาส์ชี้ที่การ์ด (หรือกด Tab มาที่ปุ่ม) เพื่อเฉลยตัวละคร
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Button href={`/characters/${character._id}`} variant="secondary" size="sm">
                <span aria-hidden="true">📖</span> ดูข้อมูลใน Codex
              </Button>
              <Button href="/play?mode=deduction" variant="ghost" size="sm">
                ลองทายตัวนี้ดู
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
