'use client';

import { useState } from 'react';
import Link from 'next/link';

const FALLBACK_IMAGE = 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png';

export default function CharacterCodexCard({ character }) {
  const [imageError, setImageError] = useState(false);

  if (!character || !character._id) return null;

  const displayImage = imageError || !character.imageUrl ? FALLBACK_IMAGE : character.imageUrl;
  const filmsCount = Array.isArray(character.films) ? character.films.length : 0;
  const tvCount = Array.isArray(character.tvShows) ? character.tvShows.length : 0;
  const parksCount = Array.isArray(character.parkAttractions) ? character.parkAttractions.length : 0;

  return (
    <Link
      href={`/characters/${character._id}`}
      className="group block rounded-2xl bg-surface-900/80 border border-surface-700/70 p-4 shadow-md hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-500/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
    >
      {/* กรอบรูปภาพตัวละคร */}
      <div className="w-full h-44 rounded-xl bg-surface-950/80 border border-surface-800 p-3 flex items-center justify-center overflow-hidden relative mb-3.5">
        <span className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-900/80 border border-surface-700 text-muted-400">
          #{character._id}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={character.name || 'Disney Character'}
          onError={() => setImageError(true)}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      </div>

      {/* ข้อมูลชื่อและสถิติ */}
      <div className="space-y-2">
        <h3 className="font-bold text-white text-base truncate group-hover:text-brand-300 transition-colors">
          {character.name}
        </h3>

        {/* Badges สรุปสื่อที่ปรากฏ */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {filmsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-300 border border-brand-500/25">
              <span>🎬</span> {filmsCount} เรื่อง
            </span>
          )}
          {tvCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-secondary-500/15 text-secondary-300 border border-secondary-500/25">
              <span>📺</span> {tvCount} ซีรีส์
            </span>
          )}
          {parksCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-warning-500/15 text-warning-300 border border-warning-500/25">
              <span>🏰</span> {parksCount} สวนสนุก
            </span>
          )}
          {filmsCount === 0 && tvCount === 0 && parksCount === 0 && (
            <span className="text-[11px] text-muted-500 italic">
              Disney Archive
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
