import { TournamentDetailClient } from './tournament-detail-client';

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  return <TournamentDetailClient id={params.id} />;
}
