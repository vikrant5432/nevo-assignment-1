import { Module } from '@nestjs/common';
import { ArbitrageService } from './arbitrage.service';
import { ArbitrageController } from './arbitrage.controller';
import { BinanceModule } from '../binance/binance.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [BinanceModule, SolanaModule],
  providers: [ArbitrageService],
  controllers: [ArbitrageController],
  exports: [ArbitrageService],
})
export class ArbitrageModule {}
