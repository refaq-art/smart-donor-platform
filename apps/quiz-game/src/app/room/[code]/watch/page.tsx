import { WatchRoomClient } from './watch-client';

export default function WatchRoomPage({ params }: { params: { code: string } }) {
  return <WatchRoomClient code={params.code.toUpperCase()} />;
}
