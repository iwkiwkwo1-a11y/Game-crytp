'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from './AppLayout';
import { Rocket, AlertTriangle, Lock, Percent } from 'lucide-react';

export default function CreateCoinForm({ onDeploySuccess }: { onDeploySuccess?: () => void }) {
  const { playerMoney, currency, deployCoin } = useGameStore();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState<number | string>(1000000000); // 1 Billion default
  const [liquidity, setLiquidity] = useState<number | string>('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);
  const [error, setError] = useState('');

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedSupply = Number(supply);
    const parsedLiquidity = Number(liquidity);

    if (!name || !symbol) {
      setError('Name and symbol are required.');
      return;
    }
    if (isNaN(parsedSupply) || parsedSupply <= 0) {
      setError('Invalid supply.');
      return;
    }
    if (isNaN(parsedLiquidity) || parsedLiquidity <= 0) {
      setError('Invalid initial liquidity.');
      return;
    }
    if (parsedLiquidity > playerMoney) {
      setError("You don't have enough money for this liquidity.");
      return;
    }

    const antiSniper = locked; // Just as a simple correlation, or could add another checkbox
    deployCoin(name, symbol.toUpperCase(), parsedSupply, parsedLiquidity, taxRate, locked, antiSniper);

    if (onDeploySuccess) {
      onDeploySuccess();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6">
      <div className="max-w-md w-full bg-[#181a20] rounded-xl border border-gray-800 p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#fcd535]/10 rounded-full flex items-center justify-center text-[#fcd535]">
            <Rocket size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Deploy Meme Coin</h2>
        <p className="text-gray-400 text-center text-sm mb-8">
          Create your own crypto empire. Provide initial liquidity to list it on MemeDEX.
        </p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleDeploy} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Coin Name</label>
              <input
                type="text"
                placeholder="e.g. Doge Rocket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#fcd535] transition-colors"
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Symbol</label>
              <input
                type="text"
                placeholder="e.g. DROCK"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#fcd535] transition-colors uppercase"
                maxLength={8}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Total Supply</label>
            <input
              type="number"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#fcd535] transition-colors"
              min={1000}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider flex justify-between">
              <span>Initial Liquidity (USD)</span>
              <span className="text-[#fcd535]">Max: {formatMoney(playerMoney, currency)}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Amount to inject..."
                value={liquidity}
                onChange={(e) => setLiquidity(e.target.value)}
                className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#fcd535] transition-colors pr-16"
                min={1}
                step="any"
              />
              <button
                type="button"
                onClick={() => setLiquidity(playerMoney)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                <Percent size={14} /> Buy/Sell Tax
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#fcd535] transition-colors"
              >
                <option value={0}>0% (No Tax)</option>
                <option value={1}>1%</option>
                <option value={5}>5%</option>
                <option value={10}>10% (Degen)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                <Lock size={14} /> Liquidity
              </label>
              <button
                type="button"
                onClick={() => setLocked(!locked)}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${locked ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}
              >
                {locked ? 'Locked (Safe)' : 'Unlocked (Rug)'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#fcd535] hover:bg-[#fcd535]/90 text-black font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
          >
            Launch Token
          </button>
        </form>
      </div>
    </div>
  );
}
