export type Currency = 'USD' | 'IDR';

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Holder {
  address: string;
  name: string;
  balance: number; // Token balance
  isPlayer: boolean;
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  circulatingSupply: number;
  reserveToken: number; // Token di Liquidity Pool
  reserveCurrency: number; // Uang di Liquidity Pool
  hype: number; // 0 - 100
  createdAt: number;
  isRugPulled: boolean;
  developerTokens: number; // Token yang dipegang pemain
  ath: number; // All Time High (USD)
  atl: number; // All Time Low (USD)
  taxRate: number; // Tax percentage (e.g., 5 means 5%)
  liquidityLocked: boolean; // Cannot rug pull if true
  antiSniper: boolean; // 99% tax for first 10 seconds
  listingLevel: number; // 0 = DEX, 1 = Tier 3, 2 = Tier 2, 3 = Tier 1
  ownerAddress: string; // To differentiate player coins from bot coins
  airdropActive?: boolean;
  airdropRemaining?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}

export interface SocialPost {
  id: string;
  time: number;
  content: string;
  likes: number;
}

export type Timeframe = '1s' | '10s' | '1m';

export interface PlayerWallet {
  address: string;
  username: string;
}

export interface PlayerUpgrades {
  botFarm: number; // Boosts social media likes (Lv 0-5)
  smoothTalker: number; // Reduces negative impact of tax on bot buys (Lv 0-5)
  hypeAura: number; // Reduces hype decay per tick (Lv 0-5)
}

export interface GameState {
  // Player State
  playerMoney: number;
  playerWallet: PlayerWallet | null;
  currency: Currency;
  followers: number;
  xp: number;
  upgrades: PlayerUpgrades;

  // Game State
  coins: Record<string, Coin>;
  activeCoinId: string | null;
  priceHistory: Record<string, PricePoint[]>; // Always stores 1s tick data
  coinHolders: Record<string, Record<string, Holder>>;
  socialPosts: Record<string, SocialPost[]>;
  chartTimeframe: Timeframe;
  newsAlert: string | null;
  toasts: ToastMessage[];

  // Actions
  setCurrency: (currency: Currency) => void;
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  gainXp: (amount: number) => void;
  setTimeframe: (tf: Timeframe) => void;
  createWallet: (username: string) => void;
  setActiveCoinId: (id: string | null) => void;
  deployCoin: (name: string, symbol: string, supply: number, initialLiquidity: number, taxRate: number, locked: boolean, antiSniper: boolean) => void;
  createPost: (coinId: string, content: string) => void;
  clearNews: () => void;

  // Coin Actions
  burnTokens: (coinId: string, amount: number) => void;
  rugPull: (coinId: string) => void;
  fastTrackList: (coinId: string, tier: 1 | 2 | 3) => void;
  startAirdrop: (coinId: string, amount: number) => void;
  buyCoin: (coinId: string, usdAmount: number) => void;

  // Upgrades
  buyUpgrade: (upgradeKey: keyof PlayerUpgrades, costXP: number) => void;
  sellCoin: (coinId: string, tokenAmount: number) => void;

  // Game Loop Actions
  updateMarket: () => void;

  // System
  resetGame: () => void;
}
