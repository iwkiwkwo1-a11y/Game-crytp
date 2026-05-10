'use client';

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Settings } from 'lucide-react';

export default function TopSettings() {
  const currency = useGameStore((state) => state.currency);
  const setCurrency = useGameStore((state) => state.setCurrency);

  return (
    <div className="flex items-center gap-2 border-l border-gray-700 pl-4 ml-2">
      <Settings size={18} className="text-gray-400" />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as 'USD' | 'IDR')}
        className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer hover:text-white"
      >
        <option value="USD" className="bg-gray-800">USD</option>
        <option value="IDR" className="bg-gray-800">IDR</option>
      </select>
    </div>
  );
}
