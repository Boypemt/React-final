import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Disney Clue Guesser — เกมทายตัวละคร Disney ด้วยคำใบ้ AI',
  description: 'เกมทายชื่อตัวละคร Disney จากคำใบ้ AI และระบบเปรียบเทียบคุณลักษณะสไตล์ PokéGuesser',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        {/* ======================================================== */}
        {/* [ไกด์สำหรับ เมธาสิทธิ์ 682110189]:                      */}
        {/* นำ <Nav /> ที่มี usePathname() และดีไซน์ Tailwind มาใส่แทน  */}
        {/* ======================================================== */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent hover:opacity-90 transition">
              <span>🏰</span>
              <span>Disney Guesser</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-slate-400 hover:text-white transition">หน้าแรก</Link>
              <Link href="/play" className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/20 transition">เล่นเกม</Link>
              <Link href="/scoreboard" className="text-slate-400 hover:text-white transition">อันดับ</Link>
              <Link href="/achievement" className="text-slate-400 hover:text-white transition">เหรียญรางวัล</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/60">
          <p>© 2026 Disney Clue Guesser — Final Project กลุ่ม Sigma</p>
          <p className="mt-1 text-slate-600">ขับเคลื่อนด้วย Disney API & Google Gemini AI</p>
        </footer>
      </body>
    </html>
  );
}
