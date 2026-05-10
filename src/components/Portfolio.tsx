'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Rocket, Activity, FolderGit2, Coins, TrendingUp } from 'lucide-react';
import { formatMoney } from './AppLayout';
import CreateCoinForm from './CreateCoinForm';

export default function Portfolio() {
  const coins = useGameStore((state) => state.coins);
  const playerWallet = useGameStore((state) => state.playerWallet);
  const setActiveCoinId = useGameStore((state) => state.setActiveCoinId);
  const currency = useGameStore((state) => state.currency);

  const [showDeploy, setShowDeploy] = React.useState(false);

  // Filter to get only coins owned by the player
  const myCoins = Object.values(coins).filter(c => c.ownerAddress === playerWallet?.address);

  // Calculate total portfolio value (rough estimate based on active coins reserves)
  const portfolioValue = myCoins.reduce((total, coin) => {
    if (coin.isRugPulled) return total;
    const price = coin.reserveCurrency / coin.reserveToken;
    return total + (coin.developerTokens * price);
  }, 0);

  if (showDeploy) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-[#181a20] flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Rocket size={20}/> Deploy Contract</h2>
            <button
                onClick={() => setShowDeploy(false)}
                className="text-gray-400 hover:text-white"
            >
                Back to Portfolio
            </button>
        </div>
        <div className="flex-1 overflow-y-auto">
            <CreateCoinForm onDeploySuccess={() => setShowDeploy(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0e11] overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5"><FolderGit2 size={100} /></div>
                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Deployed</span>
                <span className="text-4xl font-black text-white">{myCoins.length}</span>
            </div>

            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5"><Coins size={100} /></div>
                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Active Coins</span>
                <span className="text-4xl font-black text-[#0ecc83]">{myCoins.filter(c => !c.isRugPulled).length}</span>
            </div>

            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5"><TrendingUp size={100} /></div>
                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Tokens Value (Est)</span>
                <span className="text-4xl font-black text-[#fcd535]">{formatMoney(portfolioValue, currency)}</span>
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="text-2xl font-bold text-white">Your Contracts</h2>
            <button
                onClick={() => setShowDeploy(true)}
                className="bg-[#fcd535] hover:bg-[#fcd535]/90 text-black px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg"
            >
                <Rocket size={18} />
                Deploy New Coin
            </button>
        </div>

        {/* Coins List */}
        <div className="bg-[#181a20] border border-gray-800 rounded-xl overflow-hidden">
            {myCoins.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                    <Activity size={48} className="mb-4 opacity-20" />
                    <p className="text-lg">Your portfolio is empty.</p>
                    <p className="text-sm mt-1">Deploy your first meme coin to start the simulation!</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-[#0b0e11]/50">
                            <th className="p-4 font-medium">Coin</th>
                            <th className="p-4 font-medium">Price</th>
                            <th className="p-4 font-medium">Market Cap</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myCoins.sort((a,b) => b.createdAt - a.createdAt).map(coin => {
                            const price = coin.reserveCurrency / coin.reserveToken;
                            const mcap = coin.totalSupply * price;

                            return (
                                <tr key={coin.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#fcd535] text-black font-bold flex items-center justify-center shrink-0">
                                                {coin.symbol[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{coin.name}</span>
                                                <span className="text-xs text-gray-500">{coin.symbol}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-300">
                                        {formatMoney(price, currency)}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-300">
                                        {formatMoney(mcap, currency)}
                                    </td>
                                    <td className="p-4">
                                        {coin.isRugPulled ? (
                                            <span className="inline-block px-2.5 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
                                                DEAD
                                            </span>
                                        ) : (
                                            <span className="inline-block px-2.5 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
                                                ACTIVE
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setActiveCoinId(coin.id)}
                                            className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium border border-gray-700 hover:border-gray-500"
                                        >
                                            View Terminal
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
