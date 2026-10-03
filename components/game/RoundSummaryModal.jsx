'use client';

import Link from 'next/link';

export default function RoundSummaryModal({
  isOpen = false,
  isCorrect = false,
  character,
  score = 0,
  currentRound = 1,
  totalRounds = 5,
  onNextRound
}) {
  if (!isOpen || !character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-center space-y-4">
        
        {/* หัวข้อสถานะ */}
        <div className="space-y-1">
          <div className="text-5xl mb-2">{isCorrect ? '🎉' : '⏰'}</div>
          <h3 className={`text-2xl font-black ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isCorrect ? 'ถูกต้องนะคร้าบ!' : 'หมดเวลาซะแล้ว!'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            ด่านที่ {currentRound} จากทั้งหมด {totalRounds} ด่าน
          </p>
        </div>

        {/* ข้อมูลตัวละครเฉลย */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={character.imageUrl || 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png'}
              alt={character.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-white truncate">{character.name}</h4>
            <p className="text-xs text-slate-400 truncate">
              {character.films?.[0] ? `🎬 ${character.films[0]}` : 'Walt Disney Animation'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300">
                +{score} คะแนน
              </span>
            </div>
          </div>
        </div>

        {/* จุดเชื่อมโยงสำคัญ: Link ไปยัง Character Codex ตามมาตรฐาน Day 4 / Day 6 */}
        <div className="pt-1">
          <Link
            href={`/characters/${character._id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline"
          >
            <span>📖</span> อ่านประวัติตัวละครนี้ใน Character Codex <span>↗</span>
          </Link>
        </div>

        {/* ปุ่มไปต่อ */}
        <div className="pt-2">
          <button
            onClick={onNextRound}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition active:scale-95"
          >
            {currentRound < totalRounds ? 'เข้าสู่ด่านถัดไป ➔' : 'ดูผลสรุปคะแนนรวม 🏆'}
          </button>
        </div>

      </div>
    </div>
  );
}
