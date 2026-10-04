import { GameProvider } from '@/context/GameContext';
import GameBoard from '@/components/game/GameBoard';

export const metadata = {
  title: 'Game Arena — Disney Clue Guesser & PokéGuesser Deduction',
  description: 'กระดานเล่นเกมทายตัวละคร Disney สองโหมด: โหมดอนุมานคุณลักษณะ PokéGuesser Deduction และโหมดตอบคำถาม Trivia 5 ด่าน',
};

export default async function PlayPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialMode = resolvedSearchParams?.mode === 'trivia' ? 'trivia' : 'deduction';

  return (
    <div className="flex-1 flex flex-col justify-center py-4 sm:py-8">
      <GameProvider initialMode={initialMode}>
        <GameBoard />
      </GameProvider>
    </div>
  );
}

