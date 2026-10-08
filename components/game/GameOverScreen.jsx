'use client';

import { useState } from 'react';
import Link from 'next/link';
import ScoreSubmissionForm from '@/components/ScoreSubmissionForm';

export default function GameOverScreen({
  gameMode = 'deduction',
  totalScore = 0,
  roundHistory = [],
  totalTimeSpent = 0,
  character = null,
  isCorrect = true,
  guessesCount = 0,
  shareableEmojiGrid = '',
  onRestart
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `🏰 Disney Guesser (${gameMode === 'deduction' ? 'PokéGuesser Deduction' : 'Trivia'})
🎯 ทายสำเร็จ: ${isCorrect ? `${guessesCount} ครั้ง` : 'ยอมแพ้'}
⭐ คะแนน: ${totalScore.toLocaleString()} แต้ม
⏱️ เวลา: ${totalTimeSpent} วิ
${shareableEmojiGrid}
เล่นได้ที่: Disney Character Clue Guesser`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const correctCount = roundHistory.filter(r => r.isCorrect).length;
  const totalRounds = roundHistory.length || 5;
  const firstClueWins = roundHistory.filter((round) => round.isCorrect && round.cluesUsed === 1).length;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl text-center space-y-6">
      
      {/* ส่วนหัวข้อชัยชนะตามโหมด */}
      {gameMode === 'deduction' ? (
        <div className="space-y-3">
          <div className="text-6xl animate-bounce">
            {isCorrect ? '🕵️‍♂️' : '🎭'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isCorrect ? 'อนุมานตัวละครปริศนาสำเร็จ!' : 'ยอมแพ้เฉลยตัวละครลับ!'}
          </h2>
          {character && (
            <div className="flex items-center justify-center gap-3 p-3 bg-slate-800/80 rounded-xl max-w-md mx-auto border border-slate-700">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={character.imageUrl || 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png'}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left truncate">
                <p className="text-xs text-slate-400 font-medium">ตัวละครลับคือ</p>
                <h3 className="text-lg font-bold text-amber-300 truncate">{character.name}</h3>
              </div>
              {character._id && (
                <Link
                  href={`/characters/${character._id}`}
                  className="ml-auto text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  📖 ดูประวัติ Codex
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-6xl animate-bounce">🏆</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ภารกิจสิ้นสุดครบ 5 ด่าน!
          </h2>
          <p className="text-slate-400 text-sm">
            คุณทำผลงานยอดเยี่ยมในการทายตัวละคร Disney
          </p>
        </div>
      )}

      {/* สรุปคะแนนตัวเลข */}
      <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <p className="text-xs text-slate-400 font-medium">คะแนนรวม</p>
          <p className="text-2xl font-black text-amber-400">{totalScore.toLocaleString()}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <p className="text-xs text-slate-400 font-medium">
            {gameMode === 'deduction' ? 'จำนวนครั้งที่ทาย' : 'ทายถูกต้อง'}
          </p>
          <p className="text-2xl font-black text-emerald-400">
            {gameMode === 'deduction' ? `${guessesCount} ครั้ง` : `${correctCount} / ${totalRounds}`}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <p className="text-xs text-slate-400 font-medium">เวลารวม</p>
          <p className="text-2xl font-black text-blue-400">{totalTimeSpent} วินาที</p>
        </div>
      </div>

      {/* ในโหมด Deduction: กล่องแชร์ผลงานสไตล์ Wordle / PokéGuesser */}
      {gameMode === 'deduction' && shareableEmojiGrid && (
        <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 max-w-md mx-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>ตารางผลลัพธ์การอนุมาน (Shareable Grid):</span>
            <span className="text-emerald-400 font-mono">Wordle / PokéGuesser Style</span>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg font-mono text-sm leading-relaxed tracking-widest text-center border border-slate-800 whitespace-pre">
            {shareableEmojiGrid}
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
          >
            <span>{copied ? '✔️ คัดลอกผลลัพธ์แล้ว!' : '📋 คัดลอกตาราง Emoji ไปแชร์'}</span>
          </button>
        </div>
      )}

      {/* ในโหมด Trivia: สรุปรายการ 5 ตัวละครที่เล่นไป */}
      {gameMode === 'trivia' && (
        <div className="space-y-2 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            สรุปผลงานรายด่าน:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {roundHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                  item.isCorrect
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-400">ด่าน {idx + 1}</span>
                <span className="text-xs font-bold truncate w-full mt-1">{item.character.name}</span>
                <span className="text-[11px] font-semibold mt-0.5">
                  {item.isCorrect ? `+${item.score}` : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* [ไกด์สำหรับ สิรวิชญ์ 682110199]:                         */}
      {/* นำ <ScoreSubmissionForm /> (react-hook-form + zod)      */}
      {/* มาเสียบที่ Slot ด้านล่างนี้ โดยรับ Props ได้ทันที           */}
      {/* ======================================================== */}
      <div id="sirawich-score-form-slot" className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-left">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-blue-300 flex items-center gap-1.5">
            <span>📝</span> บันทึกคะแนนขึ้นสู่กระดานผู้นำ (Leaderboard)
          </h4>
          <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            ระบบของสิรวิชญ์
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3">
          คะแนนโหมด <span className="font-bold text-amber-300">{gameMode === 'deduction' ? 'Deduction Solo' : 'Trivia Time-Attack'}</span> ส่งขึ้นกระดานผู้นำได้เลย
        </p>
        <ScoreSubmissionForm
          gameMode={gameMode}
          score={totalScore}
          timeSpentSeconds={totalTimeSpent}
          guessesCount={gameMode === 'deduction'
            ? guessesCount
            : roundHistory.reduce((sum, round) => sum + round.guessesCount, 0)}
          correctCount={gameMode === 'deduction' ? Number(isCorrect) : correctCount}
          firstClueWins={firstClueWins}
        />
        <div className="flex gap-2">
          <Link
            href="/scoreboard"
            className="flex-1 py-2.5 text-center text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition"
          >
            📊 ดูกระดานผู้นำทั้งหมด
          </Link>
          <Link
            href="/achievement"
            className="flex-1 py-2.5 text-center text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            🎖️ ตรวจสอบเหรียญรางวัล
          </Link>
        </div>
      </div>

      {/* ปุ่มเล่นใหม่อีกครั้ง */}
      <div className="pt-2">
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-blue-500/20 transition active:scale-95 cursor-pointer"
        >
          🔄 เล่นใหม่อีกครั้ง ({gameMode === 'deduction' ? 'สุ่มตัวละครใหม่' : 'เริ่มรอบใหม่ 5 ด่าน'})
        </button>
      </div>

    </div>
  );
}
