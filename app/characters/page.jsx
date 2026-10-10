import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { fetchCharacters } from '@/lib/disney';
import CharacterSearchBar from '@/components/character/CharacterSearchBar';
import CharacterCodexCard from '@/components/character/CharacterCodexCard';

export const metadata = {
  title: 'สารานุกรมตัวละคร — Disney Character Codex',
  description: 'ค้นหาและสำรวจประวัติ ข้อมูลภาพยนตร์ และเครื่องเล่นของตัวละคร Disney กว่า 7,000+ ตัวจาก Disney API',
};

function getPageHref(targetPage, currentName) {
  const params = new URLSearchParams();
  if (currentName) params.set('name', currentName);
  if (targetPage > 1) params.set('page', String(targetPage));
  const query = params.toString();
  return query ? `/characters?${query}` : '/characters';
}

export default async function CharactersDirectoryPage({ searchParams }) {
  const params = await searchParams;
  const nameQuery = typeof params?.name === 'string' ? params.name.trim() : '';
  const currentPage = Math.max(1, Number(params?.page) || 1);
  const pageSize = 24;

  const { characters, totalPages, count, isFallback } = await fetchCharacters({
    page: currentPage,
    pageSize,
    name: nameQuery,
  });

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 pb-16">
      {/* ส่วนหัวหน้าเว็บ */}
      <PageHeader
        icon="📖"
        title="สารานุกรมตัวละคร"
        description="ค้นหาและสำรวจข้อมูลภาพยนตร์ ซีรีส์ และเครื่องเล่นในสวนสนุกของตัวละคร Disney จาก Live Disney API"
      >
        <Button href="/play" size="sm">
          🎮 ไปเล่นเกมทายตัวละคร
        </Button>
      </PageHeader>

      {/* แถบเตือนกรณีเครือข่ายหลุดและสลับไปใช้ Fallback */}
      {isFallback && (
        <div className="my-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center gap-2.5">
          <span className="text-base select-none">⚠️</span>
          <span>
            ไม่สามารถเชื่อมต่อ Live Disney API ได้ในขณะนี้ — ระบบสลับมาแสดงข้อมูลจากคลังตัวละครสำรองในเครื่องอัตโนมัติ
          </span>
        </div>
      )}

      {/* แถบค้นหา */}
      <CharacterSearchBar initialValue={nameQuery} />

      {/* สรุปจำนวนผลลัพธ์ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 text-xs sm:text-sm text-muted-400">
        <div>
          {nameQuery ? (
            <span>
              ผลการค้นหาสำหรับ &ldquo;<b className="text-brand-300 font-semibold">{nameQuery}</b>&rdquo; — พบทั้งหมด{' '}
              <b className="text-white">{count.toLocaleString('th-TH')}</b> ตัวละคร
            </span>
          ) : (
            <span>
              ตัวละครทั้งหมดในระบบ <b className="text-white">{count.toLocaleString('th-TH')}</b> ตัวละคร (แสดงหน้า {currentPage} จาก {totalPages || 1})
            </span>
          )}
        </div>
        {nameQuery && (
          <Link
            href="/characters"
            className="text-brand-400 hover:text-brand-300 hover:underline inline-flex items-center gap-1"
          >
            <span>↺</span> แสดงตัวละครทั้งหมด
          </Link>
        )}
      </div>

      {/* ตารางแสดงผลตัวละครแบบ Gallery Grid */}
      {characters.length === 0 ? (
        <div className="rounded-3xl bg-surface-900/60 border border-surface-750 p-10 sm:p-16 text-center space-y-4 my-8">
          <div className="text-5xl sm:text-6xl select-none">🔍</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            ไม่พบตัวละครที่ตรงกับคำค้นหา
          </h2>
          <p className="text-xs sm:text-sm text-muted-400 max-w-md mx-auto">
            ลองตรวจสอบตัวสะกด หรือค้นหาด้วยคำอื่น เช่น &ldquo;Mickey&rdquo;, &ldquo;Pooh&rdquo;, &ldquo;Simba&rdquo;, &ldquo;Elsa&rdquo;
          </p>
          <div className="pt-2">
            <Button href="/characters" size="md" variant="secondary">
              ล้างคำค้นหาและแสดงทั้งหมด
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {characters.map((character) => (
              <CharacterCodexCard key={character._id} character={character} />
            ))}
          </div>

          {/* ส่วนควบคุมการเปลี่ยนหน้า (Pagination Controls) */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={getPageHref(currentPage - 1, nameQuery)}
                    className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs sm:text-sm font-semibold border border-surface-700 transition active:scale-95"
                  >
                    ← หน้าก่อนหน้า
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-surface-900 text-muted-600 text-xs sm:text-sm font-semibold border border-surface-800 cursor-not-allowed">
                    ← หน้าก่อนหน้า
                  </span>
                )}

                <span className="px-4 py-2 rounded-xl bg-surface-900/90 text-muted-300 text-xs sm:text-sm font-medium border border-surface-800">
                  หน้า <b className="text-white">{currentPage}</b> / {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={getPageHref(currentPage + 1, nameQuery)}
                    className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs sm:text-sm font-semibold border border-surface-700 transition active:scale-95"
                  >
                    หน้าถัดไป →
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-xl bg-surface-900 text-muted-600 text-xs sm:text-sm font-semibold border border-surface-800 cursor-not-allowed">
                    หน้าถัดไป →
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
