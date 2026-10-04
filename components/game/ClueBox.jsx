'use client';

export default function ClueBox({ clues = [], revealedLevel = 1, onUnlockNext, disabled = false }) {
  const clueLevels = [
    { level: 1, title: 'คำใบ้ระดับ 1 (ยาก)', penalty: 'ฟรี' },
    { level: 2, title: 'คำใบ้ระดับ 2 (ปานกลาง)', penalty: '-250 คะแนน' },
    { level: 3, title: 'คำใบ้ระดับ 3 (ง่ายสุด)', penalty: '-500 คะแนน' },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
          <span>💡</span> คำใบ้จาก AI
        </h3>
        {revealedLevel < 3 && !disabled && (
          <button
            onClick={onUnlockNext}
            className="text-xs px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold transition flex items-center gap-1 hover:scale-105 active:scale-95"
          >
            <span>🔓</span> ขอคำใบ้เพิ่ม ({revealedLevel === 1 ? '-250' : '-500'} คะแนน)
          </button>
        )}
      </div>

      <div className="space-y-2">
        {clueLevels.map(({ level, title, penalty }) => {
          const isRevealed = level <= revealedLevel;
          const clueText = clues[level - 1] || 'กำลังดาวน์โหลดคำใบ้...';

          return (
            <div
              key={level}
              className={`p-3 rounded-xl border transition-all duration-300 text-left ${
                isRevealed
                  ? 'bg-slate-800/90 border-slate-700 text-slate-200 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`font-semibold ${isRevealed ? 'text-blue-400' : 'text-slate-500'}`}>
                  {title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isRevealed ? 'เปิดแล้ว' : `ล็อก (${penalty})`}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                {isRevealed ? (
                  <span>{clueText}</span>
                ) : (
                  <span className="italic select-none text-slate-600 flex items-center gap-1.5">
                    <span>🔒</span> กดปุ่มเพื่อปลดล็อกคำใบ้ระดับนี้
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
