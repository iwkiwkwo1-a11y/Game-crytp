'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import TopSettings from './TopSettings';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

export function formatMoney(amount: number, currency: 'USD' | 'IDR') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  } else {
    // 1 USD = ~15000 IDR roughly
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount * 15000);
  }
}

export default function AppLayout({ children }: LayoutProps) {
  const playerMoney = useGameStore((state) => state.playerMoney);
  const currency = useGameStore((state) => state.currency);
  const activeCoin = useGameStore((state) => state.activeCoin);
  const resetGame = useGameStore((state) => state.resetGame);

  const newsAlert = useGameStore((state) => state.newsAlert);
  const clearNews = useGameStore((state) => state.clearNews);

  // Auto clear news after 5 seconds
  React.useEffect(() => {
    if (newsAlert) {
      const t = setTimeout(() => {
        clearNews();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [newsAlert, clearNews]);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-gray-200 font-sans flex flex-col relative">
      {/* News Banner */}
      {newsAlert && (
        <div className="absolute top-16 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold py-2 px-4 flex justify-center items-center shadow-lg animate-in slide-in-from-top-2">
          🚨 BREAKING NEWS: {newsAlert}
        </div>
      )}

      {/* Top Navbar */}
      <nav className="h-16 border-b border-gray-800 bg-[#181a20] flex items-center justify-between px-6 shrink-0 relative z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#fcd535] font-bold text-xl">
            <TrendingUp size={24} />
            <span>MemeDEX</span>
          </div>
          {activeCoin && (
            <div className="ml-8 flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-md text-sm border border-gray-700">
              <span className="text-gray-400">Active:</span>
              <span className="font-semibold text-white">{activeCoin.symbol}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg font-medium border border-green-400/20">
            <Wallet size={18} />
            {formatMoney(playerMoney, currency)}
          </div>

          <button
            onClick={resetGame}
            title="Reset Game"
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            <RefreshCw size={20} />
          </button>

          <TopSettings />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
