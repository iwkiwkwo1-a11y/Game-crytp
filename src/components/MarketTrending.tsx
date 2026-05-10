'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from './AppLayout';
import { Flame, Activity, Crown } from 'lucide-react';

export default function MarketTrending() {
  const coins = useGameStore((state) => state.coins);
  const currency = useGameStore((state) => state.currency);
  const playerWallet = useGameStore((state) => state.playerWallet);
  const setActiveCoinId = useGameStore((state) => state.setActiveCoinId);
  const priceHistory = useGameStore((state) => state.priceHistory);

  // Filter out rug pulled coins to show active market
  const activeCoinsList = Object.values(coins).filter(c => !c.isRugPulled);

  // Sort by Hype (Trending logic)
  const trendingCoins = [...activeCoinsList].sort((a, b) => b.hype - a.hype).slice(0, 20);

  const getPrice = (coinId: string) => {
      const coin = coins[coinId];
      if (!coin) return 0;
      return coin.reserveCurrency / coin.reserveToken;
  };

  const getMcap = (coinId: string) => {
      const coin = coins[coinId];
      if (!coin) return 0;
      return coin.totalSupply * getPrice(coinId);
  };

  const get24hChange = (coinId: string) => {
      const history = priceHistory[coinId];
      if (!history || history.length < 2) return 0;
      const first = history[0].close;
      const last = history[history.length - 1].close;
      return ((last - first) / first) * 100;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0e11] overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-2 border-b border-gray-800 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Flame className="text-orange-500" /> DexTrending
                </h2>
                <p className="text-sm text-gray-400 mt-1">Real-time meme coin leaderboard. Can you reach #1?</p>
            </div>
            <div className="bg-[#181a20] px-4 py-2 rounded-lg border border-gray-800 text-sm font-medium text-gray-300">
                <span className="text-[#fcd535] mr-2">Total Market Active Coins:</span> {activeCoinsList.length}
            </div>
        </div>

        {/* Coins List */}
        <div className="bg-[#181a20] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {trendingCoins.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                    <Activity size={48} className="mb-4 opacity-20" />
                    <p className="text-lg">Market is quiet right now.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-[#0b0e11]/50">
                            <th className="p-4 font-medium w-16 text-center">#</th>
                            <th className="p-4 font-medium">Token</th>
                            <th className="p-4 font-medium text-right">Price</th>
                            <th className="p-4 font-medium text-right">24h%</th>
                            <th className="p-4 font-medium text-right">Market Cap</th>
                            <th className="p-4 font-medium text-center">Hype Score</th>
                            <th className="p-4 font-medium text-center">Creator</th>
                            <th className="p-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trendingCoins.map((coin, index) => {
                            const isMine = coin.ownerAddress === playerWallet?.address;
                            const change = get24hChange(coin.id);

                            return (
                                <tr key={coin.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${isMine ? 'bg-[#fcd535]/5' : ''}`}>
                                    <td className="p-4 text-center text-gray-500 font-bold">
                                        {index === 0 ? <Crown size={18} className="text-[#fcd535] mx-auto" /> : index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white flex items-center gap-2">
                                                    {coin.name}
                                                    {coin.listingLevel > 0 && <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm ml-1">Tier {4 - coin.listingLevel}</span>}
                                                    {isMine && <span className="bg-[#fcd535] text-black text-[10px] px-1.5 py-0.5 rounded-sm ml-1">YOU</span>}
                                                </span>
                                                <span className="text-xs text-gray-500">{coin.symbol}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-300 text-right">
                                        {formatMoney(getPrice(coin.id), currency)}
                                    </td>
                                    <td className={`p-4 font-mono text-sm text-right ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {change > 0 ? '+' : ''}{change.toFixed(2)}%
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-300 text-right">
                                        {formatMoney(getMcap(coin.id), currency)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-orange-400">
                                            <Flame size={14} className={index < 3 ? 'fill-orange-400' : ''} />
                                            {Math.round(coin.hype)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 text-center font-mono">
                                        {coin.ownerAddress.substring(0, 6)}...
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setActiveCoinId(coin.id)}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition-colors font-medium border border-gray-700 hover:border-gray-500"
                                        >
                                            Trade
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
}
