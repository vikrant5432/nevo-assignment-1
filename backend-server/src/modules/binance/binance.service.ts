import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Spot } from '@binance/connector';
import * as WebSocket from 'ws';
import { Interval } from '@nestjs/schedule';
import { BinancePrice } from './type';

// Define default trading pairs if none are configured
const DEFAULT_TRADING_PAIRS = ['BTC', 'ETH', 'SOL'];

@Injectable()
export class BinanceService implements OnModuleInit {
  private readonly logger = new Logger(BinanceService.name);
  private client: Spot;
  private ws: WebSocket;
  private prices: Map<string, BinancePrice> = new Map();
  private readonly PRICE_REFRESH_INTERVAL = 1000; // 1 second
  private readonly RECONNECT_INTERVAL = 5000; // 5 seconds
  private tradingPairs: string[];

  constructor(private readonly configService: ConfigService) {
    // Ensure tradingPairs is initialized as an array
    const configPairs = this.configService.get('TRADING_PAIRS');
    this.tradingPairs = Array.isArray(configPairs)
      ? configPairs
      : [...DEFAULT_TRADING_PAIRS];

    this.client = new Spot(
      this.configService.get('app.BINANCE_API_KEY'),
      this.configService.get('app.BINANCE_API_SECRET'),
      {
        baseURL: 'https://api.binance.com',
      },
    );

    this.logger.log(
      `Initialized with trading pairs: ${this.tradingPairs.join(', ')}`,
    );
  }

  async onModuleInit() {
    try {
      await this.loadTradingPairs();
      await this.initializeWebSocket();
    } catch (error) {
      this.logger.error(
        `Failed to initialize Binance service: ${error.message}`,
      );
    }
  }

  private async initializeWebSocket() {
    try {
      // Ensure we have valid trading pairs
      if (!this.tradingPairs || this.tradingPairs.length === 0) {
        this.tradingPairs = [...DEFAULT_TRADING_PAIRS];
        this.logger.warn('No trading pairs found, using defaults');
      }

      const streams = this.tradingPairs.map(
        (pair) => `${pair.toLowerCase()}usdc@ticker`,
      );

      const wsUrl = `wss://stream.binance.com:9443/ws/${streams.join('/')}`;
      this.logger.debug(`Connecting to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.logger.log('WebSocket connection established');
      });

      this.ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          if (message.s && message.c) {
            this.prices.set(message.s, {
              symbol: message.s,
              price: parseFloat(message.c),
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          this.logger.error(
            `Error processing WebSocket message: ${error.message}`,
          );
        }
      });

      this.ws.on('error', (error) => {
        this.logger.error(`WebSocket error: ${error.message}`);
        this.reconnectWebSocket();
      });

      this.ws.on('close', () => {
        this.logger.warn('WebSocket connection closed');
        this.reconnectWebSocket();
      });
    } catch (error) {
      this.logger.error(`Failed to initialize WebSocket: ${error.message}`);
      setTimeout(() => this.initializeWebSocket(), this.RECONNECT_INTERVAL);
    }
  }

  private async reconnectWebSocket() {
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch (error) {
        this.logger.error(`Error terminating WebSocket: ${error.message}`);
      }
    }
    await new Promise((resolve) =>
      setTimeout(resolve, this.RECONNECT_INTERVAL),
    );
    await this.initializeWebSocket();
  }

  private async loadTradingPairs() {
    try {
      const { data: exchangeInfo } = await this.client.exchangeInfo();
      if (!exchangeInfo?.symbols) {
        throw new Error('Invalid exchange info response');
      }

      const usdcPairs = exchangeInfo.symbols.filter(
        (symbol) => symbol.quoteAsset === 'USDC' && symbol.status === 'TRADING',
      );

      // Validate that our configured pairs exist on Binance
      const availablePairs = new Set(usdcPairs.map((s) => s.baseAsset));
      const invalidPairs = this.tradingPairs.filter(
        (pair) => !availablePairs.has(pair),
      );

      if (invalidPairs.length > 0) {
        this.logger.warn(
          `Warning: Some configured pairs are not available on Binance: ${invalidPairs.join(', ')}`,
        );
      }

      this.logger.log(
        `Successfully loaded ${usdcPairs.length} USDC trading pairs`,
      );
    } catch (error) {
      this.logger.error(`Failed to load trading pairs: ${error.message}`);
      throw error;
    }
  }

  async getPriceForSymbol(symbol: string): Promise<number> {
    try {
      if (!this.tradingPairs.includes(symbol)) {
        throw new Error(`Symbol ${symbol} is not in configured trading pairs`);
      }

      // First check cached price from WebSocket
      const cachedPrice = this.prices.get(`${symbol}USDC`);
      if (
        cachedPrice &&
        Date.now() - cachedPrice.timestamp < this.PRICE_REFRESH_INTERVAL
      ) {
        return cachedPrice.price;
      }

      // Fallback to REST API if WebSocket data is not available or stale
      const { data: priceData } = await this.client.tickerPrice(
        `${symbol}USDC`,
      );
      if (!priceData?.price) {
        throw new Error(`No price data available for ${symbol}`);
      }

      const price = parseFloat(priceData.price);
      if (!isFinite(price)) {
        throw new Error(`Invalid price value for ${symbol}`);
      }

      this.prices.set(`${symbol}USDC`, {
        symbol: `${symbol}USDC`,
        price,
        timestamp: Date.now(),
      });

      return price;
    } catch (error) {
      this.logger.error(`Error fetching price for ${symbol}: ${error.message}`);
      throw error;
    }
  }

  getTradingFees(): { makerFee: number; takerFee: number } {
    return {
      makerFee: 0.001, // 0.1%
      takerFee: 0.001, // 0.1%
    };
  }

  @Interval(60000) // Run every minute
  private async checkApiHealth() {
    try {
      await this.client.ping();
      this.logger.debug('Binance API health check: OK');
    } catch (error) {
      this.logger.error('Binance API health check failed:', error.message);
    }
  }
}
