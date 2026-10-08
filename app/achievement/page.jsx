'use client';

import { useEffect, useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { getAchievements } from '@/lib/achievements';
import { readGameHistory } from '@/lib/gameSessions';

const FILTERS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'easy', label: 'ง่าย' },
  { value: 'hard', label: 'ยาก' },
  { value: 'unlocked', label: 'ปลดล็อกแล้ว' },
  { value: 'locked', label: 'ยังไม่ปลดล็อก' },
];

export default function AchievementPage() {
  const [achievements, setAchievements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [historyCount, setHistoryCount] = useState(0);
  const [readError, setReadError] = useState(false);

  useEffect(() => {
    try {
      const sessions = readGameHistory();
      setHistoryCount(sessions.length);
      setAchievements(getAchievements(sessions));
    } catch (error) {
      console.error('Unable to read saved game history.', error);
      setReadError(true);
    }
  }, []);

  const unlockedCount = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked).length,
    [achievements]
  );
  const visibleAchievements = achievements.filter((achievement) => {
    if (filter === 'easy' || filter === 'hard') return achievement.difficulty === filter;
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  return (
    <main className="flex-1 pb-12">
      <PageHeader
        icon="🏅"
        title="เหรียญรางวัล"
        description="สะสมความสำเร็จจากการเล่นทั้งโหมด Deduction และ Trivia"
      >
        <Button href="/play" size="sm">🎮 เล่นต่อ</Button>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-5 px-4">
        <Card highlight className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">ความสำเร็จของคุณ</p>
            <p className="mt-1 text-sm text-muted-400">
              ปลดล็อกแล้ว {unlockedCount} จาก {achievements.length} เหรียญ · บันทึกเกม {historyCount} ครั้ง
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone="success">🏅 {unlockedCount} ปลดล็อก</Badge>
            <Badge tone="warning">🔒 {achievements.length - unlockedCount} รอรับ</Badge>
          </div>
        </Card>

        {readError && (
          <Card className="border-danger-500/40" role="alert">
            <p className="font-semibold text-danger-400">อ่านประวัติการเล่นไม่ได้</p>
            <p className="mt-1 text-sm text-muted-400">
              ข้อมูลในเบราว์เซอร์อาจเสียหาย ลองเริ่มเกมใหม่เพื่อสร้างประวัติความสำเร็จอีกครั้ง
            </p>
          </Card>
        )}

        <div className="flex flex-wrap gap-2" aria-label="กรองเหรียญรางวัล">
          {FILTERS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={filter === option.value ? 'primary' : 'ghost'}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <section aria-label="รายการความสำเร็จ" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAchievements.map((achievement) => (
            <Card
              key={achievement.id}
              highlight={achievement.unlocked}
              className={achievement.unlocked ? '' : 'opacity-80'}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                    achievement.unlocked ? 'bg-warning-500/15' : 'bg-surface-800 grayscale'
                  }`}
                  aria-hidden="true"
                >
                  {achievement.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-white">{achievement.title}</h2>
                    <Badge tone={achievement.difficulty === 'easy' ? 'success' : 'warning'} size="sm">
                      {achievement.difficulty === 'easy' ? 'ง่าย' : 'ยาก'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-400">{achievement.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className={achievement.unlocked ? 'font-semibold text-success-400' : 'text-muted-500'}>
                    {achievement.unlocked ? 'ปลดล็อกแล้ว' : 'ความคืบหน้า'}
                  </span>
                  <span className="text-muted-400">
                    {achievement.progress.toLocaleString('th-TH')} / {achievement.goal.toLocaleString('th-TH')}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-pill bg-surface-800"
                  role="progressbar"
                  aria-label={`ความคืบหน้า ${achievement.title}`}
                  aria-valuemin={0}
                  aria-valuemax={achievement.goal}
                  aria-valuenow={achievement.progress}
                >
                  <div
                    className={`h-full rounded-pill transition-all ${
                      achievement.unlocked ? 'bg-success-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${(achievement.progress / achievement.goal) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {visibleAchievements.length === 0 && (
          <Card className="py-8 text-center text-sm text-muted-400">
            ไม่มีเหรียญรางวัลในหมวดนี้
          </Card>
        )}
        <p className="text-center text-xs text-muted-500">
          ประวัติและเหรียญรางวัลเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น
        </p>
      </div>
    </main>
  );
}
