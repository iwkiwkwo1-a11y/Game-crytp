'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Flame, Skull, Gift, Rocket } from 'lucide-react';
import { formatMoney } from './AppLayout';

export default function PlayerActions() {
  const activeCoinId = useGameStore((state) => state.activeCoinId);
  const coins = useGameStore((state) => state.coins);
  const activeCoin = activeCoinId ? coins[activeCoinId] : null;
  const playerMoney = useGameStore((state) => state.playerMoney);
  const currency = useGameStore((state) => state.currency);
  const burnTokens = useGameStore((state) => state.burnTokens);
  const rugPull = useGameStore((state) => state.rugPull);
  const fastTrackList = useGameStore((state) => state.fastTrackList);
  const startAirdrop = useGameStore((state) => state.startAirdrop);

  const [airdropAmount, setAirdropAmount] = useState<string>('');

  if (!activeCoin || activeCoin.isRugPulled) return null;

  const handleBurn = () => {
    // Burns 10% of developer tokens
    const burnAmount = activeCoin.developerTokens * 0.1;
    if (burnAmount > 0 && activeCoinId) {
      burnTokens(activeCoinId, burnAmount);
    }
  };

  const handleAirdrop = () => {
    const amount = Number(airdropAmount);
    if (amount > 0 && amount <= activeCoin.developerTokens && activeCoinId) {
        startAirdrop(activeCoinId, amount);
        setAirdropAmount('');
    }
  };

  const handleFastTrack = () => {
      if (playerMoney >= 500 && activeCoinId) {
          fastTrackList(activeCoinId);
      }
  };

  const handleRugPull = () => {
    const confirm = window.confirm(
      "Are you sure you want to RUG PULL? You will sell all your dev tokens instantly, crushing the price and ending this coin forever."
    );
    if (confirm && activeCoinId) {
      rugPull(activeCoinId);
    }
  };

  return (
    <div className="bg-[#181a20] border-t border-gray-800 p-4 shrink-0 flex flex-col xl:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap gap-4 items-center">

        <button
          onClick={handleBurn}
          disabled={activeCoin.developerTokens <= 0}
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto text-sm"
        >
          <Flame size={16} />
          <span>Burn Dev Tokens (10%)</span>
        </button>

        {!activeCoin.isListedCMC && (
            <button
              onClick={handleFastTrack}
              disabled={playerMoney < 500}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto text-sm"
              title="Pay $500 for instant CMC Listing (Massive Hype & Followers)"
            >
              <Rocket size={16} />
              <span>Fast-Track CMC ({formatMoney(500, currency)})</span>
            </button>
        )}

        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg w-full sm:w-auto">
            <input
                type="number"
                value={airdropAmount}
                onChange={(e) => setAirdropAmount(e.target.value)}
                placeholder="Tokens to airdrop"
                className="bg-transparent text-white px-2 py-1 outline-none text-sm w-32"
                min={1}
                max={activeCoin.developerTokens}
            />
            <button
                onClick={handleAirdrop}
                disabled={!airdropAmount || activeCoin.airdropActive || Number(airdropAmount) > activeCoin.developerTokens}
                className="flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors text-sm"
            >
                <Gift size={14} />
                <span>{activeCoin.airdropActive ? 'Dropping...' : 'Airdrop'}</span>
            </button>
        </div>

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
