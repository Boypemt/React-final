'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { scoreSchema } from '@/lib/scoreSchema';
import { submitScore } from '@/app/scoreboard/actions';

/**
 * ScoreSubmissionForm — ฟอร์มบันทึกคะแนนขึ้นกระดานผู้นำ
 * กลุ่ม Sigma · Disney Character Clue Guesser
 *
 * [ทำไมต้องเป็น Client Component?]
 *   ฟอร์มที่ผู้ใช้พิมพ์ต้องมี state และ event handler ซึ่งทำฝั่ง Server ไม่ได้:
 *     - useForm ของ react-hook-form จัดการค่าในช่องกรอกและสถานะ validation
 *     - zodResolver ตรวจข้อมูลทันทีที่พิมพ์/กดส่ง เพื่อขึ้น error ใต้ช่องกรอก
 *       โดยไม่ต้องรอ round-trip ไป Server
 *   ส่วนการ "บันทึกจริง" ส่งต่อให้ Server Action `submitScore()` ทำฝั่ง Server
 *
 * [การตรวจ 2 ชั้นด้วย schema ก้อนเดียวกัน]
 *   ชั้นที่ 1 (ที่นี่)  : zodResolver(scoreSchema) — เพื่อ UX ที่ดี ตอบสนองทันที
 *   ชั้นที่ 2 (Server) : submitScore() ตรวจด้วย scoreSchema อีกครั้ง — เพื่อความปลอดภัย
 *   ทั้งสองชั้นใช้ไฟล์ lib/scoreSchema.js ร่วมกัน กฎจึงตรงกันเสมอ
 *
 * Props เหมือนเดิมทุกตัว — components/game/GameOverScreen.jsx ไม่ต้องแก้อะไร
 */
export default function ScoreSubmissionForm({
  gameMode,
  score,
  timeSpentSeconds,
  guessesCount,
  correctCount,
  firstClueWins,
}) {
  const [savedState, setSavedState] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(scoreSchema),
    // ค่าที่ไม่ได้ให้ผู้ใช้กรอกถูกใส่เป็น defaultValues เพื่อให้ schema
    // ตรวจทั้ง object ได้ครบตั้งแต่ฝั่ง Client (ไม่ใช่ตรวจแค่ชื่อ)
    defaultValues: {
      name: '',
      gameMode,
      score,
      timeSpentSeconds,
      guessesCount,
      correctCount,
      firstClueWins,
    },
  });

  async function onSubmit(values) {
    const result = await submitScore(values);

    if (!result.ok) {
      // นำ error จากฝั่ง Server มาแสดงในฟอร์มด้วย
      // (ปกติไม่ควรเกิด เพราะฝั่ง Client ตรวจผ่านแล้ว แต่ถ้าเกิดก็ต้องบอกผู้ใช้)
      for (const [field, message] of Object.entries(result.errors ?? {})) {
        setError(field === 'form' ? 'root.serverError' : field, { type: 'server', message });
      }
      return;
    }

    setSavedState({ persisted: result.persisted });
  }

  if (savedState) {
    return (
      <div className="space-y-3" role="status">
        <Badge tone="success">บันทึกคะแนนแล้ว</Badge>
        <p className="text-sm text-muted-300">
          {savedState.persisted
            ? 'บันทึกคะแนนขึ้นกระดานผู้นำเรียบร้อย ผู้เล่นคนอื่นเห็นคะแนนนี้ด้วย'
            : 'บันทึกคะแนนแล้ว (เซิร์ฟเวอร์เก็บไว้ในหน่วยความจำชั่วคราว)'}
        </p>
        <Button href="/scoreboard" size="sm">ดูอันดับของคุณ</Button>
      </div>
    );
  }

  const serverError = errors.root?.serverError?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <label htmlFor="score-player-name" className="block text-xs font-medium text-muted-300">
        ชื่อที่แสดงบนกระดานผู้นำ
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="score-player-name"
          autoComplete="nickname"
          // aria-invalid + aria-describedby ทำให้ screen reader อ่าน error ให้ผู้ใช้
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? 'score-player-name-error' : undefined}
          className="min-w-0 flex-1 rounded-xl border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-white placeholder:text-muted-600"
          placeholder="ชื่อเล่น (2–24 ตัวอักษร)"
          {...register('name')}
        />
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังบันทึก…' : 'บันทึกคะแนน'}
        </Button>
      </div>

      {/* ข้อความ error ใต้ช่องกรอก มาจาก scoreSchema ตรง ๆ */}
      {errors.name && (
        <p id="score-player-name-error" className="text-sm text-danger-400" role="alert">
          {errors.name.message}
        </p>
      )}

      {/* error ของฟิลด์ที่ผู้ใช้ไม่ได้กรอกเอง (คะแนน/เวลา/โหมด) ถ้าข้อมูลจากเกมผิดรูป */}
      {['gameMode', 'score', 'timeSpentSeconds', 'guessesCount', 'correctCount', 'firstClueWins']
        .filter((field) => errors[field])
        .map((field) => (
          <p key={field} className="text-sm text-danger-400" role="alert">
            {errors[field].message}
          </p>
        ))}

      {serverError && (
        <p className="text-sm text-danger-400" role="alert">{serverError}</p>
      )}

      <p className="text-[11px] text-muted-500">
        ส่งคะแนน {score.toLocaleString('th-TH')} แต้ม · ใช้ชื่อเล่นเท่านั้น ไม่ต้องระบุอีเมล
      </p>
    </form>
  );
}
