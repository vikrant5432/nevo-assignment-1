import { Module } from '@nestjs/common';
// import { WebsocketGateway } from './websocket.gateway';
import { ArbitrageModule } from '../arbitrage/arbitrage.module';

@Module({
  imports: [ArbitrageModule],
  providers: [],
})
export class WebsocketModule {}
