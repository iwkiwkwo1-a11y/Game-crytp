'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from './AppLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function TradingDashboard() {
  const activeCoin = useGameStore((state) => state.activeCoin);
  const priceHistory = useGameStore((state) => state.priceHistory);
  const currency = useGameStore((state) => state.currency);

  const currentPrice = useMemo(() => {
    if (!activeCoin) return 0;
    return activeCoin.reserveCurrency / activeCoin.reserveToken;
  }, [activeCoin]);

  const marketCap = useMemo(() => {
    if (!activeCoin) return 0;
    return activeCoin.totalSupply * currentPrice;
  }, [activeCoin, currentPrice]);

  const chartData = useMemo(() => {
    return priceHistory.map(p => ({
      ...p,
      displayTime: format(new Date(p.time), 'HH:mm:ss'),
      displayPrice: currency === 'USD' ? p.close : p.close * 15000
    }));
  }, [priceHistory, currency]);

  // Fake Orderbook generation based on current price (Memoized to prevent impurity during render)
  // Ensure we check for activeCoin existence to avoid errors when activeCoin is null
  const fakeBids = useMemo(() => {
      if (!activeCoin) return [];
      return Array.from({length: 8}).map((_, i) => ({
        price: currentPrice * (1 - (i + 1) * 0.001),
        // use pseudo-random based on time/price to avoid pure math.random inside render/memo safely
        amount: ((currentPrice * 100000) % 100) * (activeCoin.totalSupply * 0.00001) + 1000 + i * 50
      }));
  }, [currentPrice, activeCoin]);

  const fakeAsks = useMemo(() => {
      if (!activeCoin) return [];
      return Array.from({length: 8}).map((_, i) => ({
        price: currentPrice * (1 + (8 - i) * 0.001),
        amount: ((currentPrice * 100000) % 100) * (activeCoin.totalSupply * 0.00001) + 1000 + (8-i) * 50
      }));
  }, [currentPrice, activeCoin]);

  if (!activeCoin) return null;

  const isUp = priceHistory.length >= 2
    ? priceHistory[priceHistory.length - 1].close >= priceHistory[priceHistory.length - 2].close
    : true;

  const strokeColor = isUp ? '#0ecc83' : '#f6465d';
  const fillColor = isUp ? 'url(#colorUp)' : 'url(#colorDown)';

  const formatPriceDecimals = (price: number) => {
    const val = currency === 'USD' ? price : price * 15000;
    if (val < 0.0001) return val.toFixed(8);
    if (val < 0.01) return val.toFixed(6);
    if (val < 1) return val.toFixed(4);
    return val.toFixed(2);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-1 p-1 bg-black">

      {/* Left Column: Chart & Stats */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">

        {/* Ticker Banner */}
        <div className="bg-[#181a20] p-4 flex flex-wrap items-center gap-8 border border-gray-800 rounded-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {activeCoin.name} <span className="text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{activeCoin.symbol}/USD</span>
            </h1>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Price</span>
            <span className={`text-lg font-bold ${isUp ? 'text-[#0ecc83]' : 'text-[#f6465d]'}`}>
              {formatMoney(currentPrice, currency)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Market Cap</span>
            <span className="text-white font-medium">{formatMoney(marketCap, currency)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Hype Meter</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-300"
                  style={{ width: `${activeCoin.hype}%` }}
                />
              </div>
              <span className="text-xs font-bold">{Math.round(activeCoin.hype)}%</span>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 bg-[#181a20] border border-gray-800 rounded-sm relative p-2 flex flex-col">
          {activeCoin.isRugPulled && (
             <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <h2 className="text-5xl font-black text-red-500 mb-4 animate-bounce">RUG PULLED!</h2>
                <p className="text-gray-300 text-lg mb-6">You took the money and ran. The coin is dead.</p>
                <button
                  onClick={() => useGameStore.setState({ activeCoin: null, priceHistory: [] })}
                  className="bg-[#fcd535] hover:bg-[#fcd535]/90 text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                >
                  Deploy Another Coin
                </button>
             </div>
          )}

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ecc83" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ecc83" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f6465d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f6465d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayTime"
                  stroke="#474d57"
                  tick={{fill: '#848e9c', fontSize: 12}}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke="#474d57"
                  tick={{fill: '#848e9c', fontSize: 12}}
                  orientation="right"
                  tickFormatter={(val) => formatPriceDecimals(val)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181a20', borderColor: '#2b3139', color: '#eaecef' }}
                  itemStyle={{ color: '#eaecef' }}
                  formatter={(value: any) => [formatPriceDecimals(Number(value)), 'Price']}
                  labelStyle={{ color: '#848e9c' }}
                />
                <Area
                  type="monotone"
                  dataKey="displayPrice"
                  stroke={strokeColor}
                  fillOpacity={1}
                  fill={fillColor}
                  isAnimationActive={false} // Disable animation for performance on quick updates
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Column: Order Book */}
      <div className="w-full lg:w-72 bg-[#181a20] border border-gray-800 rounded-sm flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200">Order Book</h3>
        </div>

        <div className="flex-1 p-2 flex flex-col text-xs font-mono">
          <div className="flex justify-between text-gray-500 mb-2 px-2">
            <span>Price(USD)</span>
            <span>Amount({activeCoin.symbol})</span>
          </div>

          {/* Asks (Sells) */}
          <div className="flex-1 flex flex-col justify-end">
            {fakeAsks.map((ask, i) => (
              <div key={`ask-${i}`} className="flex justify-between py-1 px-2 hover:bg-gray-800/50 cursor-pointer relative group">
                <div className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/10 z-0" style={{width: `${Math.min(100, (ask.amount / activeCoin.totalSupply) * 1000000)}%`}}></div>
                <span className="text-[#f6465d] z-10">{formatPriceDecimals(ask.price)}</span>
                <span className="text-gray-300 z-10">{(ask.amount).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
            ))}
          </div>

          {/* Current Price spread */}
          <div className="py-2 flex items-center justify-center border-y border-gray-800 my-1">
            <span className={`text-lg font-bold ${isUp ? 'text-[#0ecc83]' : 'text-[#f6465d]'}`}>
               {formatPriceDecimals(currentPrice)} {isUp ? '↑' : '↓'}
            </span>
          </div>

          {/* Bids (Buys) */}
          <div className="flex-1 flex flex-col justify-start">
            {fakeBids.map((bid, i) => (
              <div key={`bid-${i}`} className="flex justify-between py-1 px-2 hover:bg-gray-800/50 cursor-pointer relative group">
                <div className="absolute right-0 top-0 bottom-0 bg-[#0ecc83]/10 z-0" style={{width: `${Math.min(100, (bid.amount / activeCoin.totalSupply) * 1000000)}%`}}></div>
                <span className="text-[#0ecc83] z-10">{formatPriceDecimals(bid.price)}</span>
                <span className="text-gray-300 z-10">{(bid.amount).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
