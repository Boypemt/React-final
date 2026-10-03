import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
      {/* ======================================================== */}
      {/* [ไกด์สำหรับ เมธาสิทธิ์ 682110189]:                      */}
      {/* หน้านี้เป็นกรรมสิทธิ์หลักของเมธาสิทธิ์ สามารถปรับดีไซน์ Hero, */}
      {/* แนะนำโหมดการเล่น, หรือ Featured Character ได้ตามต้องการ     */}
      {/* ======================================================== */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <span>✨</span> Final Project กลุ่ม Sigma
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
          ทายตัวละคร <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Disney</span> ด้วยคำใบ้ AI
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          ท้าทายความรอบรู้เรื่องแอนิเมชันดิสนีย์! เดาชื่อตัวละครจากคำใบ้ลำดับขั้นของ AI 
          พร้อมระบบเปรียบเทียบคุณลักษณะภาพยนตร์และสวนสนุกสไตล์ PokéGuesser
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/play?mode=deduction"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition duration-200 flex items-center gap-2"
          >
            <span>🧠</span> โหมด Guesser Deduction
          </Link>
          <Link
            href="/play?mode=trivia"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition duration-200 flex items-center gap-2"
          >
            <span>⏱️</span> โหมด Trivia 5 ด่าน
          </Link>
          <Link
            href="/characters/4703"
            className="px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-base transition flex items-center gap-2"
          >
            <span>📖</span> Codex ตัวอย่าง (Mickey)
          </Link>
        </div>
      </div>
    </div>
  );
}
