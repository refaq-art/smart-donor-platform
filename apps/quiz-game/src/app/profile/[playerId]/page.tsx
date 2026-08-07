import { ProfileClient } from './profile-client';

export default function ProfilePage({ params }: { params: { playerId: string } }) {
  return <ProfileClient playerId={params.playerId} />;
}
