'use client';

/**
 * @file context/GameContext.jsx — สถานะเกมฝั่ง Client
 *
 * [กฎข้อเดียวที่ไฟล์นี้ยึดไว้: Client ต้องไม่รู้คำตอบก่อนเฉลย]
 *   เบราว์เซอร์คือสภาพแวดล้อมที่เราไม่เชื่อถือ (untrusted client)
 *   ทุกอย่างใน state ก้อนนี้ถูกเปิดอ่านได้จาก React DevTools ภายในสองคลิก
 *   เพราะฉะนั้นชื่อ/รหัส/รูปของตัวละครเป้าหมายจะ "ไม่มีอยู่ใน state นี้เลย"
 *   จนกว่า Server จะส่งมาให้ตอนเฉลย (ทายถูก / ยอมแพ้ / หมดเวลา)
 *
 * [สิ่งที่ Client ถือไว้แทนคำตอบ]
 *   token — ซองที่ Server เข้ารหัสด้วย AES-256-GCM (ดู lib/gameToken.js)
 *   ข้างในมีตัวละครเป้าหมายอยู่ แต่ Client ไม่มีกุญแจจึงอ่านไม่ออกและแก้ไม่ได้
 *   หน้าที่ของ Client เหลือแค่ "ถือซองไปยื่นให้ Server ทุกครั้งที่ขออะไร"
 *
 * [สิ่งที่ยังทำฝั่ง Client เหมือนเดิม]
 *   การคิดคะแนน, ตัวจับเวลา, ตาราง Emoji สำหรับแชร์ และรายชื่อตัวละครสำหรับ Autocomplete
 *   ทั้งหมดนี้ไม่ใช่ความลับ (รายชื่อตัวละคร 50 ตัวเป็นตัวเลือกที่ผู้เล่นต้องเห็นอยู่แล้ว)
 */

import { createContext, useContext, useState, useCallback } from 'react';
import {
  calculateRoundScore,
  calculateDeductionScore,
  generateShareableGrid,
} from '@/lib/gameLogic';
import { useSound } from '@/hooks/useSound';
import { recordCompletedSession } from '@/lib/gameSessions';

const GameContext = createContext(null);

/** เวลาต่อด่านในโหมด Trivia (วินาที) */
const TRIVIA_ROUND_SECONDS = 30;

/** จำนวนระดับคำใบ้ */
const MAX_CLUE_LEVEL = 3;

/**
 * ยิง Route Handler ใต้ /api/game แล้วคืน JSON
 *
 * ทุก endpoint ฝั่ง Server ตอบ { error } มาพร้อม status 400/401 เสมอเมื่อมีปัญหา
 * จึงดึงข้อความนั้นมาโยนเป็น Error เพื่อให้ผู้เรียกจัดการที่เดียว
 */
async function postGame(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `${path} ตอบกลับสถานะ ${res.status}`);
  }

  return data;
}

