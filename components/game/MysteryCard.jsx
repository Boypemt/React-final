'use client';

import { useState } from 'react';

export default function MysteryCard({ character, isSolved = false, revealedLevel = 1 }) {
  const [imgError, setImgError] = useState(false);

  // คำนวณความสว่างของเงาตามจำนวนคำใบ้ที่เปิด (เปิดเยอะขึ้น เงามัวเริ่มจางลงเล็กน้อย)
  let silhouetteFilter = 'brightness(0) contrast(200%)';
  if (revealedLevel === 2) silhouetteFilter = 'brightness(0.15) contrast(150%) blur(1px)';
  if (revealedLevel >= 3) silhouetteFilter = 'brightness(0.3) contrast(120%) blur(0.5px)';

  const fallbackImage = 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png';
  const displayImage = imgError || !character?.imageUrl ? fallbackImage : character.imageUrl;

  return (
    <div className="perspective-1000 w-48 h-56 sm:w-56 sm:h-64 mx-auto my-3">
      <div className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${isSolved ? 'rotate-y-180' : ''}`}>
        
        {/* ด้านหน้า: Mystery Silhouette Card (ยังไม่เฉลย) */}
        <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 p-4 flex flex-col items-center justify-center shadow-xl">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Mystery Character Silhouette"
              className="max-w-full max-h-full object-contain transition-all duration-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
              style={{ filter: silhouetteFilter }}
              onError={() => setImgError(true)}
            />
            {/* เครื่องหมาย ? ปริศนา ตรงกลาง */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl sm:text-6xl font-black text-amber-400/90 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] select-none animate-pulse">
                ?
              </span>
            </div>
          </div>
          <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
            Who&apos;s that Character?
          </span>
        </div>

        {/* ด้านหลัง: Revealed Card (เฉลยเมื่อทายถูก) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-b from-blue-900/60 to-indigo-950/80 border-2 border-emerald-500/80 p-4 flex flex-col items-center justify-center shadow-2xl shadow-emerald-500/20">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={character?.name || 'Disney Character'}
              className="max-w-full max-h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              onError={() => setImgError(true)}
            />
          </div>
          <h3 className="mt-2 text-base sm:text-lg font-black text-emerald-300 tracking-wide text-center truncate w-full">
            {character?.name}
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-0.5">
            ✨ ทายถูกต้อง!
          </span>
        </div>

      </div>
    </div>
  );
}
