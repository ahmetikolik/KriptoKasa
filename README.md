# CryptoVault

CryptoVault is a modern, full-stack cryptocurrency trading dashboard built with a Spring Boot backend, a premium React single-page frontend (SPA), PostgreSQL persistence, Redis caching, live market data integrations, AI insights, and Docker-based deployment.

Designed to emulate top-tier crypto exchanges, CryptoVault provides an ultra-fast, visually stunning, and responsive interface for tracking assets, executing simulated trades, and getting AI-powered market insights.

### Screenshots

![Screenshot 1](docs/images/screenshot1.png)
![Screenshot 2](docs/images/screenshot2.png)
![Screenshot 3](docs/images/screenshot3.png)
![Screenshot 4](docs/images/screenshot4.png)

## Core Features

- **Premium UI/UX:** A stunning, dark-mode native interface with micro-animations, glassmorphism, and responsive layout.
- **Live Crypto Market:** Real-time prices, 24h changes, and charts integrated with CoinGecko and Frankfurter APIs.
- **Trading Simulator:** Execute buy and sell orders at current market prices with instant transactional logic.
- **Portfolio Management:** Dedicated wallet section tracking fiat balances, crypto holdings, and recent order history.
- **AI Assistant:** A draggable AI chat widget that acts as your personal financial advisor with context of your portfolio.
- **Multi-language & Currency:** Built-in support for Turkish, English, German, French, and USD, TRY, EUR formats.
- **Secure Authentication:** BCrypt password hashing and Redis-backed session tokens.
- **News Feed:** Curated crypto news section displaying the latest market events.
- **Production Ready:** Fully dockerized with multi-stage builds, Nginx reverse proxy, and lightweight Alpine database containers.

## Project Structure

```text
KriptoKasa/
  Kasa/                    Spring Boot backend application
  frontend/                React + Vite frontend SPA
  docker-compose.yml       Local deployment with PostgreSQL & Redis (Alpine optimized)
  docker-compose.prod.yml  Production Docker Compose setup
  DEPLOY.md                Deployment documentation
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Recharts, Context API, Vanilla CSS |
| Backend | Java 17, Spring Boot 3+ |
| Database | PostgreSQL (Alpine) |
| Cache | Redis (Alpine) |
| Migration | Flyway |
| Market Data | CoinGecko API |
| FX Rates | Frankfurter API |
| AI | External AI provider API |
| API Docs | springdoc OpenAPI / Swagger UI |
| Deployment | Docker, Docker Compose, Nginx |

## How The System Works

The browser never talks directly to PostgreSQL, Redis, or CoinGecko. It communicates exclusively via the backend REST API:

```text
React UI -> Nginx Proxy -> Spring Boot API -> Redis/PostgreSQL/CoinGecko/AI Provider
```

### Data Storage Strategy
- **Redis:** Stores fast, ephemeral data such as user session tokens, latest market prices, and 24h market change values.
- **PostgreSQL:** Stores permanent data like user accounts, balances, crypto holdings, trade transactions, and historical price snapshots.

## Dark Architecture Blueprints

The diagrams below show how the frontend, backend, Redis, PostgreSQL, CoinGecko, and the AI provider work together in production. Existing screenshots above are kept unchanged.

### System Architecture

```mermaid
%%{init: {"theme":"dark","themeVariables":{"background":"#070b12","primaryColor":"#0f172a","primaryTextColor":"#e5f2ff","primaryBorderColor":"#38bdf8","lineColor":"#22d3ee","secondaryColor":"#111827","tertiaryColor":"#162033","fontFamily":"Inter, Arial, sans-serif"}}}%%
flowchart LR
  Browser["Browser / User"]
  React["React SPA<br/>Login, markets, wallet, AI cards"]
  Nginx["Nginx<br/>Static frontend + /api proxy"]
  Spring["Spring Boot Core<br/>Auth • Market • Trading • Portfolio • AI"]
  Redis[("Redis<br/>Session tokens<br/>Latest prices<br/>24h changes")]
  Postgres[("PostgreSQL<br/>Users<br/>Wallets<br/>Holdings<br/>Trades<br/>Price snapshots")]
  CoinGecko["CoinGecko API<br/>Live market data"]
  AIProvider["AI Provider API<br/>Portfolio insight answers"]

  Browser -->|"HTTP :80"| Nginx
  Nginx --> React
  Nginx -->|"/api/*"| Spring
  Spring -->|"session + price cache"| Redis
  Spring -->|"persistent writes"| Postgres
  Spring -->|"scheduled refresh"| CoinGecko
  Spring -->|"generated prompt"| AIProvider
  AIProvider -->|"plain Turkish answer"| Spring
```

### Docker Compose Deployment

```mermaid
%%{init: {"theme":"dark","themeVariables":{"background":"#070b12","primaryColor":"#0f172a","primaryTextColor":"#e5f2ff","primaryBorderColor":"#818cf8","lineColor":"#60a5fa","secondaryColor":"#111827","tertiaryColor":"#162033","fontFamily":"Inter, Arial, sans-serif"}}}%%
flowchart LR
  Browser["Browser"]

  subgraph VM["Docker Compose on VM / Local Host"]
    direction LR
    Frontend["frontend container<br/>Nginx :80"]
    Backend["backend container<br/>Spring Boot :8080"]
    Redis[("redis container<br/>Redis :6379")]
    Postgres[("postgres container<br/>PostgreSQL :5432")]
  end

  CoinGecko["CoinGecko"]
  AIProvider["AI Provider"]

  Browser -->|"HTTP :80"| Frontend
  Frontend -->|"/api proxy"| Backend
  Backend --> Redis
  Backend --> Postgres
  Backend --> CoinGecko
  Backend --> AIProvider
