import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * ScoreboardTable — ตารางอันดับคะแนน
 * กลุ่ม Sigma · Disney Character Clue Guesser
 *
 * [ทำไมเป็น Server Component?]
 *   ไฟล์นี้ไม่มี 'use client' เพราะเป็นแค่การแสดงผลข้อมูลที่หน้า /scoreboard
 *   อ่านมาจากคลังฝั่ง Server (lib/scoreboardStore.js) ให้แล้ว
 *     1. ไม่มี state ไม่มี event = ไม่ต้องส่ง JavaScript ไปรันที่เบราว์เซอร์
 *     2. HTML มาพร้อมข้อมูลตั้งแต่ไบต์แรก ไม่มีจังหวะ "กำลังโหลด…" ให้เห็น
 *     3. ตัวเลขอันดับคำนวณฝั่ง Server จึงตรงกันทุกคนที่เปิดดู
 *
 *   เวอร์ชันก่อนหน้าเป็น Client Component ที่อ่าน localStorage ทำให้ผู้เล่น
 *   เห็นแต่คะแนนของตัวเองในเครื่องตัวเอง ไม่ใช่กระดานผู้นำที่แชร์กันจริง
 */
export default function ScoreboardTable({ entries = [], persistedToDisk = true }) {
  return (
    <Card
      title="อันดับคะแนน"
      subtitle={`${entries.length} รายการ${entries.length === 100 ? ' · แสดงสูงสุด 100 อันดับ' : ''}`}
      padding="none"
    >
      {!persistedToDisk && (
        <p className="border-b border-warning-500/30 bg-warning-500/10 px-4 py-2 text-xs text-warning-300">
          ⚠️ เซิร์ฟเวอร์เขียนไฟล์ไม่ได้ จึงเก็บคะแนนไว้ในหน่วยความจำชั่วคราว
          (ข้อมูลจะหายเมื่อรีสตาร์ตเซิร์ฟเวอร์)
        </p>
      )}

      {entries.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-4xl" aria-hidden="true">🎯</p>
          <h2 className="mt-3 font-bold text-white">ยังไม่มีคะแนนในตัวกรองนี้</h2>
          <p className="mt-1 text-sm text-muted-400">เล่นจบเกมแล้วบันทึกคะแนนขึ้นกระดานผู้นำได้เลย</p>
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
                  <td className="px-4 py-3 text-right">
                    {entry.timeSpentSeconds.toLocaleString('th-TH')} วิ
                  </td>
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
