import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Coin, PricePoint, Holder } from '../types/game';

const INITIAL_MONEY = 10000;

function generateFakeAddress() {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerMoney: INITIAL_MONEY,
      playerWallet: null,
      currency: 'USD',
      activeCoin: null,
      priceHistory: [],
      coinHolders: {},

      setCurrency: (currency) => set({ currency }),

      createWallet: (username: string) => {
        set({
          playerWallet: {
            username,
            address: generateFakeAddress()
          }
        });
      },

      deployCoin: (name, symbol, supply, initialLiquidity) => {
        const { playerMoney, playerWallet } = get();
        if (playerMoney < initialLiquidity || !playerWallet) return;

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

        // Initialize Holders
        const holders: Record<string, Holder> = {
            [playerWallet.address]: {
                address: playerWallet.address,
                name: playerWallet.username + ' (Dev)',
                balance: devTokens,
                isPlayer: true
            },
            'liquidity_pool': {
                address: '0x000000000000000000000000000000000000dead', // Fake burn/pool address
                name: 'Liquidity Pool',
                balance: poolTokens,
                isPlayer: false
            }
        };

        // Create some initial bot wallets
        const botNames = ['SniperBot', 'Whale_77', 'DegenApe', 'ChadTrader', 'NPC_1337'];
        for (const bName of botNames) {
            const addr = generateFakeAddress();
            holders[addr] = {
                address: addr,
                name: bName,
                balance: 0,
                isPlayer: false
            };
        }

        set({
          playerMoney: playerMoney - initialLiquidity,
          activeCoin: newCoin,
          priceHistory: [initialPricePoint],
          coinHolders: holders
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
        const { activeCoin, coinHolders, playerWallet } = get();
        if (!activeCoin || activeCoin.isRugPulled || !playerWallet) return;
        if (activeCoin.developerTokens < amount) return;

        const updatedHolders = { ...coinHolders };
        if (updatedHolders[playerWallet.address]) {
            updatedHolders[playerWallet.address].balance -= amount;
        }

        set({
          activeCoin: {
            ...activeCoin,
            developerTokens: activeCoin.developerTokens - amount,
            totalSupply: activeCoin.totalSupply - amount,
            circulatingSupply: activeCoin.circulatingSupply - amount,
          },
          coinHolders: updatedHolders
        });
      },

      rugPull: () => {
        const { activeCoin, playerMoney, coinHolders, playerWallet } = get();
        if (!activeCoin || activeCoin.isRugPulled || !playerWallet) return;

        // Sell all dev tokens
        // AMM pricing: constant product x * y = k
        const x = activeCoin.reserveToken;
        const y = activeCoin.reserveCurrency;
        const dx = activeCoin.developerTokens;

        // Fee = 0 for dev selling
        const dy = y - (x * y) / (x + dx);

        const updatedHolders = { ...coinHolders };
        if (updatedHolders[playerWallet.address]) {
            updatedHolders[playerWallet.address].balance = 0;
        }

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
          coinHolders: updatedHolders
        });
      },

      updateMarket: () => {
        const { activeCoin, priceHistory, coinHolders } = get();
        if (!activeCoin || activeCoin.isRugPulled) return;

        const now = Date.now();

        let newReserveToken = activeCoin.reserveToken;
        let newReserveCurrency = activeCoin.reserveCurrency;
        let newHype = activeCoin.hype;
        let volume = 0;
        const updatedHolders = { ...coinHolders };

        // Helper to pick a random non-player, non-LP bot
        const botAddresses = Object.keys(updatedHolders).filter(addr =>
            !updatedHolders[addr].isPlayer && addr !== 'liquidity_pool'
        );

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

        let botTokensGained = 0;
        let botTokensLost = 0;

        if (isBuy) {
            // Bot Buys (Adds currency, removes token)
            const dy = newReserveCurrency * tradePct; // Currency spent
            const newY = newReserveCurrency + dy;
            const newX = k / newY;
            const tokensReceived = newReserveToken - newX;

            newReserveCurrency = newY;
            newReserveToken = newX;
            volume += dy;
            botTokensGained += tokensReceived;
        } else {
            // Bot Sells (Adds token, removes currency)
            const dx = newReserveToken * tradePct; // Tokens sold
            const newX = newReserveToken + dx;
            const newY = k / newX;
            const dy = newReserveCurrency - newY; // Currency received

            newReserveToken = newX;
            newReserveCurrency = newY;
            volume += dy;
            botTokensLost += dx;
        }

        // Random Whale Action (1% chance)
        if (Math.random() < 0.01) {
            const whaleAction = Math.random() < 0.5 ? 'buy' : 'sell';
            const whaleTradePct = Math.random() * 0.1 + 0.05; // 5% to 15% of pool
            if (whaleAction === 'buy') {
                const dy = newReserveCurrency * whaleTradePct;
                const newY = newReserveCurrency + dy;
                const newX = k / newY;
                const tokensReceived = newReserveToken - newX;
                newReserveCurrency = newY;
                newReserveToken = newX;
                volume += dy;
                botTokensGained += tokensReceived;
            } else {
                const dx = newReserveToken * whaleTradePct;
                const newX = newReserveToken + dx;
                const newY = k / newX;
                newReserveToken = newX;
                newReserveCurrency = newY;
                volume += (newReserveCurrency - newY); // approx
                botTokensLost += dx;
            }
        }

        // Distribute token changes to random bots
        if (botAddresses.length > 0) {
            if (botTokensGained > 0) {
                const buyerAddr = botAddresses[Math.floor(Math.random() * botAddresses.length)];
                updatedHolders[buyerAddr].balance += botTokensGained;
            }
            if (botTokensLost > 0) {
                // Find a bot that has enough to sell, or just deduct from random
                const sellers = botAddresses.filter(addr => updatedHolders[addr].balance >= botTokensLost);
                const sellerAddr = sellers.length > 0
                    ? sellers[Math.floor(Math.random() * sellers.length)]
                    : botAddresses[Math.floor(Math.random() * botAddresses.length)];

                // If they don't have enough to sell the full amount, they sell what they have and we assume a new bot steps in for the rest (simplification)
                updatedHolders[sellerAddr].balance = Math.max(0, updatedHolders[sellerAddr].balance - botTokensLost);
            }
        }

        // Update LP Balance
        if (updatedHolders['liquidity_pool']) {
            updatedHolders['liquidity_pool'].balance = newReserveToken;
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
            priceHistory: updatedHistory,
            coinHolders: updatedHolders
        });
      },

      resetGame: () => {
        set({
          playerMoney: INITIAL_MONEY,
          activeCoin: null,
          priceHistory: [],
          currency: 'USD',
          coinHolders: {},
          playerWallet: null
        });
      }
    }),
    {
      name: 'meme-tycoon-storage',
    }
  )
);
