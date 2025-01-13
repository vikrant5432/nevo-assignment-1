import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/env-validator';
import { BinanceModule } from './modules/binance/binance.module';
import { SolanaModule } from './modules/solana/solana.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [],
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    BinanceModule,
    SolanaModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
