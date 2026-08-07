import { LobbyClient } from './lobby-client';

export default function LobbyPage({ params }: { params: { code: string } }) {
  return <LobbyClient code={params.code.toUpperCase()} />;
}
