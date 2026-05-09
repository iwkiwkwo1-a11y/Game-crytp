'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Flame, Skull } from 'lucide-react';

export default function PlayerActions() {
  const activeCoin = useGameStore((state) => state.activeCoin);
  const burnTokens = useGameStore((state) => state.burnTokens);
  const rugPull = useGameStore((state) => state.rugPull);

  if (!activeCoin || activeCoin.isRugPulled) return null;

  const handleBurn = () => {
    // Burns 10% of developer tokens
    const burnAmount = activeCoin.developerTokens * 0.1;
    if (burnAmount > 0) {
      burnTokens(burnAmount);
      // Removed old marketing call, burning now relies on organic hype or posting about it on the Social Feed
    }
  };

  const handleRugPull = () => {
    const confirm = window.confirm(
      "Are you sure you want to RUG PULL? You will sell all your dev tokens instantly, crushing the price and ending this coin forever."
    );
    if (confirm) {
      rugPull();
    }
  };

  return (
    <div className="bg-[#181a20] border-t border-gray-800 p-4 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex gap-4">
        <button
          onClick={handleBurn}
          disabled={activeCoin.developerTokens <= 0}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
        >
          <Flame size={18} />
          <span>Burn Dev Tokens (10%)</span>
        </button>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <div className="text-right text-xs text-gray-400 mr-2">
            <div>Your Dev Tokens:</div>
            <div className="font-mono text-white text-sm">
                {activeCoin.developerTokens.toLocaleString(undefined, {maximumFractionDigits: 0})} {activeCoin.symbol}
            </div>
        </div>
        <button
          onClick={handleRugPull}
          disabled={activeCoin.liquidityLocked}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)] disabled:shadow-none transition-all hover:scale-105"
          title={activeCoin.liquidityLocked ? "Cannot rug pull: Liquidity is locked!" : "Sell all dev tokens and destroy the coin"}
        >
          {activeCoin.liquidityLocked ? <span className="text-sm">LOCKED</span> : <><Skull size={18} /><span>RUG PULL</span></>}
        </button>
      </div>
    </div>
  );
}
