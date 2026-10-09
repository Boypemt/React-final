'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import curatedCharacters from '@/lib/data/curated-disney.json';
import { getCharacterClues } from '@/lib/clues';
import {
  getRandomCharacters,
  compareAttributes,
  calculateRoundScore,
  calculateDeductionScore,
  generateShareableGrid,
  validateAnswer
} from '@/lib/gameLogic';
import { useSound } from '@/hooks/useSound';
import { recordCompletedSession } from '@/lib/gameSessions';

const GameContext = createContext(null);

export function GameProvider({ children, initialMode = 'deduction' }) {
  const [gameMode, setGameMode] = useState(initialMode); // 'deduction' | 'trivia'
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE' | 'LOADING' | 'PLAYING' | 'ROUND_SUMMARY' | 'GAME_OVER'
  const [currentRound, setCurrentRound] = useState(1);
  const [sessionCharacters, setSessionCharacters] = useState([]);
  const [currentCharacter, setCurrentCharacter] = useState(null);
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

  const { playCorrect, playWrong, playClue } = useSound();

  // โหลดด่านสำหรับโหมด Trivia
  const loadTriviaRound = useCallback(async (roundIndex, characterList) => {
    const target = characterList[roundIndex - 1];
    if (!target) return;

    setGameState('LOADING');
    setIsRoundSolved(false);
    setGuessHistory([]);
    setRevealedClueLevel(1);
    setCurrentCharacter(target);

    // ดึงคำใบ้ AI หรือ Mock
    const clues = await getCharacterClues(target._id, target.name);
    setCurrentClues(clues);
    setGameState('PLAYING');
  }, []);

  // เริ่มเกมโหมด Trivia (5 ด่าน จับเวลา 30 วิ)
  const startTriviaGame = useCallback(async () => {
    const selected = getRandomCharacters(curatedCharacters, 5);
    setGameMode('trivia');
    setSessionCharacters(selected);
    setCurrentRound(1);
    setTotalScore(0);
    setRoundHistory([]);
    setTotalTimeSpent(0);
    setShareableEmojiGrid('');
    await loadTriviaRound(1, selected);
  }, [loadTriviaRound]);

  // เริ่มเกมโหมด PokéGuesser Deduction (1 ตัวละครลับ ทายไม่จำกัดครั้ง ไม่จับเวลาบีบคั้น)
  const startDeductionGame = useCallback(() => {
    const randomOne = getRandomCharacters(curatedCharacters, 1)[0] || curatedCharacters[0];
    setGameMode('deduction');
    setCurrentCharacter(randomOne);
    setGameState('PLAYING');
    setIsRoundSolved(false);
    setGuessHistory([]);
    setTotalScore(0);
    setLastRoundScore(0);
    setTotalTimeSpent(0);
    setGameStartTime(Date.now());
    setShareableEmojiGrid('');
    setCurrentClues([]);
  }, []);

  // สลับโหมดการเล่น
  const switchMode = useCallback(async (newMode) => {
    if (newMode === 'trivia') {
      await startTriviaGame();
    } else {
      startDeductionGame();
    }
  }, [startTriviaGame, startDeductionGame]);

  // เริ่มเกมอัตโนมัติตาม mode ที่ส่งเข้ามา
  const startGame = useCallback(async (mode = gameMode) => {
    if (mode === 'trivia') {
      await startTriviaGame();
    } else {
      startDeductionGame();
    }
  }, [gameMode, startTriviaGame, startDeductionGame]);

  // ขอเปิดคำใบ้ระดับถัดไป (1 -> 2 -> 3) ในโหมด Trivia
  const unlockNextClue = useCallback(() => {
    setRevealedClueLevel(prev => {
      if (prev < 3) {
        playClue();
        return prev + 1;
      }
      return prev;
    });
  }, [playClue]);

  // ส่งคำตอบ/การเดาชื่อตัวละคร
  const submitGuess = useCallback((guessedCharacter, timeLeftSeconds = 0) => {
    if (!currentCharacter || isRoundSolved || gameState !== 'PLAYING') return;

    const isMatch = validateAnswer(guessedCharacter.name, currentCharacter.name);
    const comparison = compareAttributes(guessedCharacter, currentCharacter);

    const newGuessEntry = {
      character: guessedCharacter,
      comparison,
      guessedAt: new Date().toLocaleTimeString('th-TH')
    };

    const updatedHistory = [newGuessEntry, ...guessHistory];
    setGuessHistory(updatedHistory);

    if (gameMode === 'deduction') {
      // กลไกโหมด PokéGuesser Deduction
      if (isMatch) {
        playCorrect();
        setIsRoundSolved(true);
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
          characterName: currentCharacter.name,
          characterId: currentCharacter._id,
          guessesCount: updatedHistory.length,
          timeSpentSeconds: elapsedSec,
          isCorrect: true,
        });

        setGameState('GAME_OVER');
      } else {
        playWrong();
      }
    } else {
      // กลไกโหมด Trivia (5 ด่าน)
      if (isMatch) {
        playCorrect();
        setIsRoundSolved(true);

        const earnedScore = calculateRoundScore(
          revealedClueLevel,
          timeLeftSeconds,
          guessHistory.length
        );

        setLastRoundScore(earnedScore);
        setTotalScore(prev => prev + earnedScore);
        setTotalTimeSpent(prev => prev + (30 - timeLeftSeconds));

        setRoundHistory(prev => [
          ...prev,
          {
            round: currentRound,
            character: currentCharacter,
            cluesUsed: revealedClueLevel,
            timeLeft: timeLeftSeconds,
            score: earnedScore,
            isCorrect: true,
            guessesCount: guessHistory.length + 1
          }
        ]);

        setGameState('ROUND_SUMMARY');
      } else {
        playWrong();
      }
    }
  }, [currentCharacter, isRoundSolved, gameState, guessHistory, gameMode, playCorrect, gameStartTime, playWrong, revealedClueLevel, currentRound]);

  // ยอมแพ้เฉลยในโหมด Deduction
  const giveUpDeduction = useCallback(() => {
    if (gameState !== 'PLAYING' || !currentCharacter) return;

    playWrong();
    setIsRoundSolved(false);
    const elapsedSec = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 0;
    setTotalScore(0);
    setTotalTimeSpent(elapsedSec);
    setGameState('GAME_OVER');

    recordCompletedSession({
      gameMode: 'deduction',
      score: 0,
      characterName: currentCharacter.name,
      characterId: currentCharacter._id,
      guessesCount: guessHistory.length,
      timeSpentSeconds: elapsedSec,
      isCorrect: false,
    });
  }, [gameState, currentCharacter, playWrong, gameStartTime, guessHistory.length]);

  // กรณีเวลาหมด หรือข้ามด่านในโหมด Trivia
  const endRoundByTimeout = useCallback(() => {
    if (isRoundSolved || gameState !== 'PLAYING') return;

    playWrong();
    setIsRoundSolved(false);
    setLastRoundScore(0);
    setTotalTimeSpent(prev => prev + 30);

    setRoundHistory(prev => [
      ...prev,
      {
        round: currentRound,
        character: currentCharacter,
        cluesUsed: revealedClueLevel,
        timeLeft: 0,
        score: 0,
        isCorrect: false,
        guessesCount: guessHistory.length
      }
    ]);

    setGameState('ROUND_SUMMARY');
  }, [isRoundSolved, gameState, playWrong, currentRound, currentCharacter, revealedClueLevel, guessHistory.length]);

  // ไปยังด่านถัดไป หรือจบเกมในโหมด Trivia
  const nextRound = useCallback(async () => {
    if (currentRound < 5) {
      const nextR = currentRound + 1;
      setCurrentRound(nextR);
      await loadTriviaRound(nextR, sessionCharacters);
    } else {
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
    }
  }, [currentRound, loadTriviaRound, sessionCharacters, roundHistory, totalScore, totalTimeSpent]);

  // เริ่มใหม่อีกครั้ง
  const restartGame = useCallback(async () => {
    await startGame(gameMode);
  }, [startGame, gameMode]);

  const value = {
    gameMode,
    gameState,
    currentRound,
    sessionCharacters,
    currentCharacter,
    currentClues,
    revealedClueLevel,
    guessHistory,
    totalScore,
    lastRoundScore,
    roundHistory,
    isRoundSolved,
    totalTimeSpent,
    shareableEmojiGrid,
    switchMode,
    startGame,
    startDeductionGame,
    startTriviaGame,
    unlockNextClue,
    submitGuess,
    giveUpDeduction,
    endRoundByTimeout,
    nextRound,
    restartGame
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
