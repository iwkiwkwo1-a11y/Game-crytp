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
      coins: {},
      activeCoinId: null,
      priceHistory: {},
      coinHolders: {},
      chartTimeframe: '1s',
      socialPosts: {},
      newsAlert: null,

      setCurrency: (currency) => set({ currency }),

      setTimeframe: (chartTimeframe) => set({ chartTimeframe }),

      setActiveCoinId: (id) => set({ activeCoinId: id }),

      createWallet: (username: string) => {
        set({
          playerWallet: {
            username,
            address: generateFakeAddress()
          }
        });
      },

      deployCoin: (name, symbol, supply, initialLiquidity, taxRate, locked, antiSniper) => {
        const { playerMoney, playerWallet, coins, priceHistory, coinHolders, socialPosts } = get();
        if (playerMoney < initialLiquidity || !playerWallet) return;

        // Player puts in initialLiquidity, and all supply into the pool initially
        const devTokens = supply * 0.1;
        const poolTokens = supply * 0.9;

        const initialPrice = initialLiquidity / poolTokens;

        const coinId = Date.now().toString();

        const newCoin: Coin = {
          id: coinId,
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
          liquidityLocked: locked,
          antiSniper,
          isListedCMC: false,
          ownerAddress: playerWallet.address
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
          coins: { ...coins, [coinId]: newCoin },
          activeCoinId: coinId,
          priceHistory: { ...priceHistory, [coinId]: [initialPricePoint] },
          coinHolders: { ...coinHolders, [coinId]: holders },
          socialPosts: { ...socialPosts, [coinId]: [] }
        });
      },

      createPost: (coinId, content) => {
         const { coins, socialPosts, followers } = get();
         const coin = coins[coinId];
         if (!coin || coin.isRugPulled) return;

         // Calculate likes based on followers and hype
         const likes = Math.floor(followers * (Math.random() * 0.5 + 0.1) + coin.hype * 2);

         const newPost: SocialPost = {
             id: Date.now().toString(),
             time: Date.now(),
             content,
             likes
         };

         // Posting boosts hype slightly and gains followers
         set({
             socialPosts: { ...socialPosts, [coinId]: [newPost, ...(socialPosts[coinId] || [])] },
             followers: followers + Math.floor(Math.random() * 50 + 10),
             coins: {
                 ...coins,
                 [coinId]: { ...coin, hype: Math.min(100, coin.hype + 5 + (likes / 100)) }
             }
         });
      },

      clearNews: () => set({ newsAlert: null }),

      burnTokens: (coinId, amount) => {
        const { coins, coinHolders, playerWallet } = get();
        const coin = coins[coinId];
        if (!coin || coin.isRugPulled || !playerWallet) return;
        if (coin.developerTokens < amount) return;

        const updatedHolders = { ...coinHolders[coinId] };
        if (updatedHolders[playerWallet.address]) {
            updatedHolders[playerWallet.address].balance -= amount;
        }

        set({
          coins: {
            ...coins,
            [coinId]: {
              ...coin,
              developerTokens: coin.developerTokens - amount,
              totalSupply: coin.totalSupply - amount,
              circulatingSupply: coin.circulatingSupply - amount,
            }
          },
          coinHolders: { ...coinHolders, [coinId]: updatedHolders }
        });
      },

      rugPull: (coinId) => {
        const { coins, playerMoney, coinHolders, playerWallet } = get();
        const coin = coins[coinId];
        if (!coin || coin.isRugPulled || !playerWallet || coin.liquidityLocked) return;

        // Sell all dev tokens
        const x = coin.reserveToken;
        const y = coin.reserveCurrency;
        const dx = coin.developerTokens;

        // Fee = 0 for dev selling
        const dy = y - (x * y) / (x + dx);

        const updatedHolders = { ...coinHolders[coinId] };
        if (updatedHolders[playerWallet.address]) {
            updatedHolders[playerWallet.address].balance = 0;
        }

        set({
          playerMoney: playerMoney + dy,
          coins: {
            ...coins,
            [coinId]: {
              ...coin,
              isRugPulled: true,
              developerTokens: 0,
              reserveToken: x + dx,
              reserveCurrency: y - dy,
              hype: 0,
            }
          },
          coinHolders: { ...coinHolders, [coinId]: updatedHolders }
        });
      },

      fastTrackList: (coinId) => {
        const { coins, playerMoney, followers } = get();
        const coin = coins[coinId];
        if (!coin || coin.isRugPulled || coin.isListedCMC || playerMoney < 500) return;

        set({
          playerMoney: playerMoney - 500,
          followers: followers + 5000,
          coins: {
            ...coins,
            [coinId]: {
               ...coin,
               isListedCMC: true,
               hype: Math.min(100, coin.hype + 40)
            }
          }
        });
      },

      startAirdrop: (coinId, amount) => {
         const { coins, coinHolders, playerWallet } = get();
         const coin = coins[coinId];
         if (!coin || coin.isRugPulled || !playerWallet) return;
         if (coin.developerTokens < amount) return;

         // Deduct from dev, add to airdrop pool
         const updatedHolders = { ...coinHolders[coinId] };
         if (updatedHolders[playerWallet.address]) {
             updatedHolders[playerWallet.address].balance -= amount;
         }

         set({
            coins: {
               ...coins,
               [coinId]: {
                  ...coin,
                  developerTokens: coin.developerTokens - amount,
                  airdropActive: true,
                  airdropRemaining: amount
               }
            },
            coinHolders: { ...coinHolders, [coinId]: updatedHolders }
         });
      },

      updateMarket: () => {
        const { coins, priceHistory, coinHolders, playerWallet, playerMoney, newsAlert, followers } = get();

        const now = Date.now();

        let newNewsAlert = newsAlert;
        let newFollowers = followers;
        let newPlayerMoney = playerMoney;
        const newCoins = { ...coins };
        const newPriceHistory = { ...priceHistory };
        const newCoinHolders = { ...coinHolders };

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
                newFollowers += Math.floor(Math.random() * 500);
            } else {
                newFollowers = Math.max(0, newFollowers - Math.floor(Math.random() * 200));
            }
        }

        // Loop through all active coins
        for (const coinId in newCoins) {
            const coin = newCoins[coinId];
            if (coin.isRugPulled) continue;

            let newReserveToken = coin.reserveToken;
            let newReserveCurrency = coin.reserveCurrency;
            let newHype = coin.hype;
            let volume = 0;
            const updatedHolders = { ...newCoinHolders[coinId] };

            // Apply news effect to hype if any
            if (!newsAlert && newNewsAlert) {
                // Determine if pump or dump roughly based on followers change logic above
                if (newFollowers > followers) {
                    newHype = Math.min(100, newHype + 30);
                } else {
                    newHype = Math.max(1, newHype - 30);
                }
            }

            const botAddresses = Object.keys(updatedHolders).filter(addr =>
                !updatedHolders[addr].isPlayer && addr !== 'liquidity_pool'
            );

            // --- AIRDROP PROCESSING ---
            if (coin.airdropActive && coin.airdropRemaining && coin.airdropRemaining > 0) {
                const airdropAmount = Math.min(coin.airdropRemaining, coin.totalSupply * 0.005); // drop 0.5% max per tick
                coin.airdropRemaining -= airdropAmount;

                // Give it to a random bot or create a new one
                if (Math.random() > 0.5 && botAddresses.length > 0) {
                    const recipient = botAddresses[Math.floor(Math.random() * botAddresses.length)];
                    updatedHolders[recipient].balance += airdropAmount;
                } else {
                    const newBotAddr = generateFakeAddress();
                    updatedHolders[newBotAddr] = {
                        address: newBotAddr,
                        name: `Airdrop_Hunter_${Math.floor(Math.random()*1000)}`,
                        balance: airdropAmount,
                        isPlayer: false
                    };
                }

                // Airdrop boosts hype massively
                newHype = Math.min(100, newHype + 5);

                if (coin.airdropRemaining <= 0) {
                    coin.airdropActive = false;
                }
            }

            // --- BOT SIMULATION ---
            const k = newReserveToken * newReserveCurrency;

            // Hype decay
            const decayRate = coin.liquidityLocked ? 0.2 : 0.5;
            newHype = Math.max(1, newHype - decayRate);

            const activityLevel = Math.max(0.01, newHype / 100);

            // Determine if buy or sell pressure is higher
            const trustBonus = coin.liquidityLocked ? 0.1 : 0;
            const listedBonus = coin.isListedCMC ? 0.15 : 0;
            const buyProbability = 0.2 + (newHype / 200) + trustBonus + listedBonus;

            const isBuy = Math.random() < buyProbability;
            const volatility = Math.random() > 0.8 ? (Math.random() * 0.15 + 0.05) : (Math.random() * 0.02 + 0.005);
            const tradePct = volatility * activityLevel;

            let botTokensGained = 0;
            let botTokensLost = 0;
            let taxCollected = 0;

            // Anti-sniper tax (99%) if within 10s of creation
            const isAntiSniperActive = coin.antiSniper && (now - coin.createdAt < 10000);
            const currentTaxRate = isAntiSniperActive ? 99 : coin.taxRate;

            if (isBuy) {
                let dy = newReserveCurrency * tradePct;
                if (currentTaxRate > 0) {
                    const taxValue = dy * (currentTaxRate / 100);
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
                const dx = newReserveToken * tradePct;
                const newX = newReserveToken + dx;
                const newY = k / newX;
                let dy = newReserveCurrency - newY;
                if (currentTaxRate > 0) {
                    const taxValue = dy * (currentTaxRate / 100);
                    taxCollected += taxValue;
                    dy = dy - taxValue;
                }
                newReserveToken = newX;
                newReserveCurrency = newY;
                volume += dy;
                botTokensLost += dx;
            }

            if (Math.random() < 0.02) {
                const whaleAction = Math.random() < buyProbability ? 'buy' : 'sell';
                const whaleTradePct = Math.random() * 0.2 + 0.05;
                if (whaleAction === 'buy') {
                    let dy = newReserveCurrency * whaleTradePct;
                    if (currentTaxRate > 0) {
                        const taxValue = dy * (currentTaxRate / 100);
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
                    if (currentTaxRate > 0) {
                        const taxValue = dy * (currentTaxRate / 100);
                        taxCollected += taxValue;
                        dy = dy - taxValue;
                    }
                    newReserveToken = newX;
                    newReserveCurrency = newY;
                    volume += dy;
                    botTokensLost += dx;
                }
            }

            // Tax to developer wallet (only if player owns the coin)
            if (taxCollected > 0 && coin.ownerAddress === playerWallet?.address) {
                newPlayerMoney += taxCollected;
            }

            if (botAddresses.length > 0) {
                if (botTokensGained > 0) {
                    const buyerAddr = botAddresses[Math.floor(Math.random() * botAddresses.length)];
                    updatedHolders[buyerAddr].balance += botTokensGained;
                }
                if (botTokensLost > 0) {
                    const sellers = botAddresses.filter(addr => updatedHolders[addr].balance >= botTokensLost);
                    const sellerAddr = sellers.length > 0
                        ? sellers[Math.floor(Math.random() * sellers.length)]
                        : botAddresses[Math.floor(Math.random() * botAddresses.length)];
                    updatedHolders[sellerAddr].balance = Math.max(0, updatedHolders[sellerAddr].balance - botTokensLost);
                }
            }

            if (updatedHolders['liquidity_pool']) {
                updatedHolders['liquidity_pool'].balance = newReserveToken;
            }

            const newPrice = newReserveCurrency / newReserveToken;
            const newAth = Math.max(coin.ath, newPrice);
            const newAtl = Math.min(coin.atl, newPrice);

            const coinHistory = newPriceHistory[coinId] || [];
            const lastPoint = coinHistory.length > 0 ? coinHistory[coinHistory.length - 1] : { close: newPrice, time: now, high: newPrice, low: newPrice, open: newPrice, volume: 0 };

            let updatedHistory = [...coinHistory];
            updatedHistory.push({
                time: now,
                open: lastPoint.close,
                high: Math.max(lastPoint.close, newPrice),
                low: Math.min(lastPoint.close, newPrice),
                close: newPrice,
                volume: volume
            });

            if (updatedHistory.length > 600) {
                updatedHistory = updatedHistory.slice(-600);
            }

            // Save back to local vars
            newCoins[coinId] = {
                ...coin,
                reserveToken: newReserveToken,
                reserveCurrency: newReserveCurrency,
                hype: newHype,
                ath: newAth,
                atl: newAtl
            };
            newPriceHistory[coinId] = updatedHistory;
            newCoinHolders[coinId] = updatedHolders;
        }

        set({
            coins: newCoins,
            priceHistory: newPriceHistory,
            coinHolders: newCoinHolders,
            playerMoney: newPlayerMoney,
            newsAlert: newNewsAlert,
            followers: newFollowers
        });
      },

      resetGame: () => {
        set({
          playerMoney: INITIAL_MONEY,
          playerWallet: null,
          currency: 'USD',
          followers: 0,
          coins: {},
          activeCoinId: null,
          priceHistory: {},
          coinHolders: {},
          socialPosts: {},
          newsAlert: null
        });
      }
    }),
    {
      name: 'meme-tycoon-storage',
    }
  )
);
