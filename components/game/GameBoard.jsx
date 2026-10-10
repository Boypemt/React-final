'use client';

import { useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { useTimer } from '@/hooks/useTimer';
import { calculateDeductionScore } from '@/lib/gameLogic';
import TimerBar from './TimerBar';
import MysteryCard from './MysteryCard';
import ClueBox from './ClueBox';
import CharacterSuggestInput from './CharacterSuggestInput';
import GuessHistoryTable from './GuessHistoryTable';
import RoundSummaryModal from './RoundSummaryModal';
import GameOverScreen from './GameOverScreen';

export default function GameBoard() {
  const {
    gameMode,
    gameState,
    currentRound,
    totalRounds,
    revealedCharacter,
    silhouetteUrl,
    currentClues,
    revealedClueLevel,
    guessHistory,
    totalScore,
    lastRoundScore,
    roundHistory,
    isRoundSolved,
    totalTimeSpent,
    shareableEmojiGrid,
    errorMessage,
    switchMode,
    startGame,
    unlockNextClue,
    submitGuess,
    giveUpDeduction,
    endRoundByTimeout,
    nextRound,
    restartGame
  } = useGame();

  // ตัวจับเวลาถอยหลัง 30 วินาที (เฉพาะโหมด Trivia)
  const { timeLeft, start: startTimer, pause: pauseTimer, reset: resetTimer } = useTimer(
    30,
    endRoundByTimeout
  );

  // เดินเวลาเฉพาะเมื่ออยู่ในโหมด Trivia
  useEffect(() => {
    if (gameState === 'PLAYING' && gameMode === 'trivia') {
      resetTimer(30);
      startTimer();
    } else {
      pauseTimer();
    }
  }, [gameState, currentRound, gameMode, resetTimer, startTimer, pauseTimer]);

  // เริ่มเกมอัตโนมัติเมื่อเข้าหน้าครั้งแรก
  useEffect(() => {
    if (gameState === 'IDLE') {
      startGame(gameMode);
    }
  }, [gameState, gameMode, startGame]);

  if (gameState === 'IDLE' || gameState === 'LOADING') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-semibold animate-pulse">
          {gameMode === 'deduction'
            ? 'กำลังสุ่มตัวละครลับสำหรับโหมด PokéGuesser Deduction...'
            : `กำลังเตรียมตัวละครและคำใบ้ AI ด่านที่ ${currentRound}...`}
        </p>
      </div>
    );
  }

  // สถานะผิดพลาด: เริ่มเกมไม่ได้เพราะยิง Route Handler ไม่สำเร็จ
  // (เช่นยังไม่ตั้ง GAME_SECRET หรือเครือข่ายหลุด) — เกมต้องบอกให้ชัด ไม่ค้างที่สปินเนอร์
  if (gameState === 'ERROR') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4">
        <div className="text-5xl">🛑</div>
        <p className="text-slate-300 text-sm font-semibold">เริ่มเกมไม่สำเร็จ</p>
        {errorMessage && (
          <p className="text-xs text-rose-300 max-w-md bg-rose-950/30 border border-rose-500/30 rounded-lg px-3 py-2">
            {errorMessage}
          </p>
        )}
        <button
          onClick={() => startGame(gameMode)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow transition cursor-pointer"
        >
          🔄 ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (gameState === 'GAME_OVER') {
    return (
      <div className="p-4 sm:p-6 my-auto">
        <GameOverScreen
          gameMode={gameMode}
          totalScore={totalScore}
          roundHistory={roundHistory}
          totalTimeSpent={totalTimeSpent}
          character={revealedCharacter}
          isCorrect={isRoundSolved}
          guessesCount={guessHistory.length}
          shareableEmojiGrid={shareableEmojiGrid}
          onRestart={restartGame}
        />
      </div>
    );
  }

  const currentPossibleScore = calculateDeductionScore(guessHistory.length + 1);

  return (
    <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-4 text-center">
      
      {/* แท็บสลับโหมดเกม (Mode Switcher Tabs) */}
      <div className="flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 max-w-md mx-auto shadow-inner">
        <button
          onClick={() => switchMode('deduction')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            gameMode === 'deduction'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🧠</span>
          <span>PokéGuesser Deduction</span>
        </button>
        <button
          onClick={() => switchMode('trivia')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            gameMode === 'trivia'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⏱️</span>
          <span>Trivia Time-Attack (5 ด่าน)</span>
        </button>
      </div>

      {/* แถบสถานะด้านบนตามโหมด */}
      {gameMode === 'deduction' ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">เดาไปแล้ว:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 font-black text-sm border border-indigo-500/30">
              {guessHistory.length} ครั้ง
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">คะแนนหากถูกรอบนี้:</span>
            <span className="text-amber-400 font-black text-base">
              {currentPossibleScore.toLocaleString()} แต้ม
            </span>
          </div>

          <div>
            <button
              onClick={giveUpDeduction}
              disabled={gameState !== 'PLAYING'}
              className="text-xs text-slate-400 hover:text-rose-400 font-semibold transition px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
              title="ยอมแพ้เพื่อดูเฉลยตัวละครลับ"
            >
              ยอมแพ้เฉลย 🏳️
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ด่าน:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 font-black text-sm border border-blue-500/30">
              {currentRound} / {totalRounds}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">คะแนนสะสม:</span>
            <span className="text-amber-400 font-black text-base">
              {totalScore.toLocaleString()}
            </span>
          </div>

          <div>
            <button
              onClick={endRoundByTimeout}
              disabled={gameState !== 'PLAYING'}
              className="text-xs text-slate-400 hover:text-rose-400 font-semibold transition px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
              title="ยอมแพ้ข้ามไปด่านถัดไป"
            >
              ข้ามด่าน ⏩
            </button>
          </div>
        </div>
      )}

      {/* แถบเวลา (แสดงเฉพาะโหมด Trivia) */}
      {gameMode === 'trivia' && <TimerBar timeLeft={timeLeft} maxTime={30} />}

      {/* คำแนะนำของโหมด Deduction */}
      {gameMode === 'deduction' && (
        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
          💡 <strong>กติกา PokéGuesser:</strong> ทายชื่อตัวละครเพื่อนำคุณลักษณะ (ภาพยนตร์ร่วม, จำนวนหนัง, ซีรีส์ทีวี, สวนสนุก, อักษร A-Z) มาวิเคราะห์หาตัวละครลับ!
        </div>
      )}

      {/* แจ้งเตือนเมื่อยิง Route Handler ไม่สำเร็จระหว่างเล่น (เช่นกดขอคำใบ้แล้วเน็ตหลุด) */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* การ์ดเงามืดปริศนา (Mystery Card Who's That Disney Character) */}
      <MysteryCard
        silhouetteUrl={silhouetteUrl}
        character={revealedCharacter}
        isSolved={isRoundSolved}
        revealedLevel={gameMode === 'deduction' ? 1 : revealedClueLevel}
      />

      {/* กล่องคำใบ้ AI 3 ระดับ (เฉพาะโหมด Trivia) */}
      {gameMode === 'trivia' && (
        <ClueBox
          clues={currentClues}
          revealedLevel={revealedClueLevel}
          onUnlockNext={unlockNextClue}
          disabled={gameState !== 'PLAYING'}
        />
      )}

      {/* ช่อง Input พร้อม Autocomplete และรูป Avatar */}
      <div className="pt-2">
        <CharacterSuggestInput
          onGuess={(character) => submitGuess(character, timeLeft)}
          disabled={gameState !== 'PLAYING'}
        />
      </div>

      {/* ตารางเปรียบเทียบคุณลักษณะ (PokéGuesser Style Deduction Grid)
          แสดงเฉพาะโหมด Deduction เพราะตารางนี้คือกลไกของโหมดนั้น
          ส่วนโหมด Trivia, POST /api/game/guess ตอบแค่ถูก/ผิด ไม่ส่งผลเปรียบเทียบมาด้วย
          (ยิ่งส่งคุณลักษณะของตัวละครลับออกไปน้อย ยิ่งย้อนหาคำตอบยาก) */}
      {gameMode === 'deduction' && <GuessHistoryTable history={guessHistory} />}

      {/* Modal เฉลยประจำด่าน (เฉพาะโหมด Trivia) */}
      {gameMode === 'trivia' && (
        <RoundSummaryModal
          isOpen={gameState === 'ROUND_SUMMARY'}
          isCorrect={isRoundSolved}
          character={revealedCharacter}
          score={lastRoundScore}
          currentRound={currentRound}
          totalRounds={totalRounds}
          onNextRound={nextRound}
        />
      )}
    </div>
  );
}

