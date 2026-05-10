'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Wallet as WalletIcon } from 'lucide-react';

export default function ConnectWallet() {
  const createWallet = useGameStore((state) => state.createWallet);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    if (username.length > 15) {
      setError('Username too long (max 15 chars)');
      return;
    }
    createWallet(username.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6">
      <div className="max-w-md w-full bg-[#181a20] rounded-xl border border-gray-800 p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
            <WalletIcon size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Connect Web3 Wallet</h2>
        <p className="text-gray-400 text-center text-sm mb-8">
          Welcome to MemeDEX. Create a decentralized identity to start trading and deploying tokens.
        </p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Username alias</label>
            <input
              type="text"
              placeholder="e.g. DegenTrader99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0b0e11] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Create Wallet
          </button>
        </form>
      </div>
    </div>
  );
}
