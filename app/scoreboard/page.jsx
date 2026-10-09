import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import ScoreboardEntries from '@/components/ScoreboardEntries';

export const metadata = {
  title: 'กระดานผู้นำ — Disney Guesser',
  description: 'ดูอันดับคะแนนสูงสุดของผู้เล่น Disney Character Clue Guesser',
};
const MODES = [
  { value: 'all', label: 'ทุกโหมด' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'trivia', label: 'Trivia' },
];
const PERIODS = [
  { value: 'all', label: 'ตลอดกาล' },
  { value: 'week', label: '7 วัน' },
  { value: 'month', label: '30 วัน' },
];

function filterHref(mode, period) {
  const query = new URLSearchParams();
  if (mode !== 'all') query.set('mode', mode);
  if (period !== 'all') query.set('period', period);
  const search = query.toString();
  return search ? `/scoreboard?${search}` : '/scoreboard';
}

export default async function ScoreboardPage({ searchParams }) {
  const params = await searchParams;
  const mode = ['deduction', 'trivia'].includes(params?.mode) ? params.mode : 'all';
  const period = ['week', 'month'].includes(params?.period) ? params.period : 'all';

  return (
    <main className="flex-1 pb-12">
      <PageHeader
        icon="🏆"
        title="กระดานผู้นำ"
        description="จัดอันดับคะแนนสูงสุด แยกตามโหมดและช่วงเวลาที่เล่น"
      >
        <Button href="/play" size="sm">🎮 เล่นต่อ</Button>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-5 px-4">
        <Card title="ตัวกรองอันดับ" subtitle="เลือกโหมดและช่วงเวลาที่ต้องการดู">
          <div className="flex flex-wrap gap-5">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-400">โหมด</p>
              <div className="flex flex-wrap gap-2">
                {MODES.map((option) => (
                  <Link key={option.value} href={filterHref(option.value, period)} aria-current={mode === option.value ? 'page' : undefined}>
                    <Badge tone={mode === option.value ? 'brand' : 'neutral'}>{option.label}</Badge>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-400">ช่วงเวลา</p>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((option) => (
                  <Link key={option.value} href={filterHref(mode, option.value)} aria-current={period === option.value ? 'page' : undefined}>
                    <Badge tone={period === option.value ? 'brand' : 'neutral'}>{option.label}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <ScoreboardEntries mode={mode} period={period} />
      </div>
    </main>
  );
}
