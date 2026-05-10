'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ConnectWallet from '@/components/ConnectWallet';
import Portfolio from '@/components/Portfolio';
import MarketTrending from '@/components/MarketTrending';
import TradingDashboard from '@/components/TradingDashboard';
import PlayerActions from '@/components/PlayerActions';
import { useGameStore } from '@/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';

export default function Home() {
  const playerWallet = useGameStore((state) => state.playerWallet);
  const activeCoinId = useGameStore((state) => state.activeCoinId);
  const [currentTab, setCurrentTab] = useState<'portfolio' | 'market'>('portfolio');

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
    <AppLayout onTabChange={setCurrentTab} currentTab={currentTab}>
      {!playerWallet ? (
        <ConnectWallet />
      ) : !activeCoinId ? (
        currentTab === 'portfolio' ? <Portfolio /> : <MarketTrending />
      ) : (
        <div className="flex flex-col w-full h-full">
          <TradingDashboard />
          <PlayerActions />
        </div>
      )}
    </AppLayout>
  );
}
