'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameLoop(intervalMs: number = 1000) {
  const updateMarket = useGameStore((state) => state.updateMarket);
  const playerWallet = useGameStore((state) => state.playerWallet);
  const coins = useGameStore((state) => state.coins);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run loop if player has connected wallet and there are coins
    if (!playerWallet || Object.keys(coins).length === 0) {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return;
    }

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        updateMarket();
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playerWallet, coins, intervalMs, updateMarket]);
}
