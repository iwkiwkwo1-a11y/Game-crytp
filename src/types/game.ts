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

export interface GameState {
  // Player State
  playerMoney: number;
  playerWallet: PlayerWallet | null;
  currency: Currency;
  followers: number;

  // Active Game State
  activeCoin: Coin | null;
  priceHistory: PricePoint[]; // Always stores 1s tick data (up to maybe 500-1000 points max to avoid memory bloat)
  coinHolders: Record<string, Holder>;
  chartTimeframe: Timeframe;
  socialPosts: SocialPost[];
  newsAlert: string | null;

  // Actions
  setCurrency: (currency: Currency) => void;
  setTimeframe: (tf: Timeframe) => void;
  createWallet: (username: string) => void;
  deployCoin: (name: string, symbol: string, supply: number, initialLiquidity: number, taxRate: number, locked: boolean) => void;
  createPost: (content: string) => void;
  clearNews: () => void;

  burnTokens: (amount: number) => void;
  rugPull: () => void;

  // Game Loop Actions
  updateMarket: () => void;

  // System
  resetGame: () => void;
}
