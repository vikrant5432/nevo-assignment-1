export interface ArbitrageOpportunity {
  symbol: string;
  binancePrice: number;
  solanaPrice: number;
  priceSpread: number;
  profitPercentage: number;
  profitAmount: number;
  direction: 'binanceToSolana' | 'solanaToBinance';
  fees: {
    binance: number;
    solana: number;
  };
  tradingVolume: number;
  slippage: number;
  timestamp: number;
}
