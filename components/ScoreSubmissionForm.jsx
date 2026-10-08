'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function ScoreSubmissionForm({
  gameMode,
  score,
  timeSpentSeconds,
  guessesCount,
  correctCount,
  firstClueWins,
}) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/scoreboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gameMode,
          score,
          timeSpentSeconds,
          guessesCount,
          correctCount,
          firstClueWins,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'บันทึกคะแนนไม่สำเร็จ');
      }

      setStatus('saved');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง');
      setStatus('error');
    }
  }

  if (status === 'saved') {
    return (
      <div className="space-y-3" role="status">
        <Badge tone="success">บันทึกคะแนนแล้ว</Badge>
        <p className="text-sm text-muted-300">คะแนนของคุณถูกส่งขึ้นกระดานผู้นำเรียบร้อย</p>
        <Button href="/scoreboard" size="sm">ดูอันดับของคุณ</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="score-player-name" className="block text-xs font-medium text-muted-300">
        ชื่อที่แสดงบนกระดานผู้นำ
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="score-player-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={24}
          autoComplete="nickname"
          required
          className="min-w-0 flex-1 rounded-xl border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-white placeholder:text-muted-600"
          placeholder="ชื่อเล่น (2–24 ตัวอักษร)"
        />
        <Button type="submit" size="sm" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'กำลังบันทึก…' : 'บันทึกคะแนน'}
        </Button>
      </div>
      {status === 'error' && (
        <p className="text-sm text-danger-400" role="alert">{errorMessage}</p>
      )}
      <p className="text-[11px] text-muted-500">
        ส่งคะแนน {score.toLocaleString('th-TH')} แต้ม · ใช้ชื่อเล่นเท่านั้น ไม่ต้องระบุอีเมล
      </p>
    </form>
  );
}
