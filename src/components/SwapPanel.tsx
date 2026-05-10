'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from './AppLayout';
import { ArrowDownUp } from 'lucide-react';

export default function SwapPanel() {
  const activeCoinId = useGameStore((state) => state.activeCoinId);
  const coins = useGameStore((state) => state.coins);
  const activeCoin = activeCoinId ? coins[activeCoinId] : null;
  const playerMoney = useGameStore((state) => state.playerMoney);
  const playerWallet = useGameStore((state) => state.playerWallet);
  const coinHoldersMap = useGameStore((state) => state.coinHolders);
  const currency = useGameStore((state) => state.currency);
  const buyCoin = useGameStore((state) => state.buyCoin);
  const sellCoin = useGameStore((state) => state.sellCoin);

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');

  if (!activeCoin || activeCoin.isRugPulled || !playerWallet || !activeCoinId) return null;

  const myBalance = coinHoldersMap[activeCoinId]?.[playerWallet.address]?.balance || 0;

  // Calculate expected output
  const k = activeCoin.reserveToken * activeCoin.reserveCurrency;
  let expectedOutput = 0;
  let taxAmount = 0;
  const numAmount = Number(amount) || 0;

  if (mode === 'buy' && numAmount > 0) {
      // In USD
      let dy = numAmount;
      if (activeCoin.taxRate > 0) {
          taxAmount = dy * (activeCoin.taxRate / 100);
          dy -= taxAmount;
      }
      const newY = activeCoin.reserveCurrency + dy;
      const newX = k / newY;
      expectedOutput = activeCoin.reserveToken - newX;
  } else if (mode === 'sell' && numAmount > 0) {
      // In Tokens
      const dx = numAmount;
      const newX = activeCoin.reserveToken + dx;
      const newY = k / newX;
      let dy = activeCoin.reserveCurrency - newY;
      if (activeCoin.taxRate > 0) {
          taxAmount = dy * (activeCoin.taxRate / 100);
          dy -= taxAmount;
      }
      expectedOutput = dy;
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === 'buy') {
          buyCoin(activeCoinId, numAmount);
      } else {
          sellCoin(activeCoinId, numAmount);
      }
      setAmount('');
  };

  return (
    <div className="bg-[#181a20] border border-gray-800 rounded-lg p-4 mt-2">
      <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
              <ArrowDownUp size={16} /> Swap Terminal
          </h3>
          <div className="flex bg-gray-800 rounded-md p-1">
              <button
                type="button"
                onClick={() => setMode('buy')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mode === 'buy' ? 'bg-[#0ecc83] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                  Buy
              </button>
              <button
                type="button"
                onClick={() => setMode('sell')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mode === 'sell' ? 'bg-[#f6465d] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                  Sell
              </button>
          </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Pay with {mode === 'buy' ? 'USD' : activeCoin.symbol}</span>
                  <span>Bal: {mode === 'buy' ? formatMoney(playerMoney, currency) : myBalance.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gray-500"
                    step="any"
                    min={0.01}
                    max={mode === 'buy' ? playerMoney : myBalance}
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(mode === 'buy' ? playerMoney.toString() : myBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded"
                  >
                    MAX
                  </button>
              </div>
          </div>

          <div className="bg-[#0b0e11] p-3 rounded-lg border border-gray-800">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Expected Output</span>
              </div>
              <div className="font-mono text-white text-sm">
                  {expectedOutput > 0 ? (
                      mode === 'buy'
                        ? `${expectedOutput.toLocaleString(undefined, {maximumFractionDigits: 2})} ${activeCoin.symbol}`
                        : formatMoney(expectedOutput, currency)
                  ) : '0.00'}
              </div>
              {activeCoin.taxRate > 0 && numAmount > 0 && (
                  <div className="text-[10px] text-orange-400 mt-1">
                      Includes {activeCoin.taxRate}% Tax (Est: {mode === 'buy' ? formatMoney(taxAmount, currency) : formatMoney(taxAmount, currency)})
                  </div>
              )}
          </div>

          <button
            type="submit"
            disabled={!numAmount || numAmount <= 0 || (mode === 'buy' && numAmount > playerMoney) || (mode === 'sell' && numAmount > myBalance)}
            className={`w-full py-2.5 rounded-lg font-bold transition-colors text-black ${mode === 'buy' ? 'bg-[#0ecc83] hover:bg-[#0ecc83]/90' : 'bg-[#f6465d] hover:bg-[#f6465d]/90'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
              {mode === 'buy' ? `Buy ${activeCoin.symbol}` : `Sell ${activeCoin.symbol}`}
          </button>
      </form>
    </div>
  );
}
