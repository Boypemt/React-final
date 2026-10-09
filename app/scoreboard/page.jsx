import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { getScoreboardEntries } from '@/lib/scoreboardStore';

export const metadata = {
  title: 'กระดานผู้นำ — Disney Guesser',
  description: 'ดูอันดับคะแนนสูงสุดของผู้เล่น Disney Character Clue Guesser',
};
export const dynamic = 'force-dynamic';

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
  const entries = await getScoreboardEntries({ mode, period });

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

        <Card
          title="อันดับคะแนน"
          subtitle={`${entries.length} รายการ${entries.length === 100 ? ' · แสดงสูงสุด 100 อันดับ' : ''}`}
          padding="none"
        >
          {entries.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-4xl" aria-hidden="true">🎯</p>
              <h2 className="mt-3 font-bold text-white">ยังไม่มีคะแนนในตัวกรองนี้</h2>
              <p className="mt-1 text-sm text-muted-400">จบเกมแล้วส่งคะแนนขึ้นมาเป็นคนแรกได้เลย</p>
              <div className="mt-4"><Button href="/play">เริ่มเล่นเกม</Button></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-y border-surface-700/70 bg-surface-800/70 text-xs text-muted-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">อันดับ</th>
                    <th scope="col" className="px-4 py-3">ผู้เล่น</th>
                    <th scope="col" className="px-4 py-3">โหมด</th>
                    <th scope="col" className="px-4 py-3 text-right">คะแนน</th>
                    <th scope="col" className="px-4 py-3 text-right">เวลา</th>
                    <th scope="col" className="px-4 py-3 text-right">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/50">
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="text-muted-300 hover:bg-surface-800/40">
                      <td className="px-4 py-3 font-bold text-warning-300">
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{entry.name}</td>
                      <td className="px-4 py-3">
                        <Badge tone={entry.gameMode === 'deduction' ? 'accent' : 'brand'} size="sm">
                          {entry.gameMode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-warning-300">
                        {entry.score.toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-3 text-right">{entry.timeSpentSeconds.toLocaleString('th-TH')} วิ</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-400">
                        {new Date(entry.submittedAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
