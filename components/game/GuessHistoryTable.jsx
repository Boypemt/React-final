'use client';

export default function GuessHistoryTable({ history = [] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full space-y-2 mt-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span>📊</span> ประวัติการเดา & ผลการเปรียบเทียบคุณลักษณะ ({history.length} ครั้ง)
        </h4>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ตรงกัน</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> ไม่ตรง</span>
          <span className="flex items-center gap-1"><span>▲/▼</span> มาก/น้อยกว่า</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-700/60">
            <tr>
              <th className="py-2.5 px-3">ตัวละครที่เดา</th>
              <th className="py-2.5 px-3 text-center">ภาพยนตร์ร่วม</th>
              <th className="py-2.5 px-3 text-center">จำนวนหนัง</th>
              <th className="py-2.5 px-3 text-center">ซีรีส์ทีวี</th>
              <th className="py-2.5 px-3 text-center">สวนสนุก</th>
              <th className="py-2.5 px-3 text-center">อักษรแรก</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {history.map((entry, idx) => {
              const { character, comparison } = entry;
              if (!comparison) return null;

              return (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  {/* ตัวละคร */}
                  <td className="py-2 px-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={character.imageUrl || 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png'}
                        alt={character.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png';
                        }}
                      />
                    </div>
                    <span className="font-semibold text-slate-200 truncate max-w-[120px]">{character.name}</span>
                  </td>

                  {/* ภาพยนตร์ร่วม */}
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        comparison.sharedFilms === 'match'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {comparison.sharedFilms === 'match' ? '🟩 มีเรื่องเดียวกัน' : '🟥 คนละเรื่อง'}
                    </span>
                  </td>

                  {/* จำนวนหนัง */}
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        comparison.filmCountStatus === 'match'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span>{comparison.guessedFilmCount} เรื่อง</span>
                      {comparison.filmCountStatus === 'higher' && <span>▲ (ตัวจริงเยอะกว่า)</span>}
                      {comparison.filmCountStatus === 'lower' && <span>▼ (ตัวจริงน้อยกว่า)</span>}
                      {comparison.filmCountStatus === 'match' && <span>🟩 เท่ากัน</span>}
                    </span>
                  </td>

                  {/* มีซีรีส์ทีวีไหม */}
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        comparison.tvStatus === 'match'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {comparison.hasTv ? '📺 มี' : '🎬 ไม่มี'}
                    </span>
                  </td>

                  {/* มีในสวนสนุกไหม */}
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        comparison.parkStatus === 'match'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {comparison.hasPark ? '🏰 มี' : '❌ ไม่มี'}
                    </span>
                  </td>

                  {/* ตัวอักษรแรก A-Z */}
                  <td className="py-2 px-3 text-center font-mono">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        comparison.letterStatus === 'match'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <span>{comparison.guessedLetter}</span>
                      {comparison.letterStatus === 'higher' && <span className="text-amber-400">▲ (A-Z หลังกว่า)</span>}
                      {comparison.letterStatus === 'lower' && <span className="text-amber-400">▼ (A-Z ก่อนหน้า)</span>}
                      {comparison.letterStatus === 'match' && <span>🟩</span>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
