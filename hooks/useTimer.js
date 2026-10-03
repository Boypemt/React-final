'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook สำหรับนับเวลาถอยหลัง (Timer Engine)
 * [Day 3 Standard]: มี Cleanup function ใน useEffect เพื่อเคลียร์ setInterval ป้องกัน Memory Leak
 * 
 * @param {number} initialSeconds - เวลาเริ่มต้น (วินาที)
 * @param {Function} [onTimeUp] - Callback เมื่อเวลาหมด
 */
export function useTimer(initialSeconds = 30, onTimeUp) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);

  // เก็บ reference ล่าสุดของ onTimeUp callback
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // จัดการการเดินเวลาด้วย setInterval
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          if (onTimeUpRef.current) {
            onTimeUpRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ★ CRITICAL: Cleanup function เคลียร์ timer เสมอเมื่อ component unmount หรือ pause
    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newSeconds = initialSeconds) => {
    setIsRunning(false);
    setTimeLeft(newSeconds);
  }, [initialSeconds]);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset
  };
}