```

### Redis And PostgreSQL Usage

```mermaid
%%{init: {"theme":"dark","themeVariables":{"background":"#070b12","primaryColor":"#0f172a","primaryTextColor":"#e5f2ff","primaryBorderColor":"#34d399","lineColor":"#34d399","secondaryColor":"#111827","tertiaryColor":"#162033","fontFamily":"Inter, Arial, sans-serif"}}}%%
flowchart TB
  Spring["Spring Boot Services"]

  subgraph RedisUse["Redis: fast temporary state"]
    R1["session:&lt;token&gt; -> userId"]
    R2["price:BTC -> latest USD price"]
    R3["price-change-percent:BTC -> 24h change"]
  end

  subgraph PostgresUse["PostgreSQL: durable business data"]
    P1["app_users<br/>email + password hash"]
    P2["wallets<br/>fiat balance"]
    P3["holdings<br/>asset quantity"]
    P4["trade_transactions<br/>buy/sell history"]
    P5["price_snapshots<br/>chart history"]
  end

  CoinGecko["CoinGecko refresh job"]
  AIProvider["AI insight prompt"]

  Spring -->|"read/write cache"| RedisUse
  Spring -->|"transactional persistence"| PostgresUse
  CoinGecko -->|"market data"| Spring
  Spring -->|"portfolio + market context"| AIProvider
```

### Register / Login Token Flow

```mermaid
%%{init: {"theme":"dark","themeVariables":{"background":"#070b12","primaryColor":"#0f172a","primaryTextColor":"#e5f2ff","primaryBorderColor":"#22c55e","lineColor":"#22c55e","secondaryColor":"#111827","tertiaryColor":"#162033","fontFamily":"Inter, Arial, sans-serif"}}}%%
flowchart LR
  User["User<br/>email + password"]
  Auth["AuthController<br/>/register<br/>/login"]
  Postgres[("PostgreSQL<br/>check/save user<br/>wallet balance")]
  Redis[("Redis<br/>create session token")]
  Frontend["React SPA<br/>stores bearer token"]

  User --> Auth
  Auth --> Postgres
  Auth --> Redis
  Redis -->|"token returned"| Auth
  Auth --> Frontend
  Frontend -->|"Authorization: Bearer token"| Auth
```

### AI Insights Flow

```mermaid
%%{init: {"theme":"dark","themeVariables":{"background":"#070b12","primaryColor":"#0f172a","primaryTextColor":"#e5f2ff","primaryBorderColor":"#f97316","lineColor":"#f59e0b","secondaryColor":"#111827","tertiaryColor":"#162033","fontFamily":"Inter, Arial, sans-serif"}}}%%
flowchart LR
  React["React SPA<br/>AI chat + cached AI suggestion cards"]
  Controller["AiController<br/>validates token + question"]
  Service["AiService<br/>builds Turkish safety prompt"]
  Redis[("Redis<br/>session lookup<br/>latest prices")]
  Postgres[("PostgreSQL<br/>wallet, holdings,<br/>recent trades")]
  CoinGecko["CoinGecko<br/>market refresh source"]
  AIProvider["AI Provider<br/>generateContent"]
  Answer["Plain AI answer<br/>shown in UI"]

  React -->|"POST /api/ai/query"| Controller
  Controller --> Service
  Service --> Redis
  Service --> Postgres
  CoinGecko --> Redis
  Service -->|"context prompt"| AIProvider
  AIProvider --> Answer
  Answer --> React
```

### Trading Logic
Trading occurs transactionally:
- **Buy:** Checks fiat balance -> Deducts fiat -> Adds crypto holding -> Logs transaction.
- **Sell:** Checks crypto holding -> Deducts crypto -> Credits fiat -> Logs transaction.
If any step fails, the entire transaction rolls back automatically.

## Local Development

### Start Databases
Start PostgreSQL and Redis locally:
```bash
docker compose up -d postgres redis
```

### Run Backend
```bash
cd Kasa
./mvnw spring-boot:run
```

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://localhost:5173`.

## Production Deployment

CryptoVault is optimized for minimal disk space and fast deployment using Docker Compose.

1. Configure your environment:
```bash
cp .env.example .env
nano .env
```

Ensure the following variables are set:
```text
POSTGRES_PASSWORD=your_strong_password_here
AI_PROVIDER_API_KEY=your_ai_provider_key_here
AI_PROVIDER_MODEL=your_ai_model_here
```

2. Build and start the containers:
```bash
docker compose up -d --build
```
This builds the backend using Maven wrapper, the frontend using Vite, and serves them via an Nginx alpine container.

3. Access the application:
- Application: `http://localhost`
- API Swagger Docs: `http://localhost/swagger-ui.html`

*For remote server deployment (e.g., AWS, GCP), see [DEPLOY.md](DEPLOY.md).*

## Useful Commands

- **Check API Health:** `curl http://localhost/api/market/prices`
- **View Backend Logs:** `docker compose logs -f backend`
- **Inspect Database Users:**
  ```bash
  docker exec -it cryptopal-postgres psql -U cryptopal -d cryptopal -c "SELECT id, email, display_name FROM app_users;"
  ```
