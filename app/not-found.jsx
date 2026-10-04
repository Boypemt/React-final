import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-7xl mb-4">🪄</div>
      <h1 className="text-3xl font-extrabold text-white mb-2">404 — ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-slate-400 mb-6 max-w-md">
        ดูเหมือนว่าเวทมนตร์จะพาคุณมาผิดทาง หน้านี้ไม่มีอยู่ในสารบบของปราสาทดิสนีย์
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition"
      >
        กลับสู่หน้าหลัก
      </Link>
    </div>
  );
}
