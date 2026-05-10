'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import TopSettings from './TopSettings';
import ToastContainer from './ToastContainer';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  onTabChange?: (tab: 'portfolio' | 'market') => void;
  currentTab?: 'portfolio' | 'market';
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

export function getReputation(xp: number) {
  if (xp < 100) return { title: 'Broke Degen', level: 1, nextAt: 100, progress: xp / 100 };
  if (xp < 500) return { title: 'Gambler', level: 2, nextAt: 500, progress: (xp - 100) / 400 };
  if (xp < 2000) return { title: 'Shill Master', level: 3, nextAt: 2000, progress: (xp - 500) / 1500 };
  if (xp < 10000) return { title: 'Whale', level: 4, nextAt: 10000, progress: (xp - 2000) / 8000 };
  return { title: 'Meme Cartel Boss', level: 5, nextAt: xp, progress: 1 };
}

export default function AppLayout({ children, onTabChange, currentTab }: LayoutProps) {
  const playerMoney = useGameStore((state) => state.playerMoney);
  const currency = useGameStore((state) => state.currency);
  const xp = useGameStore((state) => state.xp);
  const activeCoinId = useGameStore((state) => state.activeCoinId);
  const coins = useGameStore((state) => state.coins);
  const activeCoin = activeCoinId ? coins[activeCoinId] : null;
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
          <button
             onClick={() => useGameStore.setState({ activeCoinId: null })}
             className="flex items-center gap-2 text-[#fcd535] font-bold text-xl cursor-pointer hover:opacity-80 transition-opacity"
          >
            <TrendingUp size={24} />
            <span>MemeDEX</span>
          </button>

          <div className="ml-8 hidden sm:flex items-center gap-6 text-sm font-medium">
             <button
                onClick={() => {
                   useGameStore.setState({ activeCoinId: null });
                   if (onTabChange) onTabChange('portfolio');
                }}
                className={`${!activeCoin && currentTab === 'portfolio' ? 'text-white border-b-2 border-[#fcd535]' : 'text-gray-400 hover:text-gray-200'} py-4 transition-colors`}
             >
                Portfolio
             </button>
             <button
                onClick={() => {
                   useGameStore.setState({ activeCoinId: null });
                   if (onTabChange) onTabChange('market');
                }}
                className={`${!activeCoin && currentTab === 'market' ? 'text-white border-b-2 border-[#fcd535]' : 'text-gray-400 hover:text-gray-200'} py-4 transition-colors`}
             >
                Trending
             </button>
             {activeCoin && (
                <button
                    className="text-white border-b-2 border-[#fcd535] py-4 transition-colors flex items-center gap-2"
                >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Terminal: {activeCoin.symbol}
                </button>
             )}
          </div>
        </div>

        <div className="flex items-center gap-6">

          {/* Reputation Badge */}
          <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-xs text-gray-400 font-medium">Lv. {getReputation(xp).level} {getReputation(xp).title}</span>
             <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                <div
                   className="h-full bg-[#fcd535]"
                   style={{ width: `${getReputation(xp).progress * 100}%` }}
                />
             </div>
          </div>

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

      <ToastContainer />
    </div>
  );
}
