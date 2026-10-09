'use client';

import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getScoreboardEntries } from '@/lib/scoreboardStorage';

export default function ScoreboardEntries({ mode, period }) {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    function refreshEntries() {
      try {
        setEntries(getScoreboardEntries({ mode, period }));
        setErrorMessage('');
        setStatus('ready');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'อ่านคะแนนจากเบราว์เซอร์ไม่สำเร็จ');
        setStatus('error');
      }
    }

    refreshEntries();
    window.addEventListener('storage', refreshEntries);
    return () => window.removeEventListener('storage', refreshEntries);
  }, [mode, period]);

  return (
    <Card
      title="อันดับคะแนน"
      subtitle={status === 'ready'
        ? `${entries.length} รายการ${entries.length === 100 ? ' · แสดงสูงสุด 100 อันดับ' : ''}`
        : 'คะแนนที่บันทึกไว้ในเบราว์เซอร์นี้'}
      padding="none"
    >
      {status === 'loading' ? (
        <p className="px-5 py-12 text-center text-sm text-muted-400" role="status">
          กำลังอ่านคะแนน…
        </p>
      ) : status === 'error' ? (
        <p className="px-5 py-12 text-center text-sm text-danger-400" role="alert">
          {errorMessage}
        </p>
      ) : entries.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-4xl" aria-hidden="true">🎯</p>
          <h2 className="mt-3 font-bold text-white">ยังไม่มีคะแนนในตัวกรองนี้</h2>
          <p className="mt-1 text-sm text-muted-400">จบเกมแล้วบันทึกคะแนนไว้ในเบราว์เซอร์นี้ได้เลย</p>
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
  );
}
