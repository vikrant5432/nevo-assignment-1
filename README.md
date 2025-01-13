# Crypto Arbitrage Scanner

A real-time arbitrage scanner that identifies price differences between Binance (CEX) and Solana DEX markets for cryptocurrency trading pairs against USDC.

## Project Structure

```
assignment-1/
├── backend/             # NestJS backend
├── frontend/           # Angular frontend
```

## Features

- Real-time price monitoring for BTC, ETH, and SOL against USDC
- Automated arbitrage opportunity detection
- Fee consideration (Binance fees, Solana DEX fees, transaction costs)
- Live updates every 10 seconds
- Visual representation of opportunities

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Angular CLI
- NestJS CLI

## Backend Setup

1. Navigate to backend directory:

```bash
cd backend-server
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
SOLANA_RPC_URL=your_solana_rpc_url
TRADING_PAIRS= trading pairs for which you want monitor
PORT=3000
```

4. Run the backend:

```bash
# Development
npm run start:dev
```

## Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend-xlient
```

2. Install dependencies:

```bash
npm install
```

3. Update environment files if needed:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
};
```

4. Run the frontend:

```bash
# Development
ng serve
```

### Frontend Tests

```bash
cd frontend-client
ng test
```

## Architecture

### Backend

- NestJS framework
- Real-time WebSocket connections to Binance
- Integration with Solana RPC for DEX data
- RESTful API endpoints
- Automated price monitoring and arbitrage calculations

### Frontend

- Angular v18
- Real-time updates using polling
- Responsive design
- Error handling and loading states
- Unit tests using Jasmine

## API Endpoints

### GET /arbitrage/opportunities

Returns current arbitrage opportunities

Response:

```json
[
  {
    "symbol": "BTC",
    "binancePrice": 45000.5,
    "solanaPrice": 45100.75,
    "priceSpread": 100.25,
    "profitPercentage": 0.22,
    "profitAmount": 89.75,
    "direction": "binanceToSolana",
    "fees": {
      "binance": 45,
      "solana": 20
    },
    "tradingVolume": 100,
    "slippage": 0.01,
    "timestamp": 1705123456789
  }
]
```

## Arbitrage Logic

The scanner considers:

1. Price differences between Binance and Solana DEX
2. Trading fees:
   - Binance maker/taker fees (0.1%)
   - Solana DEX swap fees (0.25%)
   - Network transaction costs
3. Minimum profit threshold (0.1%)
4. Slippage consideration (1%)
5. Minimum trade size ($100)

## Future Improvements

1. Add more trading pairs
2. Implement WebSocket for frontend updates
3. Add historical opportunity tracking
4. Implement automated trading
5. Add price charts and trend analysis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
