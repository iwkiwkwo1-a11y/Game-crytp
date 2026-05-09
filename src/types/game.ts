export type Currency = 'USD' | 'IDR';

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
}

export interface GameState {
  // Player State
  playerMoney: number;
  currency: Currency;

  // Active Game State
  activeCoin: Coin | null;
  priceHistory: PricePoint[];

  // Actions
  setCurrency: (currency: Currency) => void;
  deployCoin: (name: string, symbol: string, supply: number, initialLiquidity: number) => void;
  marketing: (cost: number, hypeBoost: number) => void;
  burnTokens: (amount: number) => void;
  rugPull: () => void;

  // Game Loop Actions
  updateMarket: () => void; // Dipanggil setiap tick

  // System
  resetGame: () => void;
}
