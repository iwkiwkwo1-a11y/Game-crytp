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
      xp: 0,
      upgrades: {
        botFarm: 0,
        smoothTalker: 0,
        hypeAura: 0
      },
      coins: {},
      activeCoinId: null,
      priceHistory: {},
      coinHolders: {},
      chartTimeframe: '1s',
      socialPosts: {},
      newsAlert: null,
      toasts: [],

      setCurrency: (currency) => set({ currency }),

      addToast: (title, message, type = 'info') => {
          const { toasts } = get();
          const newToast = { id: Date.now().toString() + Math.random(), title, message, type, timestamp: Date.now() };
          // Keep only last 5 toasts
          set({ toasts: [...toasts, newToast].slice(-5) });
      },

      removeToast: (id) => {
          const { toasts } = get();
          set({ toasts: toasts.filter(t => t.id !== id) });
      },

      gainXp: (amount) => {
          const { xp } = get();
          set({ xp: xp + amount });
      },

      setTimeframe: (chartTimeframe) => set({ chartTimeframe }),

      setActiveCoinId: (id) => set({ activeCoinId: id }),

      buyUpgrade: (key, cost) => {
          const { xp, upgrades } = get();
          if (xp >= cost && upgrades[key] < 5) {
              set({
                  xp: xp - cost,
                  upgrades: { ...upgrades, [key]: upgrades[key] + 1 }
              });
          }
      },

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
          listingLevel: 0,
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
          socialPosts: { ...socialPosts, [coinId]: [] },
          xp: get().xp + 50 // Gain XP for deploying
        });
      },

      createPost: (coinId, content) => {
         const { coins, socialPosts, followers, upgrades } = get();
         const coin = coins[coinId];
         if (!coin || coin.isRugPulled) return;

         // Calculate likes based on followers and hype, boosted by botFarm upgrade
         const baseLikes = Math.floor(followers * (Math.random() * 0.5 + 0.1) + coin.hype * 2);
         const botFarmMultiplier = 1 + (upgrades.botFarm * 0.5); // +50% likes per level
         const likes = Math.floor(baseLikes * botFarmMultiplier);

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

      fastTrackList: (coinId, tier) => {
        const { coins, playerMoney, followers } = get();
        const coin = coins[coinId];
        if (!coin || coin.isRugPulled || coin.listingLevel >= tier) return;

        let cost = 0;
        let followerReq = 0;
        let followerGain = 0;
        let hypeGain = 0;

        if (tier === 1) { // Tier 3 CEX
            cost = 5000;
            followerReq = 0;
            followerGain = 5000;
            hypeGain = 30;
        } else if (tier === 2) { // Tier 2 CEX
            cost = 25000;
            followerReq = 10000;
            followerGain = 20000;
            hypeGain = 60;
        } else if (tier === 3) { // Tier 1 CEX (Binance)
            cost = 100000;
            followerReq = 50000;
            followerGain = 100000;
            hypeGain = 100;
        }

        if (playerMoney < cost || followers < followerReq) return;

        set({
          playerMoney: playerMoney - cost,
          followers: followers + followerGain,
          coins: {
            ...coins,
            [coinId]: {
               ...coin,
               listingLevel: tier,
               hype: Math.min(100, coin.hype + hypeGain)
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

      buyCoin: (coinId, usdAmount) => {
          const { coins, coinHolders, playerWallet, playerMoney, xp } = get();
          const coin = coins[coinId];
          if (!coin || coin.isRugPulled || !playerWallet || playerMoney < usdAmount || usdAmount <= 0) return;

          const updatedHolders = { ...coinHolders[coinId] };
          if (!updatedHolders[playerWallet.address]) {
              updatedHolders[playerWallet.address] = {
                  address: playerWallet.address,
                  name: playerWallet.username + (coin.ownerAddress === playerWallet.address ? ' (Dev)' : ''),
                  balance: 0,
                  isPlayer: true
              };
          }

          // AMM logic
          const k = coin.reserveToken * coin.reserveCurrency;
          let dy = usdAmount;
          let taxToDev = 0;

          if (coin.taxRate > 0) {
              taxToDev = dy * (coin.taxRate / 100);
              dy = dy - taxToDev;
          }

          const newY = coin.reserveCurrency + dy;
          const newX = k / newY;
          const tokensReceived = coin.reserveToken - newX;

          updatedHolders[playerWallet.address].balance += tokensReceived;
          if (updatedHolders['liquidity_pool']) {
              updatedHolders['liquidity_pool'].balance = newX;
          }

          // If the player is the dev, they receive their own tax back
          const isDev = coin.ownerAddress === playerWallet.address;
          const finalPlayerMoney = playerMoney - usdAmount + (isDev ? taxToDev : 0);

          set({
              playerMoney: finalPlayerMoney,
              coins: {
                  ...coins,
                  [coinId]: {
                      ...coin,
                      reserveCurrency: newY,
                      reserveToken: newX,
                      hype: Math.min(100, coin.hype + 5) // Buying manually adds hype
                  }
              },
              coinHolders: { ...coinHolders, [coinId]: updatedHolders },
              xp: xp + Math.floor(usdAmount / 100) // Gain 1 XP per $100 traded
          });
      },

      sellCoin: (coinId, tokenAmount) => {
          const { coins, coinHolders, playerWallet, playerMoney } = get();
          const coin = coins[coinId];
          if (!coin || coin.isRugPulled || !playerWallet || tokenAmount <= 0) return;

          const updatedHolders = { ...coinHolders[coinId] };
          const playerBalance = updatedHolders[playerWallet.address]?.balance || 0;
          if (playerBalance < tokenAmount) return;

          // AMM logic
          const k = coin.reserveToken * coin.reserveCurrency;
          const dx = tokenAmount;

          const newX = coin.reserveToken + dx;
          const newY = k / newX;
          let dy = coin.reserveCurrency - newY;
          let taxToDev = 0;

          if (coin.taxRate > 0) {
              taxToDev = dy * (coin.taxRate / 100);
              dy = dy - taxToDev;
          }

          updatedHolders[playerWallet.address].balance -= tokenAmount;
          if (updatedHolders['liquidity_pool']) {
              updatedHolders['liquidity_pool'].balance = newX;
          }

          const isDev = coin.ownerAddress === playerWallet.address;
          const finalPlayerMoney = playerMoney + dy + (isDev ? taxToDev : 0);

          set({
              playerMoney: finalPlayerMoney,
              coins: {
                  ...coins,
                  [coinId]: {
                      ...coin,
                      reserveCurrency: newY,
                      reserveToken: newX,
                      hype: Math.max(1, coin.hype - 2) // Selling drops hype
                  }
              },
              coinHolders: { ...coinHolders, [coinId]: updatedHolders }
          });
      },

      updateMarket: () => {
        const { coins, priceHistory, coinHolders, playerWallet, playerMoney, newsAlert, followers, upgrades } = get();

        const now = Date.now();

        let newNewsAlert = newsAlert;
        let newFollowers = followers;
        let newPlayerMoney = playerMoney;
        const newCoins = { ...coins };
        const newPriceHistory = { ...priceHistory };
        const newCoinHolders = { ...coinHolders };

        // --- BOT COIN GENERATOR ---
        // 1% chance per tick to generate a random bot coin to compete in DexTrending
        // Limit to 20 total coins to avoid performance degradation
        if (Math.random() < 0.01 && Object.keys(newCoins).length < 20) {
            const prefix = ['Pepe', 'Doge', 'Shib', 'Floki', 'Cat', 'Moon', 'Safe', 'Based', 'Chad', 'Wif'];
            const suffix = ['Rocket', 'Inu', 'CEO', 'Hat', 'AI', 'GPT', 'Degen', 'Moon', 'Mars', 'Safe'];
            const randomName = `${prefix[Math.floor(Math.random() * prefix.length)]} ${suffix[Math.floor(Math.random() * suffix.length)]}`;
            const randomSymbol = randomName.substring(0, 4).toUpperCase().replace(' ', '');
            const botSupply = 1000000000;
            const botLiquidity = Math.floor(Math.random() * 5000) + 500;
            const botPrice = botLiquidity / botSupply;

            const botCoinId = `bot_${Date.now()}_${Math.random()}`;
            const botAddr = generateFakeAddress();

            newCoins[botCoinId] = {
                id: botCoinId,
                name: randomName,
                symbol: randomSymbol,
                totalSupply: botSupply,
                circulatingSupply: botSupply,
                reserveToken: botSupply,
                reserveCurrency: botLiquidity,
                hype: Math.floor(Math.random() * 20) + 5, // Start with some initial hype
                createdAt: now,
                isRugPulled: false,
                developerTokens: 0,
                ath: botPrice,
                atl: botPrice,
                taxRate: Math.floor(Math.random() * 10), // Random tax 0-9%
                liquidityLocked: Math.random() > 0.5,
                antiSniper: false,
                isListedCMC: false,
                ownerAddress: botAddr
            };

            newPriceHistory[botCoinId] = [{
                time: now,
                open: botPrice,
                high: botPrice,
                low: botPrice,
                close: botPrice,
                volume: 0
            }];

            newCoinHolders[botCoinId] = {
                'liquidity_pool': {
                    address: '0x000000000000000000000000000000000000dead',
                    name: 'Liquidity Pool',
                    balance: botSupply,
                    isPlayer: false
                }
            };

            // Add a global toast for new trending coin
            const { toasts } = get();
            const newToast = {
                id: Date.now().toString(),
                title: 'New Token Launched!',
                message: `${randomName} ($${randomSymbol}) was just deployed.`,
                type: 'info' as const,
                timestamp: Date.now()
            };
            set({ toasts: [...toasts, newToast].slice(-5) });
        }

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
            let decayRate = coin.liquidityLocked ? 0.2 : 0.5;

            // Player Upgrade: Hype Aura reduces decay on player-owned coins
            if (coin.ownerAddress === playerWallet?.address) {
                decayRate -= (upgrades.hypeAura * 0.05); // Up to -0.25 decay reduction
                decayRate = Math.max(0.05, decayRate); // floor it so it still decays slightly
            }

            newHype = Math.max(1, newHype - decayRate);

            const activityLevel = Math.max(0.01, newHype / 100);

            // Determine if buy or sell pressure is higher
            const trustBonus = coin.liquidityLocked ? 0.1 : 0;

            // Listing Tier bonuses (0.05, 0.10, 0.15)
            const listedBonus = coin.listingLevel * 0.05;

            const buyProbability = 0.2 + (newHype / 200) + trustBonus + listedBonus;

            const isBuy = Math.random() < buyProbability;
            const volatility = Math.random() > 0.8 ? (Math.random() * 0.15 + 0.05) : (Math.random() * 0.02 + 0.005);
            const tradePct = volatility * activityLevel;

            let botTokensGained = 0;
            let botTokensLost = 0;
            let taxCollected = 0;

            // Anti-sniper tax (99%) if within 10s of creation
            const isAntiSniperActive = coin.antiSniper && (now - coin.createdAt < 10000);

            // Player Upgrade: Smooth Talker reduces perceived tax rate so bots buy more often despite tax
            // Doesn't apply to anti-sniper. It effectively reduces the true tax collected slightly,
            // OR we can just say it reduces the negative psychological impact on buyProbability.
            // Let's just use it to artificially lower the tax rate applied to bot buys.
            let currentTaxRate = coin.taxRate;
            if (!isAntiSniperActive && coin.ownerAddress === playerWallet?.address && upgrades.smoothTalker > 0 && currentTaxRate > 0) {
                 // For example, 10% tax. Smooth talker lv 5 makes bots only pay 5% tax.
                 // (Less tax for player, but bots get more tokens -> less selling pressure later)
                 currentTaxRate = Math.max(0, currentTaxRate - upgrades.smoothTalker);
            }
            if (isAntiSniperActive) currentTaxRate = 99;

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

                    if (dy > 200) {
                        const { toasts } = get();
                        const newToast = {
                            id: Date.now().toString() + Math.random(),
                            title: 'Whale Alert!',
                            message: `Massive BUY of $${dy.toFixed(0)} on ${coin.symbol}!`,
                            type: 'success' as const,
                            timestamp: Date.now()
                        };
                        set({ toasts: [...toasts, newToast].slice(-5) });
                    }
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

                    if (dy > 200) {
                        const { toasts } = get();
                        const newToast = {
                            id: Date.now().toString() + Math.random(),
                            title: 'Whale Dump!',
                            message: `Massive SELL of $${dy.toFixed(0)} on ${coin.symbol}!`,
                            type: 'error' as const,
                            timestamp: Date.now()
                        };
                        set({ toasts: [...toasts, newToast].slice(-5) });
                    }
                }
            }

            // Tax to developer wallet (only if player owns the coin)
            if (taxCollected > 0 && coin.ownerAddress === playerWallet?.address) {
                newPlayerMoney += taxCollected;

                // Add toast for tax revenue occasionally if it's large enough to avoid spam
                if (taxCollected > 10) {
                    const { toasts } = get();
                    const newToast = {
                        id: Date.now().toString() + Math.random(),
                        title: 'Tax Collected!',
                        message: `You earned $${taxCollected.toFixed(2)} from ${coin.symbol} trades.`,
                        type: 'success' as const,
                        timestamp: Date.now()
                    };
                    set({ toasts: [...toasts, newToast].slice(-5) });
                }
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
