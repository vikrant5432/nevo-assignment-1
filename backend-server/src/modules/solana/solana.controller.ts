import { Controller, Get, Param } from '@nestjs/common';
import { SolanaService } from './solana.service';

@Controller('solana')
export class SolanaController {
  constructor(private readonly solanaService: SolanaService) {}

  @Get('price/:symbol')
  async getPrice(@Param('symbol') symbol: string) {
    return await this.solanaService.getPriceForSymbol(symbol);
  }

  @Get('pools')
  async getAvailablePools() {
    return await this.solanaService.getAvailablePools();
  }
}
