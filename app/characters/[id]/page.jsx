import { notFound } from 'next/navigation';
import { fetchCharacter } from '@/lib/disney';
import CharacterDetailCard from '@/components/character/CharacterDetailCard';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const character = await fetchCharacter(id);

  if (!character) {
    return {
      title: 'ไม่พบตัวละคร — Disney Character Codex',
    };
  }

  return {
    title: `${character.name} — Disney Character Codex`,
    description: `ข้อมูลและประวัติของ ${character.name} จาก Disney API`,
  };
}

export default async function CharacterDetailPage({ params }) {
  // ★ Next.js 15: params เป็น Promise ต้อง await ก่อนอ่านค่า
  const { id } = await params;
  const character = await fetchCharacter(id);

  // ★ Rubric Twist Day 7: จัดการ id ที่ไม่มีอยู่จริงหรือตอบ data: [] ด้วย notFound()
  if (!character) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col py-6">
      <CharacterDetailCard character={character} />
    </div>
  );
}
