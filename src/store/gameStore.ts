import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Coin, PricePoint } from '../types/game';

const INITIAL_MONEY = 10000;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerMoney: INITIAL_MONEY,
      currency: 'USD',
      activeCoin: null,
      priceHistory: [],

      setCurrency: (currency) => set({ currency }),

      deployCoin: (name, symbol, supply, initialLiquidity) => {
        const { playerMoney } = get();
        if (playerMoney < initialLiquidity) return;

        // Player puts in initialLiquidity, and all supply into the pool initially
        // but maybe keeps some dev tokens? Let's say 10% dev tokens.
        const devTokens = supply * 0.1;
        const poolTokens = supply * 0.9;

        const newCoin: Coin = {
          id: Date.now().toString(),
          name,
          symbol,
          totalSupply: supply,
          circulatingSupply: supply,
          reserveToken: poolTokens,
          reserveCurrency: initialLiquidity,
          hype: 10,
          createdAt: Date.now(),
          isRugPulled: false,
          developerTokens: devTokens,
        };

        const initialPrice = initialLiquidity / poolTokens;
        const initialPricePoint: PricePoint = {
          time: Date.now(),
          open: initialPrice,
          high: initialPrice,
          low: initialPrice,
          close: initialPrice,
          volume: 0,
        };

        set({
          playerMoney: playerMoney - initialLiquidity,
          activeCoin: newCoin,
          priceHistory: [initialPricePoint],
        });
      },

      marketing: (cost, hypeBoost) => {
        const { playerMoney, activeCoin } = get();
        if (!activeCoin || activeCoin.isRugPulled || playerMoney < cost) return;

        set({
          playerMoney: playerMoney - cost,
          activeCoin: {
            ...activeCoin,
            hype: Math.min(100, activeCoin.hype + hypeBoost),
          },
        });
      },

      burnTokens: (amount) => {
        const { activeCoin } = get();
        if (!activeCoin || activeCoin.isRugPulled) return;
        if (activeCoin.developerTokens < amount) return;

        set({
          activeCoin: {
            ...activeCoin,
            developerTokens: activeCoin.developerTokens - amount,
            totalSupply: activeCoin.totalSupply - amount,
            circulatingSupply: activeCoin.circulatingSupply - amount,
          },
        });
      },

      rugPull: () => {
        const { activeCoin, playerMoney } = get();
        if (!activeCoin || activeCoin.isRugPulled) return;

        // Sell all dev tokens
        // AMM pricing: constant product x * y = k
        const x = activeCoin.reserveToken;
        const y = activeCoin.reserveCurrency;
        const dx = activeCoin.developerTokens;

        // Fee = 0 for dev selling
        const dy = y - (x * y) / (x + dx);

        set({
          playerMoney: playerMoney + dy,
          activeCoin: {
            ...activeCoin,
            isRugPulled: true,
            developerTokens: 0,
            reserveToken: x + dx,
            reserveCurrency: y - dy,
            hype: 0,
          },
        });
      },

      updateMarket: () => {
        const { activeCoin, priceHistory } = get();
        if (!activeCoin || activeCoin.isRugPulled) return;

        const now = Date.now();

        let newReserveToken = activeCoin.reserveToken;
        let newReserveCurrency = activeCoin.reserveCurrency;
        let newHype = activeCoin.hype;
        let volume = 0;

        // --- BOT SIMULATION ---
        // Constant product: k = reserveToken * reserveCurrency
        const k = newReserveToken * newReserveCurrency;

        // Hype decay
        newHype = Math.max(1, newHype - 0.5); // Decay per tick

        // Random market activity based on hype
        const activityLevel = Math.max(0.01, newHype / 100);

        // Determine if buy or sell pressure is higher (hype > 50 means more buy pressure)
        const buyProbability = 0.3 + (newHype / 200); // 0.3 to 0.8

        const isBuy = Math.random() < buyProbability;

        // Determine trade size (0.1% to 5% of pool) depending on activity
        const tradePct = (Math.random() * 0.04 + 0.01) * activityLevel;

        if (isBuy) {
            // Bot Buys (Adds currency, removes token)
            const dy = newReserveCurrency * tradePct; // Currency spent
            const newY = newReserveCurrency + dy;
            const newX = k / newY;

            newReserveCurrency = newY;
            newReserveToken = newX;
            volume += dy;
        } else {
            // Bot Sells (Adds token, removes currency)
            const dx = newReserveToken * tradePct; // Tokens sold
            const newX = newReserveToken + dx;
            const newY = k / newX;
            const dy = newReserveCurrency - newY; // Currency received

            newReserveToken = newX;
            newReserveCurrency = newY;
            volume += dy;
        }

        // Random Whale Action (1% chance)
        if (Math.random() < 0.01) {
            const whaleAction = Math.random() < 0.5 ? 'buy' : 'sell';
            const whaleTradePct = Math.random() * 0.1 + 0.05; // 5% to 15% of pool
            if (whaleAction === 'buy') {
                const dy = newReserveCurrency * whaleTradePct;
                const newY = newReserveCurrency + dy;
                const newX = k / newY;
                newReserveCurrency = newY;
                newReserveToken = newX;
                volume += dy;
            } else {
                const dx = newReserveToken * whaleTradePct;
                const newX = newReserveToken + dx;
                const newY = k / newX;
                newReserveToken = newX;
                newReserveCurrency = newY;
                volume += (newReserveCurrency - newY); // approx
            }
        }

        const newPrice = newReserveCurrency / newReserveToken;

        // Update Price History
        const lastPoint = priceHistory[priceHistory.length - 1];
        const pointDuration = 5000; // 5 seconds per candle

        let updatedHistory = [...priceHistory];

        if (now - lastPoint.time >= pointDuration) {
            // Create new candle
            updatedHistory.push({
                time: now,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice,
                volume: volume
            });
        } else {
            // Update current candle
            const updatedPoint = { ...lastPoint };
            updatedPoint.high = Math.max(updatedPoint.high, newPrice);
            updatedPoint.low = Math.min(updatedPoint.low, newPrice);
            updatedPoint.close = newPrice;
            updatedPoint.volume += volume;
            updatedHistory[updatedHistory.length - 1] = updatedPoint;
        }

        // Keep only last 100 points
        if (updatedHistory.length > 100) {
            updatedHistory = updatedHistory.slice(-100);
        }

        set({
            activeCoin: {
                ...activeCoin,
                reserveToken: newReserveToken,
                reserveCurrency: newReserveCurrency,
                hype: newHype
            },
            priceHistory: updatedHistory
        });
      },

      resetGame: () => {
        set({
          playerMoney: INITIAL_MONEY,
          activeCoin: null,
          priceHistory: [],
          currency: 'USD'
        });
      }
    }),
    {
      name: 'meme-tycoon-storage',
    }
  )
);
