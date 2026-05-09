'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from './AppLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function TradingDashboard() {
  const activeCoin = useGameStore((state) => state.activeCoin);
  const priceHistory = useGameStore((state) => state.priceHistory);
  const currency = useGameStore((state) => state.currency);
  const coinHolders = useGameStore((state) => state.coinHolders);
  const chartTimeframe = useGameStore((state) => state.chartTimeframe);
  const setTimeframe = useGameStore((state) => state.setTimeframe);
  const [activeTab, setActiveTab] = useState<'orderbook' | 'holders'>('orderbook');

  const topHolders = useMemo(() => {
    return Object.values(coinHolders)
      .filter(h => h.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);
  }, [coinHolders]);

  const currentPrice = useMemo(() => {
    if (!activeCoin) return 0;
    return activeCoin.reserveCurrency / activeCoin.reserveToken;
  }, [activeCoin]);

  const marketCap = useMemo(() => {
    if (!activeCoin) return 0;
    return activeCoin.totalSupply * currentPrice;
  }, [activeCoin, currentPrice]);

  // Aggregate price history based on selected timeframe
  const chartData = useMemo(() => {
    if (priceHistory.length === 0) return [];

    const aggregated = [];
    const intervalMs = chartTimeframe === '1s' ? 1000 : chartTimeframe === '10s' ? 10000 : 60000;

    // Group by interval
    let currentCandle = { ...priceHistory[0] };
    let currentIntervalStart = Math.floor(currentCandle.time / intervalMs) * intervalMs;

    for (let i = 1; i < priceHistory.length; i++) {
        const point = priceHistory[i];
        const pointIntervalStart = Math.floor(point.time / intervalMs) * intervalMs;

        if (pointIntervalStart === currentIntervalStart) {
            // Same interval, update candle
            currentCandle.high = Math.max(currentCandle.high, point.high);
            currentCandle.low = Math.min(currentCandle.low, point.low);
            currentCandle.close = point.close;
            currentCandle.volume += point.volume;
        } else {
            // New interval, push old and start new
            aggregated.push({
                ...currentCandle,
                displayTime: format(new Date(currentCandle.time), chartTimeframe === '1m' ? 'HH:mm' : 'HH:mm:ss'),
                displayPrice: currency === 'USD' ? currentCandle.close : currentCandle.close * 15000
            });
            currentCandle = { ...point };
            currentIntervalStart = pointIntervalStart;
        }
    }

    // Push the last candle
    aggregated.push({
        ...currentCandle,
        displayTime: format(new Date(currentCandle.time), chartTimeframe === '1m' ? 'HH:mm' : 'HH:mm:ss'),
        displayPrice: currency === 'USD' ? currentCandle.close : currentCandle.close * 15000
    });

    // Limit to display 100 candles on UI so it's not too squished
    return aggregated.slice(-100);

  }, [priceHistory, currency, chartTimeframe]);

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
        <div className="bg-[#181a20] p-4 flex flex-wrap items-center gap-6 border border-gray-800 rounded-sm">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {activeCoin.name} <span className="text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{activeCoin.symbol}/USD</span>
            </h1>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Price</span>
            <span className={`text-lg font-bold ${isUp ? 'text-[#0ecc83]' : 'text-[#f6465d]'}`}>
              {currency === 'USD' ? '$' : 'Rp'}{formatPriceDecimals(currentPrice)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Market Cap</span>
            <span className="text-white font-medium">{formatMoney(marketCap, currency)}</span>
          </div>

          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-gray-400">24h High (ATH)</span>
            <span className="text-white font-medium">{currency === 'USD' ? '$' : 'Rp'}{formatPriceDecimals(activeCoin.ath)}</span>
          </div>

          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-gray-400">24h Low (ATL)</span>
            <span className="text-white font-medium">{currency === 'USD' ? '$' : 'Rp'}{formatPriceDecimals(activeCoin.atl)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Hype Meter</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-300"
                  style={{ width: `${activeCoin.hype}%` }}
                />
              </div>
              <span className="text-xs font-bold w-6">{Math.round(activeCoin.hype)}%</span>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 bg-[#181a20] border border-gray-800 rounded-sm relative flex flex-col">

          {/* Chart Toolbar / Timeframes */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
            <span className="text-xs text-gray-500 mr-2">Time:</span>
            {['1s', '10s', '1m'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as '1s'|'10s'|'1m')}
                className={`text-xs px-2 py-1 rounded transition-colors ${chartTimeframe === tf ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
              >
                {tf}
              </button>
            ))}
          </div>

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

          <div className="flex-1 w-full min-h-[300px] p-2">
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
                  contentStyle={{ backgroundColor: '#181a20', borderColor: '#2b3139', color: '#eaecef', borderRadius: '8px' }}
                  itemStyle={{ color: '#eaecef', fontWeight: 'bold' }}
                  formatter={(value: unknown) => [formatPriceDecimals(Number(value)), 'Price']}
                  labelStyle={{ color: '#848e9c', marginBottom: '4px' }}
                  animationDuration={150}
                />
                <Area
                  type="monotone"
                  dataKey="displayPrice"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={fillColor}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Column: Order Book & Holders */}
      <div className="w-full lg:w-80 bg-[#181a20] border border-gray-800 rounded-sm flex flex-col shrink-0">

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800">
          <button
            className={`flex-1 p-3 text-sm font-semibold text-center transition-colors ${activeTab === 'orderbook' ? 'text-white border-b-2 border-[#fcd535]' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab('orderbook')}
          >
            Order Book
          </button>
          <button
            className={`flex-1 p-3 text-sm font-semibold text-center transition-colors ${activeTab === 'holders' ? 'text-white border-b-2 border-[#fcd535]' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab('holders')}
          >
            Top Holders
          </button>
        </div>

        <div className="flex-1 p-2 flex flex-col text-xs font-mono overflow-y-auto">
          {activeTab === 'orderbook' ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col gap-1">
               <div className="flex justify-between text-gray-500 mb-2 px-2">
                 <span>Wallet</span>
                 <span>Holdings</span>
               </div>
               {topHolders.map((holder, i) => {
                 const percentage = (holder.balance / activeCoin.totalSupply) * 100;
                 return (
                   <div key={holder.address} className="flex justify-between items-center py-2 px-2 border-b border-gray-800/50 hover:bg-gray-800/30">
                     <div className="flex flex-col gap-1 overflow-hidden pr-2">
                       <span className={`font-semibold truncate ${holder.isPlayer ? 'text-[#fcd535]' : 'text-gray-300'}`}>
                         {holder.name} {i === 0 && '👑'}
                       </span>
                       <span className="text-[10px] text-gray-500 truncate">
                         {holder.address.substring(0, 6)}...{holder.address.substring(holder.address.length - 4)}
                       </span>
                     </div>
                     <div className="flex flex-col items-end shrink-0">
                       <span className="text-white">
                         {holder.balance >= 1000000
                           ? (holder.balance / 1000000).toFixed(2) + 'M'
                           : holder.balance >= 1000
                             ? (holder.balance / 1000).toFixed(2) + 'K'
                             : holder.balance.toFixed(0)}
                       </span>
                       <span className={`${percentage > 5 ? 'text-orange-400' : 'text-gray-400'} text-[10px]`}>
                         {percentage.toFixed(2)}%
                       </span>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
