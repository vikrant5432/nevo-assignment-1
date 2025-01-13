import { Controller, Get } from '@nestjs/common';
import { ArbitrageService } from './arbitrage.service';

@Controller('arbitrage')
export class ArbitrageController {
  constructor(private readonly arbitrageService: ArbitrageService) {}

  @Get('opportunities')
  async getOpportunities() {
    return this.arbitrageService.scanArbitrageOpportunities();
  }
}
