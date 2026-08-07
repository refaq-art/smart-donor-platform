import { Suspense } from 'react';
import { SetupClient } from './setup-client';

export default function SetupPage() {
  return (
    <Suspense>
      <SetupClient />
    </Suspense>
  );
}
