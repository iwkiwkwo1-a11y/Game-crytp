'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameLoop(intervalMs: number = 1000) {
  const updateMarket = useGameStore((state) => state.updateMarket);
  const activeCoin = useGameStore((state) => state.activeCoin);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run loop if there's an active coin and it hasn't been rug pulled
    if (!activeCoin || activeCoin.isRugPulled) {
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
  }, [activeCoin, activeCoin?.id, activeCoin?.isRugPulled, intervalMs, updateMarket]);
}
