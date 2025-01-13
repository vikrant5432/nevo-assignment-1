// src/app.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BinanceService } from './modules/binance/binance.service';
import { SolanaService } from './modules/solana/solana.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly binanceService: BinanceService,
    private readonly solanaService: SolanaService,
  ) {}

  async onModuleInit() {
    await this.testConnections();
  }

  async testConnections(): Promise<boolean> {
    try {
      this.logger.log('Testing exchange connections...');

      // Test Binance connection
      try {
        const btcPrice = await this.binanceService.getPriceForSymbol('BTC');
        this.logger.log(
          `✅ Binance connection successful. BTC Price: ${btcPrice}`,
        );
      } catch (error) {
        this.logger.error(`❌ Binance connection failed: ${error.message}`);
        throw error;
      }

      // Test Solana connection
      try {
        const pools = await this.solanaService.getAvailablePools();
        this.logger.log(
          `✅ Solana connection successful. Available pools: ${pools.length}`,
        );
      } catch (error) {
        this.logger.error(`❌ Solana connection failed: ${error.message}`);
        throw error;
      }

      this.logger.log('🚀 All connections tested successfully!');
      return true;
    } catch (error) {
      this.logger.error('❌ Connection testing failed:', error);
      return false;
    }
  }

  getHello(): string {
    return 'Arbitrage Scanner Service is running!';
  }
}
