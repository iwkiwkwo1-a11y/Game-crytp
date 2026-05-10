# Meme Coin Tycoon 🚀

Welcome to the **Meme Coin Tycoon**! This is an interactive, browser-based web simulation where you take on the role of a crypto developer. You can deploy fake tokens, build hype, deal with trading bots, manipulate markets, and fight your way to a multi-million dollar market cap.

This game utilizes real-world Automatic Market Maker (AMM) pricing formulas, simulating liquidity pools natively within your browser using React, Zustand, and Tailwind CSS.

## 🛠️ Gameplay Features & Mechanics

### 1. Deploying a Coin
Once you create your developer wallet alias, you can deploy a new coin from the **Portfolio**. You will configure:
- **Total Supply**: How many tokens exist.
- **Initial Liquidity**: How much USD you inject into the Liquidity Pool to set the starting price.
- **Buy/Sell Tax**: A percentage deducted from every bot trade. Setting a higher tax (e.g., 5% or 10%) will earn you passive USD income, but it will discourage bots from buying.
- **Liquidity Lock**: Locking your liquidity earns immediate trust from bots (they buy more often), but it removes your ability to *Rug Pull*.

### 2. Player Actions & Terminal
Inside your Trading Dashboard, you have several powerful tools:
- **Swap Panel (Buy/Sell)**: Unlike typical dev games, you can act as a trader too. Buy your own coin (or bot-generated competitor coins) to pump the chart artificially, then sell them to take profit.
- **Burn Dev Tokens**: Destroy your reserved tokens (10% of total supply is kept for you at launch). Burning reduces total supply and makes your token slightly more scarce.
- **Airdrop**: Distribute your developer tokens for free to random wallets. Giving away free money drastically spikes the token's Hype!
- **Fast-Track CMC (CEX Listing)**: Bribe Centralized Exchanges to list your coin. This requires a lot of USD and Social Followers. Doing so permanently boosts bot trust and pushes your token to the moon.
- **RUG PULL**: The ultimate forbidden jutsu. If your liquidity is *Unlocked*, you can press this to instantly dump all your developer tokens into the liquidity pool, draining the USD into your balance. Your coin will die instantly, but you walk away rich.

### 3. The Market Ecosystem
Your token exists in a living ecosystem alongside:
- **DexTrending**: A real-time leaderboard showing all active coins. **Bot Coins** will spawn automatically every few minutes to compete with you for the #1 spot.
- **Social Feed**: Post memes or shill your coin here. Your follower count determines how many likes you get, and likes directly translate to Market Hype.
- **Random News Events (FOMO/FUD)**: Keep an eye on the top banner! Random news (like an Elon tweet or SEC investigation) will cause massive market-wide panic buys or sell-offs.

### 4. Advanced Bot Simulation
The chart doesn't move randomly; it's driven by interacting bots:
- **DCA Bots**: Small, consistent buyers building your price floor.
- **FOMO Apes 🦍**: Highly aggressive buyers that only appear when your Hype is near 100%.
- **White Knight Whales 🛡️**: Rare, wealthy bots that might swoop in with a massive buy order to save your coin when Hype drops dangerously low.
- **MEV / Arbitrage Bots 🤖**: They execute immediate "wash trades" (buying and selling in the same second). While it doesn't move the price much, it generates huge amounts of Tax USD for your wallet!

### 5. Upgrades & Skill Tree
Earn XP by deploying coins and trading. Spend XP in the **Upgrades** tab to permanently buff your developer skills:
- **Bot Farm**: Multiplies the likes your social posts receive.
- **Hype Aura**: Reduces the natural decay of your token's hype.
- **Smooth Talker**: Manipulates bots into buying more frequently despite high token taxes.

## 🚀 Running Locally

If you want to run this simulator on your own machine:

1. Clone this repo.
2. Ensure you have Node.js installed.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📈 Deployment
This project is fully ready to be deployed to **Vercel**. All state is managed locally via `localStorage`, so no backend database configuration is required. Enjoy the ride to the moon! 🌕
