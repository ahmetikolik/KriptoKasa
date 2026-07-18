# CryptoVault

CryptoVault is a full-stack cryptocurrency trading dashboard built with a Spring Boot backend, React single-page frontend, PostgreSQL persistence, Redis caching, live market data, Gemini AI insights, account settings, and Docker-based deployment.

The app lets users register, log in, view live crypto prices, inspect their wallet, execute buy/sell orders, open coin charts, manage account details, and use a draggable AI market chat.

## Current UI

- Binance-style market overview redesigned with a blue CryptoVault theme.
- Default preferences are dark mode, Turkish language, and USD currency.
- Language options: Turkish, English, German, French.
- Currency options: USD, TRY, EUR.
- Favorites remain pinned in the right rail.
- Wallet has its own page section and can open trade actions directly.
- AI assistant is a fixed bottom-right chat widget and can be dragged around the screen.
- Coin rows open a detail modal with chart, buy/sell controls, quantity, currency, and estimated total.

## Project Structure

```text
KriptoKasa/
  Kasa/                    Spring Boot backend
  frontend/                React + Vite frontend
  docker-compose.yml       Local PostgreSQL + Redis
  docker-compose.prod.yml  Production Docker Compose
  DEPLOY.md                Google Cloud deployment notes
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Recharts, Nginx |
| Backend | Java 17, Spring Boot 4 |
| Database | PostgreSQL |
| Cache | Redis |
| Migration | Flyway |
| Market Data | CoinGecko public API |
| FX Rates | Frankfurter API |
| AI | Google Gemini API |
| API Docs | springdoc OpenAPI / Swagger UI |
| Deployment | Docker Compose |

## Core Features

- User registration and login
- BCrypt password hashing
- Redis-backed session tokens
- Account settings: display name, phone number, password update, account deletion
- Random initial wallet balance on registration
- Live crypto prices with 24h change
- 5-second refresh for market prices, FX rates, portfolio, and selected chart history
- Current market-price trading, no delayed execution price
- Favorite coins in the right rail
- Dedicated wallet section with cash balance, holdings, and quick trade buttons
- Coin detail modal with price history chart and buy/sell form
- Transactional trading logic
- Recent orders
- Draggable Gemini AI market assistant chat
- Production deployment behind Nginx
- Swagger UI and OpenAPI JSON exposed through the frontend proxy

## How The System Works

The browser never talks directly to PostgreSQL, Redis, or CoinGecko. It only talks to the backend through HTTP endpoints.

```text
React UI -> /api/... -> Spring Boot -> Redis/PostgreSQL/CoinGecko/Gemini
```

In production, Nginx serves the React app and proxies API and Swagger requests to the backend container.

## Data Storage

### Redis

Redis stores fast, temporary data:

- Session tokens
- Latest market prices
- Latest 24h market change values
- Latest market update timestamps

Example:

```text
session:{token} -> userId
price:BTC -> latest BTC price
price-change-percent:BTC -> 24h change
price-updated-at:BTC -> timestamp
```

### PostgreSQL

PostgreSQL stores permanent financial and account data:

- Users
- Display name and phone number
- Wallet balances
- Crypto holdings
- Trade transactions
- Historical price snapshots

Financial state is never stored permanently in Redis.

## Authentication Flow

When a user registers or logs in, the backend creates a session token and stores it in Redis.

Register/login response example:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "token": "generated-session-token",
  "fiatBalance": 7500.25
}
```

Protected requests use the token:

```http
Authorization: Bearer generated-session-token
```

The backend checks Redis:

```text
session:generated-session-token -> 1
```

Then it uses the resolved `userId` to load account, portfolio, AI context, or execute trades.

## Market And Trading Flow

CryptoVault periodically fetches market data from CoinGecko, writes the latest values into Redis, and stores snapshots in PostgreSQL for chart history.

Trading uses the latest cached market price through `MarketService.getLatestPrice(symbol)`.

### Buy

```text
Check wallet balance
Deduct fiat balance
Add crypto holding
Write trade transaction
Commit all together
```

### Sell

```text
Check crypto holding
Deduct crypto holding
Credit fiat balance
Write trade transaction
Commit all together
```

If one step fails, the full transaction rolls back.

## Gemini AI Chat

The AI chat is a protected workflow. The frontend sends the user's question with the session token, the backend resolves the user from Redis, reads portfolio context from PostgreSQL, adds the latest cached market prices, and sends one generated prompt to Gemini.

The Gemini call is read-only from the app's perspective. It can explain current portfolio context, but it does not write balances, create orders, or bypass the trading service.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create user and wallet |
| POST | `/api/auth/login` | Login and receive token |
| GET | `/api/account` | Get account profile |
| PATCH | `/api/account` | Update display name and phone number |
| POST | `/api/account/password` | Change password |
| DELETE | `/api/account` | Delete account and revoke session |
| GET | `/api/market/prices` | Get latest cached market prices |
| GET | `/api/market/history/{symbol}` | Get recent price snapshots for one asset |
| GET | `/api/portfolio` | Get wallet, holdings, and recent orders |
| POST | `/api/trades` | Execute buy/sell order |
| POST | `/api/ai/query` | Ask Gemini using the authenticated portfolio context |
| GET | `/v3/api-docs` | OpenAPI JSON |
| GET | `/swagger-ui.html` | Swagger UI |

## Local Development

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Run backend:

```bash
cd Kasa
./mvnw spring-boot:run
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Production Deployment

The production setup runs all services with Docker Compose.

```bash
cp .env.example .env
nano .env
docker compose -f docker-compose.prod.yml up -d --build
```

Required production environment values:

```text
POSTGRES_PASSWORD=your_strong_password_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
```

Check containers:

```bash
docker compose -f docker-compose.prod.yml ps
```

Open locally:

```text
http://localhost
```

Swagger:

```text
http://localhost/swagger-ui.html
```

More deployment details are in [DEPLOY.md](DEPLOY.md).

## Useful Commands

See market API:

```bash
curl http://localhost/api/market/prices
```

See OpenAPI JSON:

```bash
curl http://localhost/v3/api-docs
```

See backend logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

See registered users:

```bash
docker exec -it cryptopal-postgres psql -U cryptopal -d cryptopal -c "select id, email, display_name, phone_number, created_at from app_users order by id desc;"
```

See wallet balances:

```bash
docker exec -it cryptopal-postgres psql -U cryptopal -d cryptopal -c "select u.id, u.email, w.fiat_balance from app_users u join wallets w on w.user_id = u.id order by u.id desc;"
```

## Verification

Latest local verification:

```bash
cd frontend
npm run build

cd ../Kasa
./mvnw test

cd ..
docker compose -f docker-compose.prod.yml up -d --build backend frontend
curl http://localhost/api/market/prices
```

## Current Status

Completed:

- Backend core modules
- PostgreSQL schema migrations
- Redis session and price cache
- Live market prices
- 5-second market refresh configuration
- Current-price trading operations
- React SPA frontend
- Dark/light theme
- Turkish, English, German, French language options
- USD, TRY, EUR currency options
- Dedicated wallet trading section
- Account settings and account deletion
- Draggable Gemini AI chat
- Docker production deployment
- Swagger/OpenAPI documentation

Pending:

- More advanced realized/unrealized PnL calculations
- Frontend bundle code-splitting if the Vite chunk-size warning needs to be removed
