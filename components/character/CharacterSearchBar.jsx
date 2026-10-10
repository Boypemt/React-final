'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CharacterSearchBar({ initialValue = '' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = searchTerm.trim();
    if (trimmed) {
      params.set('name', trimmed);
      params.set('page', '1'); // รีเซ็ตหน้ากลับไปหน้าแรกเมื่อค้นหาคำใหม่
    } else {
      params.delete('name');
      params.delete('page');
    }
    router.push(`/characters?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('name');
    params.delete('page');
    const queryString = params.toString();
    router.push(queryString ? `/characters?${queryString}` : '/characters');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto my-6 space-y-2">
      <div className="relative flex items-center">
        <span className="absolute left-4 text-muted-400 select-none text-base sm:text-lg">
          🔍
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อตัวละคร Disney (เช่น Mickey, Simba, Elsa, Aladdin)..."
          className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-2xl bg-surface-900/90 border border-surface-700/80 text-white placeholder-muted-500 text-sm sm:text-base focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition shadow-inner"
        />
        <div className="absolute right-2 flex items-center gap-1.5">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-muted-400 hover:text-white hover:bg-surface-800 transition text-xs font-bold"
              title="ล้างคำค้นหา"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition active:scale-95"
          >
            ค้นหา
          </button>
        </div>
      </div>
    </form>
  );
}
