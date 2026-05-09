import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Coin, PricePoint, Holder, SocialPost } from '../types/game';

const INITIAL_MONEY = 1000;

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
      followers: 0,
      activeCoin: null,
      priceHistory: [],
      coinHolders: {},
      chartTimeframe: '1s',
      socialPosts: [],
      newsAlert: null,

      setCurrency: (currency) => set({ currency }),

      setTimeframe: (chartTimeframe) => set({ chartTimeframe }),

      createWallet: (username: string) => {
        set({
          playerWallet: {
            username,
            address: generateFakeAddress()
          }
        });
      },

      deployCoin: (name, symbol, supply, initialLiquidity, taxRate, locked) => {
        const { playerMoney, playerWallet } = get();
        if (playerMoney < initialLiquidity || !playerWallet) return;

        // Player puts in initialLiquidity, and all supply into the pool initially
        const devTokens = supply * 0.1;
        const poolTokens = supply * 0.9;

        const initialPrice = initialLiquidity / poolTokens;

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
          ath: initialPrice,
          atl: initialPrice,
          taxRate,
          liquidityLocked: locked
        };

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
          coinHolders: holders,
          socialPosts: [],
          newsAlert: null
        });
      },

      createPost: (content) => {
         const { activeCoin, socialPosts, followers } = get();
         if (!activeCoin || activeCoin.isRugPulled) return;

         // Calculate likes based on followers and hype
         const likes = Math.floor(followers * (Math.random() * 0.5 + 0.1) + activeCoin.hype * 2);

         const newPost: SocialPost = {
             id: Date.now().toString(),
             time: Date.now(),
             content,
             likes
         };

         // Posting boosts hype slightly and gains followers
         set({
             socialPosts: [newPost, ...socialPosts],
             followers: followers + Math.floor(Math.random() * 50 + 10),
             activeCoin: {
                 ...activeCoin,
                 hype: Math.min(100, activeCoin.hype + 5 + (likes / 100))
             }
         });
      },

      clearNews: () => set({ newsAlert: null }),

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
        if (!activeCoin || activeCoin.isRugPulled || !playerWallet || activeCoin.liquidityLocked) return;

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
        const { activeCoin, priceHistory, coinHolders, playerMoney, newsAlert, followers } = get();
        if (!activeCoin || activeCoin.isRugPulled) return;

        const now = Date.now();

        let newReserveToken = activeCoin.reserveToken;
        let newReserveCurrency = activeCoin.reserveCurrency;
        let newHype = activeCoin.hype;
        let volume = 0;
        let newNewsAlert = newsAlert;
        let newFollowers = followers;
        let newPlayerMoney = playerMoney;
        const updatedHolders = { ...coinHolders };

        // Helper to pick a random non-player, non-LP bot
        const botAddresses = Object.keys(updatedHolders).filter(addr =>
            !updatedHolders[addr].isPlayer && addr !== 'liquidity_pool'
        );

        // --- RANDOM NEWS EVENTS (FOMO / FUD) ---
        // 0.5% chance per tick to generate news if no active news
        if (!newNewsAlert && Math.random() < 0.005) {
            const events = [
                { text: "Elon tweeted a picture of a dog! Massive FOMO incoming!", effect: "pump" },
                { text: "Top Tier CEX rumored to list your token!", effect: "pump" },
                { text: "Viral TikTok video mentions your coin!", effect: "pump" },
                { text: "SEC Chairman looks angry on TV. Market panics!", effect: "dump" },
                { text: "A massive whale moved tokens to a fresh wallet. FUD spreads.", effect: "dump" },
                { text: "China bans crypto... again. Minor panic.", effect: "dump" },
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            newNewsAlert = event.text;
            if (event.effect === 'pump') {
                newHype = Math.min(100, newHype + 30);
                newFollowers += Math.floor(Math.random() * 500);
            } else {
                newHype = Math.max(1, newHype - 30);
                newFollowers = Math.max(0, newFollowers - Math.floor(Math.random() * 200));
            }
        }

        // --- BOT SIMULATION ---
        // Constant product: k = reserveToken * reserveCurrency
        const k = newReserveToken * newReserveCurrency;

        // Hype decay (slower decay if locked liquidity)
        const decayRate = activeCoin.liquidityLocked ? 0.2 : 0.5;
        newHype = Math.max(1, newHype - decayRate); // Decay per tick

        // Base market activity on hype
        const activityLevel = Math.max(0.01, newHype / 100);

        // Determine if buy or sell pressure is higher
        // Locked liquidity gives base trust (+10% buy probability)
        const trustBonus = activeCoin.liquidityLocked ? 0.1 : 0;
        const buyProbability = 0.2 + (newHype / 200) + trustBonus; // ranges from ~0.2 to ~0.8

        const isBuy = Math.random() < buyProbability;

        // Volatility multiplier to make charts less "straight"
        // Sometimes trades are small, sometimes large panic buys/sells
        const volatility = Math.random() > 0.8 ? (Math.random() * 0.15 + 0.05) : (Math.random() * 0.02 + 0.005);
        const tradePct = volatility * activityLevel;

        let botTokensGained = 0;
        let botTokensLost = 0;
        let taxCollected = 0;

        if (isBuy) {
            // Bot Buys (Adds currency, removes token)
            let dy = newReserveCurrency * tradePct; // Currency spent by bot

            // Tax application (Tax on buys means less tokens received by bot, tax value goes to dev in USD)
            if (activeCoin.taxRate > 0) {
                const taxValue = dy * (activeCoin.taxRate / 100);
                taxCollected += taxValue;
                dy = dy - taxValue; // Only remaining goes to pool
            }

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
            let dy = newReserveCurrency - newY; // Currency received by bot

            // Tax application on sells (Bot gets less USD, dev gets USD tax)
            if (activeCoin.taxRate > 0) {
                const taxValue = dy * (activeCoin.taxRate / 100);
                taxCollected += taxValue;
                dy = dy - taxValue;
            }

            newReserveToken = newX;
            newReserveCurrency = newY;
            volume += dy;
            botTokensLost += dx;
        }

        // Random Whale Action (More aggressive now, 2% chance)
        if (Math.random() < 0.02) {
            const whaleAction = Math.random() < buyProbability ? 'buy' : 'sell';
            const whaleTradePct = Math.random() * 0.2 + 0.05; // 5% to 25% of pool
            if (whaleAction === 'buy') {
                let dy = newReserveCurrency * whaleTradePct;
                if (activeCoin.taxRate > 0) {
                    const taxValue = dy * (activeCoin.taxRate / 100);
                    taxCollected += taxValue;
                    dy = dy - taxValue;
                }
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
                let dy = newReserveCurrency - newY;
                if (activeCoin.taxRate > 0) {
                    const taxValue = dy * (activeCoin.taxRate / 100);
                    taxCollected += taxValue;
                    dy = dy - taxValue;
                }
                newReserveToken = newX;
                newReserveCurrency = newY;
                volume += dy;
                botTokensLost += dx;
            }
        }

        // Add collected tax to player's money
        if (taxCollected > 0) {
            newPlayerMoney += taxCollected;
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

        // Update ATH / ATL
        const newAth = Math.max(activeCoin.ath, newPrice);
        const newAtl = Math.min(activeCoin.atl, newPrice);

        // Update Price History (Always record 1s tick data)
        const lastPoint = priceHistory[priceHistory.length - 1];
        let updatedHistory = [...priceHistory];

        // Push a new point every update (which is ~1s)
        updatedHistory.push({
            time: now,
            open: lastPoint.close,
            high: Math.max(lastPoint.close, newPrice),
            low: Math.min(lastPoint.close, newPrice),
            close: newPrice,
            volume: volume
        });

        // Keep up to 600 points (10 minutes of 1s ticks) to allow for 1m aggregation views
        if (updatedHistory.length > 600) {
            updatedHistory = updatedHistory.slice(-600);
        }

        set({
            activeCoin: {
                ...activeCoin,
                reserveToken: newReserveToken,
                reserveCurrency: newReserveCurrency,
                hype: newHype,
                ath: newAth,
                atl: newAtl
            },
            priceHistory: updatedHistory,
            coinHolders: updatedHolders,
            playerMoney: newPlayerMoney,
            newsAlert: newNewsAlert,
            followers: newFollowers
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
