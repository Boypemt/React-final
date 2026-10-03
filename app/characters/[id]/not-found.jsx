import Link from 'next/link';

export default function CharacterNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto my-auto">
      <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-4xl mb-4 shadow-xl">
        <span>🔍</span>
      </div>
      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
        404 Character Not Found
      </span>
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
        ไม่พบตัวละครรหัสนี้ในสมุดบันทึก Disney
      </h2>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        รหัสตัวละครที่คุณค้นหาอาจไม่มีอยู่จริงใน Disney API หรือเป็นตัวละครที่ยังไม่ได้รับการบันทึกข้อมูล
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/play"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md transition"
        >
          🎮 กลับไปกระดานเกม
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition"
        >
          🏠 หน้าแรก
        </Link>
      </div>
    </div>
  );
}
