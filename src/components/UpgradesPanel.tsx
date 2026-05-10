'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Zap, Bot, BrainCircuit, HeartHandshake, Lock } from 'lucide-react';

export default function UpgradesPanel() {
  const xp = useGameStore((state) => state.xp);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);

  const getCost = (currentLevel: number) => {
      if (currentLevel >= 5) return 'MAX';
      return 100 * Math.pow(2, currentLevel);
  };

  const UPGRADES = [
      {
          key: 'botFarm' as const,
          name: 'Bot Farm (Socials)',
          icon: <Bot className="text-blue-400" size={32} />,
          desc: 'Increases the number of likes you get on your social feed posts. Each level adds +50% likes, building organic hype faster.',
          level: upgrades.botFarm
      },
      {
          key: 'smoothTalker' as const,
          name: 'Smooth Talker',
          icon: <BrainCircuit className="text-purple-400" size={32} />,
          desc: 'Manipulates bots into ignoring your high taxes. Reduces perceived buy tax by 1% per level, meaning bots buy more frequently despite taxes.',
          level: upgrades.smoothTalker
      },
      {
          key: 'hypeAura' as const,
          name: 'Hype Aura',
          icon: <HeartHandshake className="text-pink-400" size={32} />,
          desc: 'Reduces the natural decay of hype for coins you own. Each level slows decay by 0.05 per tick, keeping your coins trending longer.',
          level: upgrades.hypeAura
      }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0e11] overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-6 space-y-8">

        {/* Header Stats */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-6">
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-2">
                    <Zap className="text-[#fcd535]" size={28} /> Upgrades & Skills
                </h2>
                <p className="text-gray-400 mt-2">Spend your hard-earned XP to unlock permanent perks.</p>
            </div>
            <div className="bg-[#181a20] px-6 py-4 rounded-xl border border-[#fcd535]/30 flex flex-col items-center">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Available XP</span>
                <span className="text-3xl font-black text-[#fcd535]">{xp.toLocaleString()}</span>
            </div>
        </div>

        {/* Upgrades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {UPGRADES.map((upg) => {
                const cost = getCost(upg.level);
                const isMax = upg.level >= 5;
                const canAfford = !isMax && xp >= (cost as number);

                return (
                    <div key={upg.key} className="bg-[#181a20] border border-gray-800 rounded-xl p-6 flex flex-col justify-between hover:border-gray-700 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-800 rounded-lg">{upg.icon}</div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Level</span>
                                    <span className={`text-xl font-black ${isMax ? 'text-[#0ecc83]' : 'text-white'}`}>
                                        {upg.level} <span className="text-sm text-gray-600 font-medium">/ 5</span>
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{upg.name}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                {upg.desc}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-800 rounded-full mb-6 overflow-hidden">
                            <div
                                className="h-full bg-[#fcd535] transition-all"
                                style={{ width: `${(upg.level / 5) * 100}%` }}
                            />
                        </div>

                        <button
                            onClick={() => !isMax && buyUpgrade(upg.key, cost as number)}
                            disabled={isMax || !canAfford}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                                ${isMax
                                    ? 'bg-[#0ecc83]/20 text-[#0ecc83] cursor-not-allowed border border-[#0ecc83]/30'
                                    : canAfford
                                        ? 'bg-[#fcd535] hover:bg-[#fcd535]/90 text-black shadow-lg hover:scale-[1.02]'
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                }`
                            }
                        >
                            {isMax ? 'MAX LEVEL' : (
                                <>
                                    <Zap size={16} className={canAfford ? 'text-black' : 'text-gray-500'} />
                                    Upgrade (-{cost} XP)
                                </>
                            )}
                        </button>
                    </div>
                );
            })}

            {/* Coming Soon Box */}
            <div className="bg-[#0b0e11] border border-gray-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-50">
                <Lock size={40} className="text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-400 mb-2">Dark Web Hacker</h3>
                <p className="text-xs text-gray-600">Sabotage bot coins to force panic sells. Unlocks in future updates.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
