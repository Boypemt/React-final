import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { saveScoreEntry } from '@/lib/scoreboardStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SCORE = 1000000;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'ส่งข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const { gameMode, score, timeSpentSeconds, guessesCount, correctCount, firstClueWins } = body || {};

  if (name.length < 2 || name.length > 24) {
    return NextResponse.json({ error: 'ชื่อผู้เล่นต้องมีความยาว 2–24 ตัวอักษร' }, { status: 400 });
  }
  if (!['deduction', 'trivia'].includes(gameMode)) {
    return NextResponse.json({ error: 'โหมดเกมไม่ถูกต้อง' }, { status: 400 });
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return NextResponse.json({ error: 'คะแนนไม่ถูกต้อง' }, { status: 400 });
  }
  if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 || timeSpentSeconds > 86400) {
    return NextResponse.json({ error: 'เวลาเล่นไม่ถูกต้อง' }, { status: 400 });
  }
  if (guessesCount !== undefined && (!Number.isInteger(guessesCount) || guessesCount < 0 || guessesCount > 1000)) {
    return NextResponse.json({ error: 'จำนวนครั้งที่ทายไม่ถูกต้อง' }, { status: 400 });
  }
  if (correctCount !== undefined && (!Number.isInteger(correctCount) || correctCount < 0 || correctCount > 5)) {
    return NextResponse.json({ error: 'จำนวนคำตอบที่ถูกไม่ถูกต้อง' }, { status: 400 });
  }
  if (firstClueWins !== undefined && (!Number.isInteger(firstClueWins) || firstClueWins < 0 || firstClueWins > 5)) {
    return NextResponse.json({ error: 'จำนวนคำตอบจากคำใบ้แรกไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    const savedEntry = await saveScoreEntry({
      name,
      gameMode,
      score,
      timeSpentSeconds,
      ...(guessesCount !== undefined && { guessesCount }),
      ...(correctCount !== undefined && { correctCount }),
      ...(firstClueWins !== undefined && { firstClueWins }),
    });
    revalidatePath('/scoreboard');
    return NextResponse.json({ entry: savedEntry }, { status: 201 });
  } catch (error) {
    console.error('Unable to save scoreboard entry.', error);
    return NextResponse.json({ error: 'บันทึกคะแนนไม่สำเร็จ กรุณาลองอีกครั้ง' }, { status: 500 });
  }
}
