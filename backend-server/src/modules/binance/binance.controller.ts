import { Controller, Get, Param } from '@nestjs/common';
import { BinanceService } from './binance.service';

@Controller('binance')
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('price/:symbol')
  async getPrice(@Param('symbol') symbol: string) {
    return await this.binanceService.getPriceForSymbol(symbol);
  }
}
