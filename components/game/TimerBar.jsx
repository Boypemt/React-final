'use client';

export default function TimerBar({ timeLeft = 30, maxTime = 30 }) {
  const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));

  // เปลี่ยนสีตามเวลาที่เหลือ
  let colorClass = 'bg-emerald-500 shadow-emerald-500/50';
  if (timeLeft <= 5) {
    colorClass = 'bg-rose-500 shadow-rose-500/50 animate-pulse';
  } else if (timeLeft <= 15) {
    colorClass = 'bg-amber-500 shadow-amber-500/50';
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span>⏱️</span> เวลาที่เหลือ
        </span>
        <span className={`font-mono text-sm px-2 py-0.5 rounded ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-300'}`}>
          {timeLeft} วินาที
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-sm ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
