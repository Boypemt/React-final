'use client';

import { useState, useRef, useEffect } from 'react';
import curatedCharacters from '@/lib/data/curated-disney.json';

export default function CharacterSuggestInput({ onGuess, disabled = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  // กรองรายชื่อตัวละครตามคำค้น (Case-insensitive substring match)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const cleanQuery = query.toLowerCase().trim();
    const matches = curatedCharacters.filter(c =>
      c.name.toLowerCase().includes(cleanQuery)
    ).slice(0, 8); // แสดงสูงสุด 8 รายการ

    setSuggestions(matches);
    setIsOpen(matches.length > 0);
    setSelectedIndex(-1);
  }, [query]);

  // ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (character) => {
    if (!character || disabled) return;
    onGuess(character);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length === 1) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="พิมพ์ชื่อตัวละครภาษาอังกฤษ (เช่น Mickey, Simba, Elsa)..."
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition shadow-inner disabled:opacity-50"
          />
          {query && !disabled && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (suggestions.length > 0) {
              handleSelect(suggestions[0]);
            }
          }}
          disabled={disabled || suggestions.length === 0}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
        >
          <span>🎯</span> ทายเลย!
        </button>
      </div>

      {/* Autocomplete Dropdown List พร้อมรูป Avatar */}
      {isOpen && (
        <ul className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800">
          {suggestions.map((char, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={char._id}
                onClick={() => handleSelect(char)}
                className={`px-3 py-2 flex items-center gap-3 cursor-pointer transition ${
                  isSelected ? 'bg-blue-600/30 text-white' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={char.imageUrl || 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png'}
                    alt={char.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{char.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {char.films?.[0] ? `🎬 ${char.films[0]}` : 'Disney Animation'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">#{char._id}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
