import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import { Interval } from '@nestjs/schedule';
import axios from 'axios';

const MONITORED_PAIRS = ['SOL', 'BTC', 'ETH'];
const API_ENDPOINTS = {
  CP_POOLS: 'https://api.raydium.io/v2/main/pairs',
};

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private connection: Connection;
  private readonly pools = new Map<string, any>();

  constructor() {
    try {
      this.connection = new Connection(
        'https://api.mainnet-beta.solana.com',
        'confirmed',
      );
      this.logger.log('Solana connection initialized');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Solana connection:',
        error.message,
      );
      throw error;
    }
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing Solana service...');
      await this.updatePoolData();
      this.logger.log(
        `Initial pool data loaded. Found ${this.pools.size} valid pools`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize Solana service:', error.message);
    }
  }

  @Interval(10000)
  private async updatePoolData() {
    try {
      this.logger.debug('Starting pool data update...');
      const cpData = await this.fetchCPPools();

      // Clear existing pools
      this.pools.clear();

      if (Array.isArray(cpData)) {
        let validPoolCount = 0;

        // Find USDC pairs first
        const usdcPairs = cpData.filter((pair) => {
          if (!pair?.name || !pair?.quoteMint) return false;
          // Check if this is a USDC pair using the mint address
          return (
            pair.quoteMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
          ); // USDC mint address
        });

        this.logger.debug(`Found ${usdcPairs.length} USDC pairs`);

        usdcPairs.forEach((pair) => {
          try {
            const [baseToken] = pair.name.split('/');

            if (MONITORED_PAIRS.includes(baseToken)) {
              const pool = {
                id: pair.ammId,
                symbol: baseToken,
                price: parseFloat(pair.price),
                volume24h: parseFloat(pair.volume24h || '0'),
                liquidity: parseFloat(pair.liquidity || '0'),
                name: pair.name,
                fee: 0.0025,
              };

              this.pools.set(pool.id, pool);
              validPoolCount++;
              this.logger.debug(
                `Added pool: ${baseToken}/USDC, Price: ${pool.price}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error processing pool ${pair?.name}: ${error.message}`,
            );
          }
        });

        this.logger.log(
          `Found ${validPoolCount} valid monitored USDC pools out of ${usdcPairs.length} total USDC pairs`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to update pool data:', error.message);
    }
  }

  private async fetchCPPools(): Promise<any[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.CP_POOLS, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      });

      return response.data || [];
    } catch (error) {
      this.logger.error('Error fetching CP pools:', error.message);
      return [];
    }
  }

  async getAvailablePools() {
    if (this.pools.size === 0) {
      await this.updatePoolData();
    }
    return Array.from(this.pools.values());
  }

  async getPriceForSymbol(symbol: string): Promise<number> {
    const pools = Array.from(this.pools.values())
      .filter((p) => p.symbol === symbol)
      .sort((a, b) => b.liquidity - a.liquidity);

    if (!pools.length) {
      throw new Error(`No pool found for ${symbol}`);
    }

    const bestPool = pools[0];
    return bestPool.price;
  }

  getDexFee(poolId: string): number {
    const pool = this.pools.get(poolId);
    return pool?.fee || 0.0025;
  }

  getTransactionCost(): number {
    return 0.000005;
  }
}
