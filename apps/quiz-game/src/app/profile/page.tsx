'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/components/providers/player-provider';
import { Spinner } from '@/components/ui/spinner';

export default function ProfileRedirectPage() {
  const { player, loading } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!player) {
      router.replace('/login?redirect=/profile');
      return;
    }
    router.replace(`/profile/${player.id}`);
  }, [loading, player, router]);

  return (
    <div className="flex justify-center py-20">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
