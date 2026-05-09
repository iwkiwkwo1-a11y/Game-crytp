'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Flame, Megaphone, Skull } from 'lucide-react';
import { formatMoney } from './AppLayout';

export default function PlayerActions() {
  const activeCoin = useGameStore((state) => state.activeCoin);
  const playerMoney = useGameStore((state) => state.playerMoney);
  const currency = useGameStore((state) => state.currency);
  const marketing = useGameStore((state) => state.marketing);
  const burnTokens = useGameStore((state) => state.burnTokens);
  const rugPull = useGameStore((state) => state.rugPull);

  if (!activeCoin || activeCoin.isRugPulled) return null;

  const handleMarketing = () => {
    // Basic marketing costs $500, adds 20 hype
    const cost = 500;
    if (playerMoney >= cost) {
      marketing(cost, 20);
    } else {
      alert("Not enough money for marketing!");
    }
  };

  const handleBurn = () => {
    // Burns 10% of developer tokens
    const burnAmount = activeCoin.developerTokens * 0.1;
    if (burnAmount > 0) {
      burnTokens(burnAmount);
      // Small hype boost for burning
      marketing(0, 5);
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
    <div className="bg-[#181a20] border-t border-gray-800 p-4 shrink-0 flex items-center justify-between">
      <div className="flex gap-4">
        <button
          onClick={handleMarketing}
          disabled={playerMoney < 500}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Megaphone size={18} />
          <span>Shill (Cost: {formatMoney(500, currency)})</span>
        </button>

        <button
          onClick={handleBurn}
          disabled={activeCoin.developerTokens <= 0}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Flame size={18} />
          <span>Burn Dev Tokens (10%)</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right text-xs text-gray-400 mr-2">
            <div>Your Dev Tokens:</div>
            <div className="font-mono text-white text-sm">
                {activeCoin.developerTokens.toLocaleString(undefined, {maximumFractionDigits: 0})} {activeCoin.symbol}
            </div>
        </div>
        <button
          onClick={handleRugPull}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all hover:scale-105"
        >
          <Skull size={18} />
          <span>RUG PULL</span>
        </button>
      </div>
    </div>
  );
}
