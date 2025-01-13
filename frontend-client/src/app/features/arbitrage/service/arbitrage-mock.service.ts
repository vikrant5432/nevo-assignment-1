// src/app/features/arbitrage/services/arbitrage-api.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ArbitrageOpportunity } from '../model/arbitrage.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArbitrageApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor() {}

  // Method to get mock data
  private getMockOpportunities(): ArbitrageOpportunity[] {
    return [
      {
        symbol: 'BTC',
        binancePrice: 45000.5,
        solanaPrice: 45100.75,
        priceSpread: 100.25,
        profitPercentage: 0.22,
        profitAmount: 89.75,
        direction: 'binanceToSolana',
        fees: {
          binance: 45,
          solana: 20,
        },
        tradingVolume: 100,
        slippage: 0.01,
        timestamp: Date.now(),
      },
      {
        symbol: 'ETH',
        binancePrice: 2500.25,
        solanaPrice: 2490.5,
        priceSpread: 9.75,
        profitPercentage: 0.15,
        profitAmount: 45.25,
        direction: 'solanaToBinance',
        fees: {
          binance: 2.5,
          solana: 1.5,
        },
        tradingVolume: 100,
        slippage: 0.01,
        timestamp: Date.now(),
      },
      {
        symbol: 'SOL',
        binancePrice: 95.75,
        solanaPrice: 96.25,
        priceSpread: 0.5,
        profitPercentage: 0.12,
        profitAmount: 22.5,
        direction: 'binanceToSolana',
        fees: {
          binance: 0.95,
          solana: 0.48,
        },
        tradingVolume: 100,
        slippage: 0.01,
        timestamp: Date.now(),
      },
    ];
  }

  getOpportunities(): Observable<ArbitrageOpportunity[]> {
    return of(this.getMockOpportunities());
  }
}
