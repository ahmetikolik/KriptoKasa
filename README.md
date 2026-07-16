# CryptoPal

CryptoPal is a full-stack cryptocurrency trading dashboard built with a Spring Boot backend, React single-page frontend, PostgreSQL persistence, Redis caching, live market data, Gemini AI insights, and Docker-based deployment.

The application lets users register, log in, view live crypto prices, inspect their portfolio, execute buy/sell orders, and ask an AI assistant questions about their portfolio context.

## Application Screenshot

The trading console shows the authenticated session, cash balance, portfolio allocation donut chart, live market cards, 24h price movement, held quantities, and selected asset state in a single SPA dashboard.

![CryptoPal Trading Console Screenshot](docs/images/trading-console-screenshot.png)

![CryptoPal Architecture](docs/images/architecture.svg)

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
| Frontend | React, Vite, Nginx |
| Backend | Java 17, Spring Boot 4 |
| Database | PostgreSQL |
| Cache | Redis |
| Migration | Flyway |
| Market Data | CoinGecko public API |
| AI | Google Gemini API |
| Deployment | Docker Compose |

## Core Features

- User registration and login
- BCrypt password hashing
- Redis-backed session tokens
- Random initial wallet balance on registration
- Live crypto prices with 24h change
- Clickable asset cards with price history chart
- Portfolio holdings and recent orders
- Buy/sell trading modal
- Transactional trading logic
- Portfolio donut chart and profit/loss summary
- Gemini-powered AI portfolio insights
- Production deployment behind Nginx

## How The System Works

The browser never talks directly to PostgreSQL, Redis, or CoinGecko. It only talks to the backend through HTTP endpoints.

```text
React UI -> /api/... -> Spring Boot -> Redis/PostgreSQL/CoinGecko
```

In production, Nginx serves the React app and proxies API requests to the backend container.

![Production Deployment](docs/images/deployment.svg)

## Redis vs PostgreSQL

CryptoPal uses Redis and PostgreSQL for different responsibilities.

![Storage Model](docs/images/storage-model.svg)

### Redis

Redis stores fast, temporary data:

- Session tokens
- Latest market prices
- Latest 24h market change values

Example:

```text
session:{token} -> userId
price:BTC -> latest BTC price
price-change-percent:BTC -> 24h change
```

### PostgreSQL

PostgreSQL stores permanent financial data:

- Users
- Wallet balances
- Crypto holdings
- Trade transactions
- Historical price snapshots

Financial state is never stored permanently in Redis.

## Authentication Flow

When a user registers or logs in, the backend creates a session token and stores it in Redis.

![Authentication Flow](docs/images/auth-flow.svg)

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

Then it uses the resolved `userId` to load portfolio or execute trades.

## Market And Trading Flow

CryptoPal periodically fetches market data from CoinGecko, writes the latest values into Redis, and stores snapshots in PostgreSQL.

![Market And Trading Flow](docs/images/market-trade-flow.svg)

Trading uses strict transactional logic:

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

## Gemini AI Insights

The AI panel is a protected workflow. The frontend sends the user's question with the session token, the backend resolves the user from Redis, reads portfolio context from PostgreSQL, adds the latest cached market prices, and sends one generated prompt to Gemini.

![Gemini AI Insights Flow](docs/images/ai-insights-flow.svg)

The Gemini call is read-only from the app's perspective. It can explain the current portfolio context, but it does not write balances, create orders, or bypass the trading service.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create user and wallet |
| POST | `/api/auth/login` | Login and receive token |
| GET | `/api/market/prices` | Get latest cached market prices |
| GET | `/api/market/history/{symbol}` | Get recent price snapshots for one asset |
| GET | `/api/portfolio` | Get wallet, holdings, and recent orders |
| POST | `/api/trades` | Execute buy/sell order |
| POST | `/api/ai/query` | Ask Gemini using the authenticated portfolio context |

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

Open the VM public IP:

```text
http://34.10.14.229
```

More details are in [DEPLOY.md](DEPLOY.md).

## Useful SSH Commands

See registered users:

```bash
docker exec -it cryptopal-postgres psql -U cryptopal -d cryptopal -c "select id, email, created_at from app_users order by id desc;"
```

See wallet balances:

```bash
docker exec -it cryptopal-postgres psql -U cryptopal -d cryptopal -c "select u.id, u.email, w.fiat_balance from app_users u join wallets w on w.user_id = u.id order by u.id desc;"
```

See market API:

```bash
curl http://localhost/api/market/prices
```

See backend logs:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## Current Status

Completed:

- Backend core modules
- PostgreSQL schema migration
- Redis session and price cache
- Live market prices
- Trading operations
- React SPA frontend
- Docker production deployment
- Google Gemini AI insights module

Pending:

- Swagger/OpenAPI documentation
- More advanced realized/unrealized PnL calculations
