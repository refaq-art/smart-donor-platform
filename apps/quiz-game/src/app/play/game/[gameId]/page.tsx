import { GamePageClient } from './game-page-client';

export default function GamePage({ params }: { params: { gameId: string } }) {
  return <GamePageClient gameId={params.gameId} />;
}