export function GameProvider({ children, initialMode = 'deduction' }) {
  const [gameMode, setGameMode] = useState(initialMode); // 'deduction' | 'trivia'
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'LOADING' | 'PLAYING' | 'ROUND_SUMMARY' | 'GAME_OVER' | 'ERROR'
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);

  /**
   * ซองสถานะเกมของรอบปัจจุบัน — ถูกออกใหม่ทุกครั้งที่ปลดล็อกคำใบ้
   * (Server ต้องจำไว้ว่าปลดล็อกถึงระดับไหนแล้ว แต่ไม่อยากเก็บ state ไว้เอง)
   */
  const [token, setToken] = useState(null);

  /**
   * ซองของด่านถัดไป — Server ส่งมาให้ล่วงหน้าตอนรอบนี้จบ
   * แต่เราเพิ่งสลับมาใช้ตอนผู้เล่นกด "เข้าสู่ด่านถัดไป" จริง ๆ
   */
  const [nextToken, setNextToken] = useState(null);

  /**
   * ซองที่ใช้ขอรูปเงาเท่านั้น — ตั้งครั้งเดียวตอนเริ่มรอบแล้วไม่แตะอีก
   *
   * [ทำไมต้องแยกจาก token?] เพราะ URL ของ <img> ผูกกับสตริงของซอง
   * ถ้าใช้ token ที่ถูกออกใหม่ทุกครั้งที่กดขอคำใบ้ src จะเปลี่ยนไปด้วย
   * เบราว์เซอร์จะโหลดรูปใหม่ทั้งที่เป็นตัวละครเดิม = เงากระพริบทุกครั้งที่เปิดคำใบ้
   */
  const [silhouetteToken, setSilhouetteToken] = useState(null);

  /**
   * ตัวละครที่ "เฉลยแล้ว" — เป็น null ตลอดจนกว่ารอบจะจบ
   * นี่คือฟิลด์เดียวใน state ที่มีชื่อคำตอบ และมันจะว่างเสมอระหว่างที่ยังเล่นอยู่
   */
  const [revealedCharacter, setRevealedCharacter] = useState(null);

  /** คำใบ้ที่ปลดล็อกแล้วเท่านั้น (ช่องที่ยังล็อกจะเป็น undefined — ไม่มีข้อความให้แอบอ่าน) */
  const [currentClues, setCurrentClues] = useState([]);
  const [revealedClueLevel, setRevealedClueLevel] = useState(1);

  const [guessHistory, setGuessHistory] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [lastRoundScore, setLastRoundScore] = useState(0);
  const [roundHistory, setRoundHistory] = useState([]);
  const [isRoundSolved, setIsRoundSolved] = useState(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [shareableEmojiGrid, setShareableEmojiGrid] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { playCorrect, playWrong, playClue } = useSound();

  /** ล้างสถานะของ "รอบ" (ใช้ทั้งตอนเริ่มเกมใหม่และตอนขึ้นด่านถัดไป) */
  const resetRoundState = useCallback(() => {
    setIsRoundSolved(false);
    setGuessHistory([]);
    setRevealedClueLevel(1);
    setCurrentClues([]);
    setRevealedCharacter(null);
    setErrorMessage('');
  }, []);

  /**
   * ขอคำใบ้ระดับ 1 ของรอบที่กำลังจะเริ่ม แล้วเปลี่ยนสถานะเป็น PLAYING
   * รับ token เข้ามาเป็นพารามิเตอร์ ไม่อ่านจาก state เพื่อกันการอ่านค่าเก่า (stale closure)
   */
  const loadFirstClue = useCallback(async (roundToken) => {
    const data = await postGame('/api/game/clue', { token: roundToken, level: 1 });
    setCurrentClues([data.clue]);
    setRevealedClueLevel(data.revealedLevel);
    setToken(data.token);
    setGameState('PLAYING');
  }, []);

  /** เริ่มเกมโหมด Trivia (5 ด่าน จับเวลา 30 วิ) */
  const startTriviaGame = useCallback(async () => {
    setGameMode('trivia');
    setGameState('LOADING');
    resetRoundState();
    setCurrentRound(1);
    setTotalScore(0);
    setLastRoundScore(0);
    setRoundHistory([]);
    setTotalTimeSpent(0);
    setShareableEmojiGrid('');
    setNextToken(null);

    try {
      // Server เป็นคนสุ่มตัวละครทั้ง 5 ด่าน — Client ได้แค่ซองกับเลขด่าน
      const session = await postGame('/api/game/start', { mode: 'trivia' });
      setToken(session.token);
      setSilhouetteToken(session.token);
      setCurrentRound(session.round);
      setTotalRounds(session.totalRounds);
      await loadFirstClue(session.token);
    } catch (error) {
      console.error('[GameContext] startTriviaGame failed:', error);
      setErrorMessage(error.message);
      setGameState('ERROR');
    }
  }, [resetRoundState, loadFirstClue]);

  /** เริ่มเกมโหมด PokéGuesser Deduction (1 ตัวละครลับ ทายไม่จำกัดครั้ง ไม่จับเวลาบีบคั้น) */
  const startDeductionGame = useCallback(async () => {
    setGameMode('deduction');
    setGameState('LOADING');
    resetRoundState();
    setCurrentRound(1);
    setTotalScore(0);
    setLastRoundScore(0);
    setRoundHistory([]);
    setTotalTimeSpent(0);
    setShareableEmojiGrid('');
    setNextToken(null);

    try {
      const session = await postGame('/api/game/start', { mode: 'deduction' });
      setToken(session.token);
      setSilhouetteToken(session.token);
      setTotalRounds(session.totalRounds);
      setGameStartTime(Date.now());
      // โหมดนี้ไม่ใช้คำใบ้ AI จึงเข้าสู่สถานะเล่นได้ทันที
      setGameState('PLAYING');
    } catch (error) {
      console.error('[GameContext] startDeductionGame failed:', error);
      setErrorMessage(error.message);
      setGameState('ERROR');
    }
  }, [resetRoundState]);

  /** เริ่มเกมอัตโนมัติตาม mode ที่ส่งเข้ามา */
  const startGame = useCallback(async (mode = gameMode) => {
    if (mode === 'trivia') {
      await startTriviaGame();
    } else {
      await startDeductionGame();
    }
  }, [gameMode, startTriviaGame, startDeductionGame]);

  /** สลับโหมดการเล่น */
  const switchMode = useCallback(async (newMode) => {
    await startGame(newMode);
  }, [startGame]);

  /**
   * ขอเปิดคำใบ้ระดับถัดไป (1 -> 2 -> 3) ในโหมด Trivia
   *
   * [ต่างจากเดิมอย่างไร?] ของเดิมคำใบ้ทั้ง 3 ระดับถูกส่งมาพร้อมกันตั้งแต่เริ่มด่าน
   * แล้วแค่ "ไม่แสดง" 2 ระดับที่ยังล็อก — ซึ่งเปิด Network tab อ่านได้ทั้งหมด
   * ตอนนี้ข้อความคำใบ้ที่ยังล็อกอยู่ "ยังไม่เคยเดินทางมาถึงเบราว์เซอร์" เลย
   */
  const unlockNextClue = useCallback(async () => {
    if (gameState !== 'PLAYING' || !token || revealedClueLevel >= MAX_CLUE_LEVEL) return;

    const level = revealedClueLevel + 1;

    try {
      const data = await postGame('/api/game/clue', { token, level });

      setCurrentClues((prev) => {
        const next = [...prev];
        next[data.level - 1] = data.clue;
        return next;
      });
      setRevealedClueLevel(data.revealedLevel);
      setToken(data.token);
      playClue();
    } catch (error) {
      console.error('[GameContext] unlockNextClue failed:', error);
      setErrorMessage(error.message);
    }
  }, [gameState, token, revealedClueLevel, playClue]);

  /**
   * ส่งคำตอบ/การเดาชื่อตัวละคร
   *
   * Server เป็นคนตัดสินถูก/ผิด และเป็นคนคำนวณตารางเปรียบเทียบคุณลักษณะ
   * Client แค่ส่ง id ที่เดาไป แล้วเอาผลลัพธ์มาแสดง — ไม่มีการเทียบคำตอบฝั่งนี้อีกแล้ว
   */
  const submitGuess = useCallback(async (guessedCharacter, timeLeftSeconds = 0) => {
    if (!token || !guessedCharacter || isRoundSolved || gameState !== 'PLAYING') return;

    let result;
    try {
      result = await postGame('/api/game/guess', {
        token,
        guessId: guessedCharacter._id,
      });
    } catch (error) {
      console.error('[GameContext] submitGuess failed:', error);
      setErrorMessage(error.message);
      return;
    }

    const newGuessEntry = {
      character: guessedCharacter,
      comparison: result.comparison ?? null,
      guessedAt: new Date().toLocaleTimeString('th-TH'),
    };

    const updatedHistory = [newGuessEntry, ...guessHistory];
    setGuessHistory(updatedHistory);

    if (!result.correct) {
      playWrong();
      return;
    }

    playCorrect();
    setIsRoundSolved(true);
    setRevealedCharacter(result.character);
    setNextToken(result.nextToken ?? null);

    if (gameMode === 'deduction') {
      // กลไกโหมด PokéGuesser Deduction
      const elapsedSec = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
      const earnedScore = calculateDeductionScore(updatedHistory.length);
      const emojiGrid = generateShareableGrid(updatedHistory);

      setTotalScore(earnedScore);
      setLastRoundScore(earnedScore);
      setTotalTimeSpent(elapsedSec);
      setShareableEmojiGrid(emojiGrid);

      recordCompletedSession({
        gameMode: 'deduction',
        score: earnedScore,
        characterName: result.character.name,
        characterId: result.character._id,
        guessesCount: updatedHistory.length,
        timeSpentSeconds: elapsedSec,
        isCorrect: true,
      });

      setGameState('GAME_OVER');
      return;
    }

    // กลไกโหมด Trivia (5 ด่าน)
    const earnedScore = calculateRoundScore(
      revealedClueLevel,
      timeLeftSeconds,
      guessHistory.length
    );

    setLastRoundScore(earnedScore);
    setTotalScore((prev) => prev + earnedScore);
    setTotalTimeSpent((prev) => prev + (TRIVIA_ROUND_SECONDS - timeLeftSeconds));

    setRoundHistory((prev) => [
      ...prev,
      {
        round: currentRound,
        character: result.character,
        cluesUsed: revealedClueLevel,
        timeLeft: timeLeftSeconds,
        score: earnedScore,
        isCorrect: true,
        guessesCount: guessHistory.length + 1,
      },
    ]);

    setGameState('ROUND_SUMMARY');
  }, [
    token,
    isRoundSolved,
    gameState,
    guessHistory,
    gameMode,
    playCorrect,
    playWrong,
    gameStartTime,
    revealedClueLevel,
    currentRound,
  ]);

  /** ยอมแพ้เฉลยในโหมด Deduction */
  const giveUpDeduction = useCallback(async () => {
    if (gameState !== 'PLAYING' || !token) return;

    let result;
    try {
      // จุดเดียวที่คำตอบถูกปล่อยออกมาโดยไม่ต้องทายถูก
      result = await postGame('/api/game/reveal', { token });
    } catch (error) {
      console.error('[GameContext] giveUpDeduction failed:', error);
      setErrorMessage(error.message);
      return;
    }

    playWrong();
    setIsRoundSolved(false);
    setRevealedCharacter(result.character);

    const elapsedSec = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
    setTotalScore(0);
    setTotalTimeSpent(elapsedSec);
    setGameState('GAME_OVER');

    recordCompletedSession({
      gameMode: 'deduction',
      score: 0,
      characterName: result.character.name,
      characterId: result.character._id,
      guessesCount: guessHistory.length,
      timeSpentSeconds: elapsedSec,
      isCorrect: false,
    });
  }, [gameState, token, playWrong, gameStartTime, guessHistory.length]);

  /** กรณีเวลาหมด หรือข้ามด่านในโหมด Trivia */
  const endRoundByTimeout = useCallback(async () => {
    if (isRoundSolved || gameState !== 'PLAYING' || !token) return;

    let result;
    try {
      result = await postGame('/api/game/reveal', { token });
    } catch (error) {
      console.error('[GameContext] endRoundByTimeout failed:', error);
      setErrorMessage(error.message);
      return;
    }

    playWrong();
    setIsRoundSolved(false);
    setRevealedCharacter(result.character);
    setNextToken(result.nextToken ?? null);
    setLastRoundScore(0);
    setTotalTimeSpent((prev) => prev + TRIVIA_ROUND_SECONDS);

    setRoundHistory((prev) => [
      ...prev,
      {
        round: currentRound,
        character: result.character,
        cluesUsed: revealedClueLevel,
        timeLeft: 0,
        score: 0,
        isCorrect: false,
        guessesCount: guessHistory.length,
      },
    ]);

    setGameState('ROUND_SUMMARY');
  }, [
    isRoundSolved,
    gameState,
    token,
    playWrong,
    currentRound,
    revealedClueLevel,
    guessHistory.length,
  ]);

  /** ไปยังด่านถัดไป หรือจบเกมในโหมด Trivia */
  const nextRound = useCallback(async () => {
    if (currentRound < totalRounds && nextToken) {
      setGameState('LOADING');
      resetRoundState();
      setCurrentRound(currentRound + 1);

      // สลับมาใช้ซองของด่านถัดไป (รูปเงาจึงเปลี่ยนเป็นตัวละครใหม่ตอนนี้ ไม่ใช่ตอนรอบก่อนจบ)
      setToken(nextToken);
      setSilhouetteToken(nextToken);
      setNextToken(null);

      try {
        await loadFirstClue(nextToken);
      } catch (error) {
        console.error('[GameContext] nextRound failed:', error);
        setErrorMessage(error.message);
        setGameState('ERROR');
      }
      return;
    }

    setGameState('GAME_OVER');

    const correctRounds = roundHistory.filter((round) => round.isCorrect);
    recordCompletedSession({
      gameMode: 'trivia',
      score: totalScore,
      correctCount: correctRounds.length,
      firstClueWins: correctRounds.filter((round) => round.cluesUsed === 1).length,
      roundsPlayed: roundHistory.length,
      timeSpentSeconds: totalTimeSpent,
      isCorrect: correctRounds.length > 0,
    });
  }, [
    currentRound,
    totalRounds,
    nextToken,
    resetRoundState,
    loadFirstClue,
    roundHistory,
    totalScore,
    totalTimeSpent,
  ]);

  /** เริ่มใหม่อีกครั้ง */
  const restartGame = useCallback(async () => {
    await startGame(gameMode);
  }, [startGame, gameMode]);

  /**
   * URL ของรูปเงา — ชี้ไปที่ Route Handler ของเราเอง ไม่ใช่ URL จริงของรูป
   * ผู้เล่นเปิด Elements tab จะเห็นแค่ซองที่อ่านไม่ออกใน query string
   */
  const silhouetteUrl = silhouetteToken
    ? `/api/game/silhouette?token=${encodeURIComponent(silhouetteToken)}`
    : null;

  const value = {
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
    startDeductionGame,
    startTriviaGame,
    unlockNextClue,
    submitGuess,
    giveUpDeduction,
    endRoundByTimeout,
    nextRound,
    restartGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Custom Hook สำหรับใช้งาน GameContext
 * [Day 5 Standard]: มี Guard Clause ป้องกันการเรียกใช้นอก GameProvider
 */
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
