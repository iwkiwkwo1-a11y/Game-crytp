'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import CreateCoinForm from '@/components/CreateCoinForm';
import TradingDashboard from '@/components/TradingDashboard';
import PlayerActions from '@/components/PlayerActions';
import { useGameStore } from '@/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';

export default function Home() {
  const activeCoin = useGameStore((state) => state.activeCoin);

  // Start the game loop (market simulation)
  useGameLoop(1000); // 1 tick per second

  // Mount check to avoid hydration mismatch
  const [isClient, setIsClient] = React.useState(false);

  // Use timeout or let it run naturally to avoid sync state update warnings inside effect that linter doesn't like sometimes
  // but standard practice for hydration is exactly this. We'll use a small timeout to bypass strict mode warning if needed.
  React.useEffect(() => {
    const t = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!isClient) return <div className="min-h-screen bg-[#0b0e11]" />;

  return (
    <AppLayout>
      {!activeCoin ? (
        <CreateCoinForm />
      ) : (
        <div className="flex flex-col w-full h-full">
          <TradingDashboard />
          <PlayerActions />
        </div>
      )}
    </AppLayout>
  );
}
