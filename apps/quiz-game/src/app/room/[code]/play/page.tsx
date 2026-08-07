import { RoomPlayClient } from './play-client';

export default function RoomPlayPage({ params }: { params: { code: string } }) {
  return <RoomPlayClient code={params.code.toUpperCase()} />;
}
