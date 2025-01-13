import { Injectable, Logger } from '@nestjs/common';
import { BinanceService } from '../binance/binance.service';
import { SolanaService } from '../solana/solana.service';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import Decimal from 'decimal.js';
import { ArbitrageOpportunity } from './types';

const MIN_TRADE_SIZE = 100; // Minimum USDC trade size
const MAX_SLIPPAGE = 0.01; // 1% maximum slippage
const MIN_PROFIT_PERCENTAGE = 0.1; // Minimum profit threshold

@Injectable()
export class ArbitrageService {
  private readonly logger = new Logger(ArbitrageService.name);
  private readonly tradingPairs: string[];
  private solanaPoolIds: Map<string, string> = new Map();

  constructor(
    private readonly binanceService: BinanceService,
    private readonly solanaService: SolanaService,
    private readonly configService: ConfigService,
  ) {
    this.tradingPairs = this.configService.get<string[]>('TRADING_PAIRS') || [
      'SOL',
      'BTC',
      'ETH',
    ];
    this.initializeSolanaPools();
  }

  private async initializeSolanaPools() {
    try {
      const pools = await this.solanaService.getAvailablePools();
      pools.forEach((pool) => {
        if (
          !this.solanaPoolIds.has(pool.symbol) ||
          pools.find(
            (p) => p.symbol === pool.symbol && p.liquidity > pool.liquidity,
          )
        ) {
          this.solanaPoolIds.set(pool.symbol, pool.address);
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize Solana pools:', error.message);
    }
  }

  @Interval(10000) // Scan every 10 seconds
  async scanArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const symbol of this.tradingPairs) {
      try {
        const poolId = this.solanaPoolIds.get(symbol);
        if (!poolId) {
          this.logger.warn(`No Solana pool found for ${symbol}, skipping`);
          continue;
        }

        // Get prices from both exchanges
        const [binancePrice, solanaPrice] = await Promise.all([
          this.binanceService.getPriceForSymbol(symbol),
          this.solanaService.getPriceForSymbol(symbol),
        ]);

        // Get fees
        const binanceFees = this.binanceService.getTradingFees();
        const solanaDexFee = this.solanaService.getDexFee(poolId);
        const transactionCost = this.solanaService.getTransactionCost();

        const priceSpread = Math.abs(binancePrice - solanaPrice);
        const baseAmount = MIN_TRADE_SIZE;

        // Calculate total costs including network fees
        const binanceTotalFee = binancePrice * binanceFees.takerFee;
        const solanaTotalFee =
          solanaPrice * solanaDexFee + transactionCost * solanaPrice;

        // Calculate profits in both directions
        const binanceToSolanaProfit = new Decimal(solanaPrice)
          .minus(binancePrice)
          .minus(binanceTotalFee)
          .minus(solanaTotalFee)
          .mul(baseAmount);

        const solanaToBinanceProfit = new Decimal(binancePrice)
          .minus(solanaPrice)
          .minus(solanaTotalFee)
          .minus(binanceTotalFee)
          .mul(baseAmount);

        // Determine profitable direction and calculate slippage-adjusted profit
        let profitAmount = 0;
        let direction: 'binanceToSolana' | 'solanaToBinance';

        if (binanceToSolanaProfit.greaterThan(solanaToBinanceProfit)) {
          direction = 'binanceToSolana';
          profitAmount = binanceToSolanaProfit.toNumber();
        } else {
          direction = 'solanaToBinance';
          profitAmount = solanaToBinanceProfit.toNumber();
        }

        const profitPercentage =
          (profitAmount / (baseAmount * binancePrice)) * 100;
        const slippageAdjustedProfit = profitAmount * (1 - MAX_SLIPPAGE);

        // Only add if profit meets our criteria
        if (
          profitPercentage > MIN_PROFIT_PERCENTAGE &&
          slippageAdjustedProfit > 0
        ) {
          opportunities.push({
            symbol,
            binancePrice,
            solanaPrice,
            priceSpread,
            profitPercentage,
            profitAmount: slippageAdjustedProfit,
            direction,
            fees: {
              binance: binanceTotalFee,
              solana: solanaTotalFee,
            },
            tradingVolume: baseAmount,
            slippage: MAX_SLIPPAGE,
            timestamp: Date.now(),
          });

          this.logger.log(
            `Found arbitrage: ${symbol} | ${direction} | ` +
              `Profit: $${slippageAdjustedProfit.toFixed(2)} (${profitPercentage.toFixed(2)}%) | ` +
              `After slippage: $${slippageAdjustedProfit.toFixed(2)}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error calculating arbitrage for ${symbol}: ${error.message}`,
        );
      }
    }

    return opportunities.sort((a, b) => b.profitAmount - a.profitAmount);
  }
}
