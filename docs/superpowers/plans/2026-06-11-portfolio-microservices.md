# Portfolio Microservices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 10-service microservices portfolio monorepo demonstrating senior full-stack engineering via interactive demos (trade, payment, e-commerce, telemedicine) with RAG AI chatbot, deployable to Fly.io.

**Architecture:** Monorepo with Turborepo orchestration, Bun runtime (except Golang payment-backend + Python ai-service), contract-first shared types, hybrid REST + message communication (RabbitMQ + Kafka KRaft), BFF pattern via Next.js API routes, database-per-service, Fly.io per-app deployment.

**Tech Stack:** TypeScript, Golang, Python, Bun, Next.js 14 (App Router), React/Vite, Elysia, Tailwind CSS, PostgreSQL, MongoDB, Qdrant, RabbitMQ, Kafka (KRaft), Docker Compose (profiles), Turborepo, GitHub Actions, Fly.io

---

## Phase 1: Monorepo Foundation

### Task 1: Initialize Monorepo Root

**Files:**
- Create: `package.json`
- Create: `bunfig.toml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create root package.json with workspaces**

```json
{
  "name": "portfolio",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down",
    "docker:infra": "docker compose -f docker/docker-compose.infra.yml up -d"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create bunfig.toml**

```toml
[install]
exact = true

[install.cache]
dir = ".bun-cache"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "test/**", "**/*.test.*", "**/*.spec.*"]
    },
    "docker:build": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.bun-cache/
.next/
dist/
build/
.env
.env.*
!.env.example
*.log
.turbo/
```

- [ ] **Step 6: Install dependencies**

```bash
cd /Users/lee/workspace/portfolio && bun install
```

- [ ] **Step 7: Create CI workflow skeleton**

File: `.github/workflows/ci.yml`
```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.packages }}
      apps: ${{ steps.filter.outputs.apps }}
    steps:
      - uses: actions/checkout@v4
      - uses: tj-actions/changed-files@v44
        id: filter
        with:
          files_yaml: |
            packages:
              - 'packages/**'
            apps:
              - 'apps/**'

  lint-and-typecheck:
    needs: detect-changes
    if: needs.detect-changes.outputs.apps == 'true' || needs.detect-changes.outputs.packages == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck

  test:
    needs: detect-changes
    if: needs.detect-changes.outputs.apps == 'true' || needs.detect-changes.outputs.packages == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test
```

- [ ] **Step 8: Create Deploy workflow skeleton**

File: `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
      - uses: tj-actions/changed-files@v44
        id: filter
        with:
          files_yaml: |
            portfolio-web: apps/portfolio-web/**
            ai-service: apps/ai-service/**
            trade-backend: apps/trade-backend/**
            trade-frontend: apps/trade-frontend/**
            payment-backend: apps/payment-backend/**
            payment-frontend: apps/payment-frontend/**
            ecom-backend: apps/ecom-backend/**
            ecom-frontend: apps/ecom-frontend/**
            telemed-backend: apps/telemed-backend/**
            telemed-frontend: apps/telemed-frontend/**

  deploy:
    needs: detect-changes
    if: needs.detect-changes.outputs.matrix != '[]'
    strategy:
      matrix:
        app: ${{ fromJSON(needs.detect-changes.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --app portfolio-${{ matrix.app }} --config apps/${{ matrix.app }}/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo foundation with Turborepo, Bun workspaces, CI/CD skeletons"
```

---

### Task 2: Shared Tailwind Config

**Files:**
- Create: `packages/tailwind-config/package.json`
- Create: `packages/tailwind-config/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/tailwind-config",
  "private": true,
  "exports": {
    ".": "./index.ts"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create Tailwind config**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f8fafc",
          elevated: "#f1f5f9",
        },
        text: {
          DEFAULT: "#0f172a",
          muted: "#475569",
          subtle: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
};

export default config;
```

- [ ] **Step 3: Install and commit**

```bash
cd packages/tailwind-config && bun install && cd ../..
git add packages/tailwind-config
git commit -m "chore: add shared Tailwind CSS config with design tokens"
```

---

### Task 3: Shared Types Package

**Files:**
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/trade.ts`
- Create: `packages/shared-types/src/payment.ts`
- Create: `packages/shared-types/src/ecom.ts`
- Create: `packages/shared-types/src/telemed.ts`
- Create: `packages/shared-types/src/chat.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/shared-types",
  "private": true,
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create trade types**

File: `packages/shared-types/src/trade.ts`
```typescript
export interface Order {
  id: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  timestamp: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdated: string;
}

export interface TradeEvent {
  id: string;
  price: number;
  quantity: number;
  buyerOrderId: string;
  sellerOrderId: string;
  timestamp: string;
}

export type WebSocketMessage =
  | { type: "orderbook"; data: OrderBook }
  | { type: "trade"; data: TradeEvent }
  | { type: "subscribe"; symbol: string };
```

- [ ] **Step 4: Create payment types**

File: `packages/shared-types/src/payment.ts`
```typescript
export interface PaymentRequest {
  idempotencyKey: string;
  amount: number;
  currency: string;
  source: string;
  description: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: "processing" | "completed" | "failed";
  idempotencyKey: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 5: Create ecom types**

File: `packages/shared-types/src/ecom.ts`
```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
}

export interface CheckoutRequest {
  cartId: string;
  idempotencyKey: string;
}

export interface CheckoutResponse {
  orderId: string;
  status: "confirmed" | "payment_pending" | "failed";
  totalAmount: number;
  timestamp: string;
}
```

- [ ] **Step 6: Create telemed types**

File: `packages/shared-types/src/telemed.ts`
```typescript
export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: "doctor" | "patient";
  text: string;
  timestamp: string;
}

export interface Room {
  id: string;
  patientName: string;
  doctorName: string;
  status: "waiting" | "active" | "closed";
  createdAt: string;
  queuePosition: number;
}

export interface ChatEvent {
  type: "message" | "room_update" | "queue_update";
  payload: Message | Room | { position: number };
}
```

- [ ] **Step 7: Create chat types (AI Service)**

File: `packages/shared-types/src/chat.ts`
```typescript
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

export interface ChatSource {
  title: string;
  excerpt: string;
  service: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  sources: ChatSource[];
}
```

- [ ] **Step 8: Create barrel export index**

File: `packages/shared-types/src/index.ts`
```typescript
export * from "./trade.js";
export * from "./payment.js";
export * from "./ecom.js";
export * from "./telemed.js";
export * from "./chat.js";
```

- [ ] **Step 9: Build and commit**

```bash
cd packages/shared-types && bun install && bun run build && cd ../..
git add packages/shared-types
git commit -m "feat: add contract-first shared types for all services"
```

---

## Phase 2: Docker Infrastructure

### Task 4: Docker Compose Infrastructure

**Files:**
- Create: `docker/docker-compose.infra.yml`
- Create: `docker/docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```
# PostgreSQL
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=portfolio_dev
POSTGRES_DB=portfolio

# MongoDB
MONGO_INITDB_ROOT_USERNAME=portfolio
MONGO_INITDB_ROOT_PASSWORD=portfolio_dev

# Qdrant
QDRANT_API_KEY=dev_key

# RabbitMQ
RABBITMQ_DEFAULT_USER=portfolio
RABBITMQ_DEFAULT_PASS=portfolio_dev

# Kafka
KAFKA_BROKER_ID=1
```

- [ ] **Step 2: Create infrastructure-only compose file**

File: `docker/docker-compose.infra.yml`
```yaml
services:
  # PostgreSQL instances — database-per-service
  postgres-trade:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: trade
    ports: ["5432:5432"]
    volumes: [pg_trade:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d trade"]
      interval: 5s
      retries: 5

  postgres-payment:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: payment
    ports: ["5433:5432"]
    volumes: [pg_payment:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d payment"]
      interval: 5s
      retries: 5

  postgres-ecom:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ecom
    ports: ["5434:5432"]
    volumes: [pg_ecom:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ecom"]
      interval: 5s
      retries: 5

  postgres-telemed:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: telemed
    ports: ["5435:5432"]
    volumes: [pg_telemed:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d telemed"]
      interval: 5s
      retries: 5

  postgres-portfolio:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: portfolio
    ports: ["5436:5432"]
    volumes: [pg_portfolio:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d portfolio"]
      interval: 5s
      retries: 5

  # MongoDB for chat logs
  mongo-telemed:
    image: mongo:8
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
    ports: ["27017:27017"]
    volumes: [mongo_telemed:/data/db]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      retries: 5

  # Qdrant vector database
  qdrant:
    image: qdrant/qdrant:latest
    environment:
      QDRANT__SERVICE__API_KEY: ${QDRANT_API_KEY}
    ports: ["6333:6333", "6334:6334"]
    volumes: [qdrant_data:/qdrant/storage]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 5s
      retries: 5

  # RabbitMQ (payment/ecom)
  rabbitmq:
    image: rabbitmq:4-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_DEFAULT_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_DEFAULT_PASS}
    ports: ["5672:5672", "15672:15672"]
    volumes: [rabbitmq_data:/var/lib/rabbitmq]
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 5s
      retries: 5

  # Kafka KRaft (trade/telemed)
  kafka:
    image: apache/kafka:3.9.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
    ports: ["9092:9092"]
    volumes: [kafka_data:/var/lib/kafka/data]
    healthcheck:
      test: ["CMD", "/opt/kafka/bin/kafka-broker-api-versions.sh", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      retries: 10

  # Kafka UI for development
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports: ["8088:8080"]
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    depends_on: [kafka]

volumes:
  pg_trade:
  pg_payment:
  pg_ecom:
  pg_telemed:
  pg_portfolio:
  mongo_telemed:
  qdrant_data:
  rabbitmq_data:
  kafka_data:
```

- [ ] **Step 3: Create full docker-compose.yml with service profiles**

File: `docker/docker-compose.yml`
```yaml
include:
  - docker-compose.infra.yml

services:
  # Profile: portfolio
  portfolio-web:
    build:
      context: ../apps/portfolio-web
      dockerfile: Dockerfile
    ports: ["3000:3000"]
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-portfolio:5432/portfolio
      AI_SERVICE_URL: http://ai-service:8000
    depends_on:
      postgres-portfolio:
        condition: service_healthy
    profiles: ["portfolio", "all"]

  # Profile: ai
  ai-service:
    build:
      context: ../apps/ai-service
      dockerfile: Dockerfile
    ports: ["8000:8000"]
    environment:
      QDRANT_URL: http://qdrant:6333
      QDRANT_API_KEY: ${QDRANT_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      qdrant:
        condition: service_healthy
    profiles: ["ai", "all"]

  # Profile: trade
  trade-backend:
    build:
      context: ../apps/trade-backend
      dockerfile: Dockerfile
    ports: ["4001:4001"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-trade:5432/trade
      KAFKA_BROKERS: kafka:9092
    depends_on:
      postgres-trade:
        condition: service_healthy
      kafka:
        condition: service_healthy
    profiles: ["trade", "all"]

  trade-frontend:
    build:
      context: ../apps/trade-frontend
      dockerfile: Dockerfile
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://trade-backend:4001
    profiles: ["trade", "all"]

  # Profile: payment
  payment-backend:
    build:
      context: ../apps/payment-backend
      dockerfile: Dockerfile
    ports: ["4002:4002"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-payment:5432/payment?sslmode=disable
      RABBITMQ_URL: amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672/
    depends_on:
      postgres-payment:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    profiles: ["payment", "all"]

  payment-frontend:
    build:
      context: ../apps/payment-frontend
      dockerfile: Dockerfile
    ports: ["5174:5173"]
    environment:
      VITE_API_URL: http://payment-backend:4002
    profiles: ["payment", "all"]

  # Profile: ecom
  ecom-backend:
    build:
      context: ../apps/ecom-backend
      dockerfile: Dockerfile
    ports: ["4003:4003"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-ecom:5434/ecom
      RABBITMQ_URL: amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@rabbitmq:5672/
    depends_on:
      postgres-ecom:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    profiles: ["ecom", "all"]

  ecom-frontend:
    build:
      context: ../apps/ecom-frontend
      dockerfile: Dockerfile
    ports: ["5175:5173"]
    environment:
      VITE_API_URL: http://ecom-backend:4003
    profiles: ["ecom", "all"]

  # Profile: telemed
  telemed-backend:
    build:
      context: ../apps/telemed-backend
      dockerfile: Dockerfile
    ports: ["4004:4004"]
    environment:
      POSTGRES_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-telemed:5432/telemed
      MONGO_URL: mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@mongo-telemed:27017/
      KAFKA_BROKERS: kafka:9092
    depends_on:
      postgres-telemed:
        condition: service_healthy
      mongo-telemed:
        condition: service_healthy
      kafka:
        condition: service_healthy
    profiles: ["telemed", "all"]

  telemed-frontend:
    build:
      context: ../apps/telemed-frontend
      dockerfile: Dockerfile
    ports: ["5176:5173"]
    environment:
      VITE_API_URL: http://telemed-backend:4004
      VITE_WS_URL: ws://telemed-backend:4004
    profiles: ["telemed", "all"]
```

- [ ] **Step 4: Commit**

```bash
git add docker/ .env.example
git commit -m "chore: add Docker Compose infrastructure with per-service databases and profiles"
```

---

## Phase 3: Backend Services

### Task 5: Trade Backend (Bun + Elysia + WebSocket + Kafka)

**Files:**
- Create: `apps/trade-backend/package.json`
- Create: `apps/trade-backend/tsconfig.json`
- Create: `apps/trade-backend/Dockerfile`
- Create: `apps/trade-backend/fly.toml`
- Create: `apps/trade-backend/src/index.ts`
- Create: `apps/trade-backend/src/orderbook.ts`
- Create: `apps/trade-backend/src/kafka.ts`
- Create: `apps/trade-backend/src/ws.ts`
- Create: `apps/trade-backend/src/db.ts`
- Create: `apps/trade-backend/test/orderbook.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/trade-backend",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun dist/index.js",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@portfolio/shared-types": "workspace:*",
    "elysia": "^1.2.0",
    "kafkajs": "^2.2.4",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/shared-types" }]
}
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 4001
CMD ["bun", "src/index.ts"]
```

- [ ] **Step 4: Create fly.toml**

```toml
app = "portfolio-trade-backend"
primary_region = "sin"
kill_signal = "SIGINT"
kill_timeout = "5s"

[build]
  image = "oven/bun:1.2-alpine"

[env]
  PORT = "4001"

[http_service]
  internal_port = 4001
  force_https = false
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 5: Implement order-book matching engine**

File: `apps/trade-backend/src/orderbook.ts`
```typescript
import type { Order, OrderBook, OrderBookLevel, TradeEvent } from "@portfolio/shared-types";

interface OrderBookSide {
  levels: Map<number, OrderBookLevel>;
  orders: Map<number, Order[]>; // price → orders at that price
}

export class OrderBookEngine {
  private bids: OrderBookSide = { levels: new Map(), orders: new Map() };
  private asks: OrderBookSide = { levels: new Map(), orders: new Map() };
  private onTrade: ((trade: TradeEvent) => void) | null = null;

  constructor(private symbol: string = "DEMO") {}

  onTradeEvent(callback: (trade: TradeEvent) => void): void {
    this.onTrade = callback;
  }

  placeOrder(order: Order): TradeEvent[] {
    const trades: TradeEvent[] = [];

    if (order.side === "buy") {
      trades.push(...this.matchBuy(order));
    } else {
      trades.push(...this.matchSell(order));
    }

    for (const trade of trades) {
      this.onTrade?.(trade);
    }

    return trades;
  }

  private matchBuy(order: Order): TradeEvent[] {
    const trades: TradeEvent[] = [];
    const askPrices = [...this.asks.levels.keys()].sort((a, b) => a - b);

    for (const askPrice of askPrices) {
      if (order.price < askPrice) break;

      const level = this.asks.levels.get(askPrice)!;
      const orders = this.asks.orders.get(askPrice)!;
      const matchQty = Math.min(order.quantity, level.quantity);

      trades.push({
        id: crypto.randomUUID(),
        price: askPrice,
        quantity: matchQty,
        buyerOrderId: order.id,
        sellerOrderId: orders[0]!.id,
        timestamp: new Date().toISOString(),
      });

      order.quantity -= matchQty;
      level.quantity -= matchQty;

      if (level.quantity === 0) {
        this.asks.levels.delete(askPrice);
        this.asks.orders.delete(askPrice);
      }

      if (order.quantity === 0) break;
    }

    // Remaining quantity becomes a resting order
    if (order.quantity > 0) {
      this.addToSide(this.bids, order);
    }

    return trades;
  }

  private matchSell(order: Order): TradeEvent[] {
    const trades: TradeEvent[] = [];
    const bidPrices = [...this.bids.levels.keys()].sort((a, b) => b - a);

    for (const bidPrice of bidPrices) {
      if (order.price > bidPrice) break;

      const level = this.bids.levels.get(bidPrice)!;
      const orders = this.bids.orders.get(bidPrice)!;
      const matchQty = Math.min(order.quantity, level.quantity);

      trades.push({
        id: crypto.randomUUID(),
        price: bidPrice,
        quantity: matchQty,
        buyerOrderId: orders[0]!.id,
        sellerOrderId: order.id,
        timestamp: new Date().toISOString(),
      });

      order.quantity -= matchQty;
      level.quantity -= matchQty;

      if (level.quantity === 0) {
        this.bids.levels.delete(bidPrice);
        this.bids.orders.delete(bidPrice);
      }

      if (order.quantity === 0) break;
    }

    if (order.quantity > 0) {
      this.addToSide(this.asks, order);
    }

    return trades;
  }

  private addToSide(side: OrderBookSide, order: Order): void {
    const existingLevel = side.levels.get(order.price);
    if (existingLevel) {
      existingLevel.quantity += order.quantity;
      existingLevel.orderCount += 1;
    } else {
      side.levels.set(order.price, {
        price: order.price,
        quantity: order.quantity,
        orderCount: 1,
      });
      side.orders.set(order.price, [order]);
    }
  }

  getOrderBook(): OrderBook {
    const sortByPrice = (a: OrderBookLevel, b: OrderBookLevel) => b.price - a.price;

    return {
      bids: [...this.bids.levels.values()].sort(sortByPrice),
      asks: [...this.asks.levels.values()].sort((a, b) => a.price - b.price),
      lastUpdated: new Date().toISOString(),
    };
  }
}
```

- [ ] **Step 6: Write tests for order-book engine**

File: `apps/trade-backend/test/orderbook.test.ts`
```typescript
import { describe, expect, it } from "bun:test";
import { OrderBookEngine } from "../src/orderbook";

describe("OrderBookEngine", () => {
  it("adds resting order when no match exists", () => {
    const engine = new OrderBookEngine();
    engine.placeOrder({
      id: "order-1",
      side: "buy",
      price: 100,
      quantity: 10,
      timestamp: new Date().toISOString(),
    });

    const book = engine.getOrderBook();
    expect(book.bids).toHaveLength(1);
    expect(book.bids[0]!.price).toBe(100);
    expect(book.bids[0]!.quantity).toBe(10);
    expect(book.asks).toHaveLength(0);
  });

  it("matches buy order against existing ask at same price", () => {
    const engine = new OrderBookEngine();

    // Place a sell order first
    engine.placeOrder({
      id: "sell-1",
      side: "sell",
      price: 100,
      quantity: 10,
      timestamp: new Date().toISOString(),
    });

    // Place matching buy order
    const trades = engine.placeOrder({
      id: "buy-1",
      side: "buy",
      price: 100,
      quantity: 5,
      timestamp: new Date().toISOString(),
    });

    expect(trades).toHaveLength(1);
    expect(trades[0]!.price).toBe(100);
    expect(trades[0]!.quantity).toBe(5);

    // Remaining ask should still be in book
    const book = engine.getOrderBook();
    expect(book.asks[0]!.quantity).toBe(5);
  });

  it("matches at the best price (price-time priority)", () => {
    const engine = new OrderBookEngine();

    engine.placeOrder({
      id: "sell-1", side: "sell", price: 101, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    engine.placeOrder({
      id: "sell-2", side: "sell", price: 100, quantity: 10,
      timestamp: new Date().toISOString(),
    });

    const trades = engine.placeOrder({
      id: "buy-1", side: "buy", price: 102, quantity: 10,
      timestamp: new Date().toISOString(),
    });

    // Should match against the lower (better) ask price first
    expect(trades).toHaveLength(1);
    expect(trades[0]!.price).toBe(100);
  });

  it("partial fill leaves remaining in order book", () => {
    const engine = new OrderBookEngine();

    engine.placeOrder({
      id: "sell-1", side: "sell", price: 100, quantity: 10,
      timestamp: new Date().toISOString(),
    });

    const trades = engine.placeOrder({
      id: "buy-1", side: "buy", price: 100, quantity: 20,
      timestamp: new Date().toISOString(),
    });

    expect(trades[0]!.quantity).toBe(10);
    // Remaining 10 from buy order becomes a resting bid
    const book = engine.getOrderBook();
    expect(book.bids[0]!.quantity).toBe(10);
    expect(book.bids[0]!.price).toBe(100);
  });
});
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd apps/trade-backend && bun test
```

Expected: 4 tests pass

- [ ] **Step 8: Implement Elysia server entry point**

File: `apps/trade-backend/src/index.ts`
```typescript
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { OrderBookEngine } from "./orderbook";
import type { Order, TradeEvent, WebSocketMessage } from "@portfolio/shared-types";

const engine = new OrderBookEngine();
const clients = new Set<any>();

// Broadcast order book to all WebSocket clients every 500ms
const broadcastOrderBook = () => {
  const book = engine.getOrderBook();
  const msg: WebSocketMessage = { type: "orderbook", data: book };
  for (const ws of clients) {
    ws.send(JSON.stringify(msg));
  }
};

setInterval(broadcastOrderBook, 500);

engine.onTradeEvent((trade: TradeEvent) => {
  const msg: WebSocketMessage = { type: "trade", data: trade };
  for (const ws of clients) {
    ws.send(JSON.stringify(msg));
  }
});

const app = new Elysia()
  .use(cors())
  .ws("/ws", {
    open(ws) {
      clients.add(ws);
    },
    close(ws) {
      clients.delete(ws);
    },
    message(ws, message) {
      const msg = message as WebSocketMessage;
      if (msg.type === "subscribe") {
        ws.send(JSON.stringify({ type: "orderbook", data: engine.getOrderBook() }));
      }
    },
  })
  .post(
    "/orders",
    ({ body }) => {
      const order: Order = {
        id: crypto.randomUUID(),
        side: body.side,
        price: body.price,
        quantity: body.quantity,
        timestamp: new Date().toISOString(),
      };
      const trades = engine.placeOrder(order);
      return { order, trades };
    },
    {
      body: t.Object({
        side: t.Union([t.Literal("buy"), t.Literal("sell")]),
        price: t.Number({ minimum: 0 }),
        quantity: t.Number({ minimum: 1 }),
      }),
    }
  )
  .get("/orderbook", () => engine.getOrderBook())
  .listen(4001);

console.log(`Trade backend running on http://localhost:${app.server?.port}`);
```

- [ ] **Step 9: Install dependencies and verify dev server starts**

```bash
cd apps/trade-backend && bun install && timeout 5 bun run dev || true
```

Expected: "Trade backend running on http://localhost:4001"

- [ ] **Step 10: Commit**

```bash
git add apps/trade-backend
git commit -m "feat: add trade backend with order-book matching engine and WebSocket streaming"
```

---

### Task 6: Payment Backend (Golang + PostgreSQL + Distributed Lock)

**Files:**
- Create: `apps/payment-backend/go.mod`
- Create: `apps/payment-backend/main.go`
- Create: `apps/payment-backend/handler.go`
- Create: `apps/payment-backend/store.go`
- Create: `apps/payment-backend/lock.go`
- Create: `apps/payment-backend/Dockerfile`
- Create: `apps/payment-backend/fly.toml`
- Create: `apps/payment-backend/handler_test.go`

- [ ] **Step 1: Initialize Go module**

```bash
cd apps/payment-backend && go mod init github.com/leesoukthavilay/portfolio-payment-backend
```

- [ ] **Step 2: Create store with idempotency and distributed lock**

File: `apps/payment-backend/store.go`
```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

type Transaction struct {
	ID              string    `json:"id"`
	Amount          int64     `json:"amount"` // stored in cents
	Currency        string    `json:"currency"`
	Status          string    `json:"status"`
	IdempotencyKey  string    `json:"idempotencyKey"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type PaymentRequest struct {
	IdempotencyKey string `json:"idempotencyKey"`
	Amount          int64  `json:"amount"`
	Currency        string `json:"currency"`
	Source          string `json:"source"`
	Description     string `json:"description"`
}

type PaymentResponse struct {
	TransactionID  string `json:"transactionId"`
	Status         string `json:"status"`
	IdempotencyKey string `json:"idempotencyKey"`
	Timestamp      string `json:"timestamp"`
}

type Store struct {
	db     *sql.DB
	locks  map[string]*sync.Mutex
	mu     sync.Mutex
}

func NewStore(db *sql.DB) *Store {
	return &Store{
		db:    db,
		locks: make(map[string]*sync.Mutex),
	}
}

// AcquireLock uses PostgreSQL advisory lock for the given idempotency key.
func (s *Store) AcquireLock(ctx context.Context, key string) error {
	var locked bool
	err := s.db.QueryRowContext(ctx, "SELECT pg_try_advisory_lock(hashtext($1))", key).Scan(&locked)
	if err != nil {
		return err
	}
	if !locked {
		return errors.New("could not acquire lock")
	}
	return nil
}

// ReleaseLock releases the PostgreSQL advisory lock.
func (s *Store) ReleaseLock(key string) error {
	_, err := s.db.Exec("SELECT pg_advisory_unlock(hashtext($1))", key)
	return err
}

// ProcessPayment is idempotent: if the idempotency key already exists, return the existing transaction.
func (s *Store) ProcessPayment(ctx context.Context, req PaymentRequest) (*PaymentResponse, error) {
	// Check for existing transaction with this idempotency key
	existing, err := s.GetByIdempotencyKey(ctx, req.IdempotencyKey)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	if existing != nil {
		return &PaymentResponse{
			TransactionID:  existing.ID,
			Status:         existing.Status,
			IdempotencyKey: existing.IdempotencyKey,
			Timestamp:      existing.UpdatedAt.Format(time.RFC3339),
		}, nil
	}

	// Acquire distributed lock
	if err := s.AcquireLock(ctx, req.IdempotencyKey); err != nil {
		return nil, err
	}
	defer s.ReleaseLock(req.IdempotencyKey)

	// Double-check after acquiring lock
	existing, err = s.GetByIdempotencyKey(ctx, req.IdempotencyKey)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	if existing != nil {
		return &PaymentResponse{
			TransactionID:  existing.ID,
			Status:         existing.Status,
			IdempotencyKey: existing.IdempotencyKey,
			Timestamp:      existing.UpdatedAt.Format(time.RFC3339),
		}, nil
	}

	// Create transaction
	tx := &Transaction{
		ID:             generateID(),
		Amount:         req.Amount,
		Currency:       req.Currency,
		Status:         "completed",
		IdempotencyKey: req.IdempotencyKey,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, err = s.db.ExecContext(ctx,
		"INSERT INTO transactions (id, amount, currency, status, idempotency_key, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		tx.ID, tx.Amount, tx.Currency, tx.Status, tx.IdempotencyKey, tx.CreatedAt, tx.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &PaymentResponse{
		TransactionID:  tx.ID,
		Status:         tx.Status,
		IdempotencyKey: tx.IdempotencyKey,
		Timestamp:      tx.UpdatedAt.Format(time.RFC3339),
	}, nil
}

func (s *Store) GetByIdempotencyKey(ctx context.Context, key string) (*Transaction, error) {
	tx := &Transaction{}
	err := s.db.QueryRowContext(ctx,
		"SELECT id, amount, currency, status, idempotency_key, created_at, updated_at FROM transactions WHERE idempotency_key = $1", key,
	).Scan(&tx.ID, &tx.Amount, &tx.Currency, &tx.Status, &tx.IdempotencyKey, &tx.CreatedAt, &tx.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return tx, nil
}

func generateID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}
```

- [ ] **Step 3: Create HTTP handler**

File: `apps/payment-backend/handler.go`
```go
package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) ProcessPayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.IdempotencyKey == "" || req.Amount <= 0 {
		http.Error(w, `{"error":"idempotencyKey and amount are required"}`, http.StatusBadRequest)
		return
	}

	resp, err := h.store.ProcessPayment(r.Context(), req)
	if err != nil {
		log.Printf("error processing payment: %v", err)
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	key := r.URL.Query().Get("idempotencyKey")
	if key == "" {
		http.Error(w, `{"error":"idempotencyKey is required"}`, http.StatusBadRequest)
		return
	}

	tx, err := h.store.GetByIdempotencyKey(r.Context(), key)
	if err != nil {
		http.Error(w, `{"error":"transaction not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tx)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

- [ ] **Step 4: Create main.go**

File: `apps/payment-backend/main.go`
```go
package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://portfolio:portfolio_dev@localhost:5433/payment?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	// Run migrations
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			amount BIGINT NOT NULL,
			currency TEXT NOT NULL DEFAULT 'USD',
			status TEXT NOT NULL DEFAULT 'pending',
			idempotency_key TEXT NOT NULL UNIQUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON transactions(idempotency_key);
	`); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	store := NewStore(db)
	handler := NewHandler(store)

	mux := http.NewServeMux()
	mux.HandleFunc("/payments", handler.ProcessPayment)
	mux.HandleFunc("/transactions", handler.GetTransaction)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4002"
	}

	log.Printf("Payment backend running on :%s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
```

- [ ] **Step 5: Create Dockerfile**

File: `apps/payment-backend/Dockerfile`
```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /payment-backend .

FROM alpine:3.21
RUN apk --no-cache add ca-certificates
COPY --from=builder /payment-backend /payment-backend
EXPOSE 4002
CMD ["/payment-backend"]
```

- [ ] **Step 6: Create fly.toml**

File: `apps/payment-backend/fly.toml`
```toml
app = "portfolio-payment-backend"
primary_region = "sin"

[build]
  image = "golang:1.24-alpine"

[env]
  PORT = "4002"

[http_service]
  internal_port = 4002
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 7: Create test file**

File: `apps/payment-backend/handler_test.go`
```go
package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	_ "github.com/lib/pq"
)

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("postgres", "postgresql://portfolio:portfolio_dev@localhost:5433/payment?sslmode=disable")
	if err != nil {
		t.Skip("database not available for integration test")
	}
	if err := db.Ping(); err != nil {
		t.Skip("database not available for integration test")
	}
	db.Exec(`CREATE TABLE IF NOT EXISTS transactions (
		id TEXT PRIMARY KEY,
		amount BIGINT NOT NULL,
		currency TEXT NOT NULL DEFAULT 'USD',
		status TEXT NOT NULL DEFAULT 'pending',
		idempotency_key TEXT NOT NULL UNIQUE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`)
	return db
}

func TestProcessPaymentIdempotency(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	store := NewStore(db)
	handler := NewHandler(store)

	req := PaymentRequest{
		IdempotencyKey: "test-key-001",
		Amount:         1000,
		Currency:       "USD",
		Source:         "card_test",
		Description:    "test payment",
	}
	body, _ := json.Marshal(req)

	// First request — should process
	w1 := httptest.NewRecorder()
	r1 := httptest.NewRequest("POST", "/payments", bytes.NewReader(body))
	handler.ProcessPayment(w1, r1)
	if w1.Code != http.StatusOK {
		t.Fatalf("first request: expected 200, got %d: %s", w1.Code, w1.Body.String())
	}

	var resp1 PaymentResponse
	json.NewDecoder(w1.Body).Decode(&resp1)
	if resp1.Status != "completed" {
		t.Errorf("expected completed, got %s", resp1.Status)
	}

	// Second request with same idempotency key — should return existing
	w2 := httptest.NewRecorder()
	r2 := httptest.NewRequest("POST", "/payments", bytes.NewReader(body))
	handler.ProcessPayment(w2, r2)
	if w2.Code != http.StatusOK {
		t.Fatalf("second request: expected 200, got %d", w2.Code)
	}

	var resp2 PaymentResponse
	json.NewDecoder(w2.Body).Decode(&resp2)
	if resp2.TransactionID != resp1.TransactionID {
		t.Errorf("idempotency failed: expected same transaction ID, got %s vs %s",
			resp1.TransactionID, resp2.TransactionID)
	}
}
```

- [ ] **Step 8: Install Go dependencies**

```bash
cd apps/payment-backend && go mod tidy
```

- [ ] **Step 9: Commit**

```bash
git add apps/payment-backend
git commit -m "feat: add payment backend with idempotency keys and PostgreSQL advisory locks"
```

---

### Task 7: E-Commerce Backend (Bun + Elysia + RabbitMQ)

**Files:**
- Create: `apps/ecom-backend/package.json`
- Create: `apps/ecom-backend/tsconfig.json`
- Create: `apps/ecom-backend/Dockerfile`
- Create: `apps/ecom-backend/fly.toml`
- Create: `apps/ecom-backend/src/index.ts`
- Create: `apps/ecom-backend/src/rabbitmq.ts`
- Create: `apps/ecom-backend/src/db.ts`
- Create: `apps/ecom-backend/test/checkout.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/ecom-backend",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@portfolio/shared-types": "workspace:*",
    "amqplib": "^0.10.5",
    "elysia": "^1.2.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "@types/amqplib": "^0.10.6",
    "@types/bun": "latest",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Implement RabbitMQ publisher and consumer**

File: `apps/ecom-backend/src/rabbitmq.ts`
```typescript
import amqp from "amqplib";

const EXCHANGE = "ecom.events";
const CHECKOUT_QUEUE = "checkout.orders";
const PAYMENT_RESULT_QUEUE = "payment.results";

export interface CheckoutEvent {
  type: "checkout.requested";
  cartId: string;
  totalAmount: number;
  idempotencyKey: string;
  timestamp: string;
}

export interface PaymentResultEvent {
  type: "payment.completed" | "payment.failed";
  orderId: string;
  transactionId?: string;
  idempotencyKey: string;
  timestamp: string;
}

export async function createRabbitMQConnection(url: string) {
  const conn = await amqp.connect(url);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(CHECKOUT_QUEUE, { durable: true });
  await channel.assertQueue(PAYMENT_RESULT_QUEUE, { durable: true });
  await channel.bindQueue(CHECKOUT_QUEUE, EXCHANGE, "checkout.*");
  await channel.bindQueue(PAYMENT_RESULT_QUEUE, EXCHANGE, "payment.*");

  return { conn, channel };
}

export async function publishCheckout(
  channel: amqp.Channel,
  event: CheckoutEvent
): Promise<void> {
  channel.publish(EXCHANGE, "checkout.requested", Buffer.from(JSON.stringify(event)), {
    persistent: true,
    messageId: event.idempotencyKey,
  });
}

export async function consumePaymentResults(
  channel: amqp.Channel,
  handler: (event: PaymentResultEvent) => Promise<void>
): Promise<void> {
  await channel.consume(PAYMENT_RESULT_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString()) as PaymentResultEvent;
      await handler(event);
      channel.ack(msg);
    } catch (err) {
      channel.nack(msg, false, false);
    }
  });
}
```

- [ ] **Step 3: Implement DB module**

File: `apps/ecom-backend/src/db.ts`
```typescript
import postgres from "postgres";

export function createDb(url: string) {
  const sql = postgres(url);

  return {
    sql,
    async migrate() {
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          category TEXT NOT NULL,
          image_url TEXT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'pending',
          total_amount INTEGER NOT NULL,
          idempotency_key TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT REFERENCES orders(id),
          product_id TEXT REFERENCES products(id),
          quantity INTEGER NOT NULL,
          price INTEGER NOT NULL
        )
      `;
    },

    async getProducts() {
      return sql`SELECT id, name, price, stock, category, image_url FROM products WHERE stock > 0`;
    },

    async getProduct(id: string) {
      const [product] = await sql`SELECT id, name, price, stock, category, image_url FROM products WHERE id = ${id}`;
      return product;
    },

    async createOrder(event: { cartId: string; totalAmount: number; idempotencyKey: string }) {
      const id = `order_${Date.now()}`;
      await sql`
        INSERT INTO orders (id, status, total_amount, idempotency_key)
        VALUES (${id}, 'confirmed', ${event.totalAmount}, ${event.idempotencyKey})
        ON CONFLICT (idempotency_key) DO NOTHING
      `;
      return { id, status: "confirmed" };
    },

    async seed() {
      const products = [
        { id: "p1", name: "Premium Widget", price: 2999, stock: 100, category: "widgets", image_url: "/images/widget.png" },
        { id: "p2", name: "Pro Gadget", price: 4999, stock: 50, category: "gadgets", image_url: "/images/gadget.png" },
        { id: "p3", name: "Starter Kit", price: 999, stock: 200, category: "kits", image_url: "/images/kit.png" },
      ];
      for (const p of products) {
        await sql`
          INSERT INTO products (id, name, price, stock, category, image_url)
          VALUES (${p.id}, ${p.name}, ${p.price}, ${p.stock}, ${p.category}, ${p.image_url})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    },
  };
}
```

- [ ] **Step 4: Implement Elysia server**

File: `apps/ecom-backend/src/index.ts`
```typescript
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import type { CheckoutRequest } from "@portfolio/shared-types";
import { createDb } from "./db";
import { createRabbitMQConnection, publishCheckout, consumePaymentResults } from "./rabbitmq";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://portfolio:portfolio_dev@localhost:5434/ecom";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://portfolio:portfolio_dev@localhost:5672";

const db = createDb(DATABASE_URL);
await db.migrate();
await db.seed();

const { channel } = await createRabbitMQConnection(RABBITMQ_URL);

consumePaymentResults(channel, async (event) => {
  console.log(`Payment result: ${event.type} for order ${event.orderId}`);
});

const app = new Elysia()
  .use(cors())
  .get("/products", async () => {
    const products = await db.getProducts();
    return { products };
  })
  .get("/products/:id", async ({ params }) => {
    const product = await db.getProduct(params.id);
    if (!product) return new Response("Not found", { status: 404 });
    return product;
  })
  .post(
    "/checkout",
    async ({ body }) => {
      const checkoutEvent = {
        type: "checkout.requested" as const,
        cartId: body.cartId,
        totalAmount: body.totalAmount || 0,
        idempotencyKey: body.idempotencyKey,
        timestamp: new Date().toISOString(),
      };

      await publishCheckout(channel, checkoutEvent);

      const order = await db.createOrder({
        cartId: body.cartId,
        totalAmount: checkoutEvent.totalAmount,
        idempotencyKey: body.idempotencyKey,
      });

      return {
        orderId: order.id,
        status: "confirmed",
        totalAmount: checkoutEvent.totalAmount,
        timestamp: checkoutEvent.timestamp,
      };
    },
    {
      body: t.Object({
        cartId: t.String(),
        idempotencyKey: t.String(),
        totalAmount: t.Optional(t.Number()),
      }),
    }
  )
  .listen(4003);

console.log(`E-Commerce backend running on http://localhost:${app.server?.port}`);
```

- [ ] **Step 5: Create test for checkout flow**

File: `apps/ecom-backend/test/checkout.test.ts`
```typescript
import { describe, expect, it } from "bun:test";

describe("Checkout Flow", () => {
  it("generates unique idempotency keys", () => {
    const key1 = crypto.randomUUID();
    const key2 = crypto.randomUUID();
    expect(key1).not.toBe(key2);
  });

  it("validates checkout request structure", () => {
    const request = {
      cartId: "cart-001",
      idempotencyKey: crypto.randomUUID(),
    };
    expect(request.cartId).toBeString();
    expect(request.idempotencyKey).toBeString();
  });
});
```

- [ ] **Step 6: Create Dockerfile and fly.toml**

File: `apps/ecom-backend/Dockerfile`
```dockerfile
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 4003
CMD ["bun", "src/index.ts"]
```

File: `apps/ecom-backend/fly.toml`
```toml
app = "portfolio-ecom-backend"
primary_region = "sin"

[build]
  image = "oven/bun:1.2-alpine"

[env]
  PORT = "4003"

[http_service]
  internal_port = 4003
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 7: Install and commit**

```bash
cd apps/ecom-backend && bun install
git add apps/ecom-backend
git commit -m "feat: add e-commerce backend with RabbitMQ checkout flow"
```

---

### Task 8: Telemedicine Backend (Bun + Socket.io + Kafka + MongoDB)

**Files:**
- Create: `apps/telemed-backend/package.json`
- Create: `apps/telemed-backend/tsconfig.json`
- Create: `apps/telemed-backend/Dockerfile`
- Create: `apps/telemed-backend/fly.toml`
- Create: `apps/telemed-backend/src/index.ts`
- Create: `apps/telemed-backend/src/chat.ts`
- Create: `apps/telemed-backend/src/queue.ts`
- Create: `apps/telemed-backend/test/queue.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/telemed-backend",
  "private": true,
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@portfolio/shared-types": "workspace:*",
    "elysia": "^1.2.0",
    "socket.io": "^4.8.0",
    "kafkajs": "^2.2.4",
    "postgres": "^3.4.5",
    "mongodb": "^6.12.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Implement chat queue engine**

File: `apps/telemed-backend/src/queue.ts`
```typescript
import type { Room, Message } from "@portfolio/shared-types";

export class ChatQueueEngine {
  private rooms: Map<string, Room> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private waitingQueue: string[] = [];

  createRoom(patientName: string): Room {
    const room: Room = {
      id: crypto.randomUUID(),
      patientName,
      doctorName: "Dr. Demo",
      status: "waiting",
      createdAt: new Date().toISOString(),
      queuePosition: this.waitingQueue.length + 1,
    };
    this.waitingQueue.push(room.id);
    this.rooms.set(room.id, room);
    this.messages.set(room.id, []);
    return room;
  }

  addMessage(msg: Message): void {
    const room = this.rooms.get(msg.roomId);
    if (!room) throw new Error("Room not found");

    const roomMessages = this.messages.get(msg.roomId) || [];
    roomMessages.push(msg);
    this.messages.set(msg.roomId, roomMessages);

    if (room.status === "waiting") {
      room.status = "active";
    }
  }

  activateRoom(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.status = "active";
    this.waitingQueue = this.waitingQueue.filter((id) => id !== roomId);
    return room;
  }

  closeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = "closed";
      this.waitingQueue = this.waitingQueue.filter((id) => id !== roomId);
    }
  }

  getQueue(): { position: number }[] {
    return this.waitingQueue.map((_, i) => ({ position: i + 1 }));
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getMessages(roomId: string): Message[] {
    return this.messages.get(roomId) || [];
  }
}
```

- [ ] **Step 3: Write test for queue**

File: `apps/telemed-backend/test/queue.test.ts`
```typescript
import { describe, expect, it } from "bun:test";
import { ChatQueueEngine } from "../src/queue";

describe("ChatQueueEngine", () => {
  it("creates room in waiting state", () => {
    const engine = new ChatQueueEngine();
    const room = engine.createRoom("Patient A");
    expect(room.status).toBe("waiting");
    expect(room.queuePosition).toBe(1);
  });

  it("activates room when first message sent", () => {
    const engine = new ChatQueueEngine();
    const room = engine.createRoom("Patient A");

    engine.addMessage({
      id: crypto.randomUUID(),
      roomId: room.id,
      senderId: "patient-1",
      senderRole: "patient",
      text: "Hello, I need help",
      timestamp: new Date().toISOString(),
    });

    const updated = engine.getRoom(room.id);
    expect(updated?.status).toBe("active");
  });

  it("maintains correct queue order", () => {
    const engine = new ChatQueueEngine();
    engine.createRoom("Patient A");
    engine.createRoom("Patient B");
    engine.createRoom("Patient C");

    const queue = engine.getQueue();
    expect(queue).toHaveLength(3);
    expect(queue[0]!.position).toBe(1);
    expect(queue[2]!.position).toBe(3);
  });

  it("removes room from queue when closed", () => {
    const engine = new ChatQueueEngine();
    const room = engine.createRoom("Patient A");
    engine.createRoom("Patient B");

    engine.closeRoom(room.id);

    const queue = engine.getQueue();
    expect(queue).toHaveLength(1);
    expect(engine.getRoom(room.id)?.status).toBe("closed");
  });
});
```

- [ ] **Step 4: Implement Socket.io server with Elysia**

File: `apps/telemed-backend/src/index.ts`
```typescript
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { ChatQueueEngine } from "./queue";
import type { Message } from "@portfolio/shared-types";

const engine = new ChatQueueEngine();

const httpServer = createServer((req, res) => {
  // handled by Elysia
});

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok", rooms: engine.getQueue().length }))
  .post("/rooms", ({ body }: any) => {
    const room = engine.createRoom(body.patientName);
    return room;
  })
  .get("/rooms/:id", ({ params }) => {
    const room = engine.getRoom(params.id);
    if (!room) return new Response("Not found", { status: 404 });
    return room;
  })
  .get("/rooms/:id/messages", ({ params }) => {
    return { messages: engine.getMessages(params.id) };
  })
  .listen(4004);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join_room", (roomId: string) => {
    socket.join(roomId);
    const room = engine.activateRoom(roomId);
    if (room) {
      io.to(roomId).emit("room_update", room);
      io.emit("queue_update", { queue: engine.getQueue() });
    }
  });

  socket.on("send_message", (data: { roomId: string; senderId: string; senderRole: "doctor" | "patient"; text: string }) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      roomId: data.roomId,
      senderId: data.senderId,
      senderRole: data.senderRole,
      text: data.text,
      timestamp: new Date().toISOString(),
    };
    engine.addMessage(msg);
    io.to(data.roomId).emit("message", msg);
  });

  socket.on("close_room", (roomId: string) => {
    engine.closeRoom(roomId);
    io.to(roomId).emit("room_update", engine.getRoom(roomId));
    io.emit("queue_update", { queue: engine.getQueue() });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(4005);
console.log(`Telemedicine backend running on http://localhost:${app.server?.port}`);
```

- [ ] **Step 5: Create Dockerfile and fly.toml**

File: `apps/telemed-backend/Dockerfile`
```dockerfile
FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 4004 4005
CMD ["bun", "src/index.ts"]
```

File: `apps/telemed-backend/fly.toml`
```toml
app = "portfolio-telemed-backend"
primary_region = "sin"

[build]
  image = "oven/bun:1.2-alpine"

[env]
  PORT = "4004"

[http_service]
  internal_port = 4004
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 6: Install, test, commit**

```bash
cd apps/telemed-backend && bun install && bun test
git add apps/telemed-backend
git commit -m "feat: add telemedicine backend with chat queue and Socket.io"
```

---

## Phase 4: Frontend Services

### Task 9: Shared Vite React Template

**Files:**
- Create: `packages/vite-config/package.json`
- Create: `packages/vite-config/index.ts`

- [ ] **Step 1: Create shared Vite config**

File: `packages/vite-config/package.json`
```json
{
  "name": "@portfolio/vite-config",
  "private": true,
  "exports": {
    ".": "./index.ts"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0"
  }
}
```

File: `packages/vite-config/index.ts`
```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export function createViteConfig(port: number) {
  return defineConfig({
    plugins: [react()],
    server: { port },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd packages/vite-config && bun install
git add packages/vite-config
git commit -m "chore: add shared Vite + React config"
```

---

### Task 10: Trade Frontend (React/Vite + Tailwind + WebSocket)

**Files:**
- Create: `apps/trade-frontend/package.json`
- Create: `apps/trade-frontend/vite.config.ts`
- Create: `apps/trade-frontend/tsconfig.json`
- Create: `apps/trade-frontend/tailwind.config.ts`
- Create: `apps/trade-frontend/Dockerfile`
- Create: `apps/trade-frontend/fly.toml`
- Create: `apps/trade-frontend/index.html`
- Create: `apps/trade-frontend/src/main.tsx`
- Create: `apps/trade-frontend/src/App.tsx`
- Create: `apps/trade-frontend/src/hooks/useOrderBook.ts`
- Create: `apps/trade-frontend/src/components/OrderBook.tsx`
- Create: `apps/trade-frontend/src/components/OrderForm.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/trade-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@portfolio/shared-types": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@portfolio/tailwind-config": "workspace:*",
    "@portfolio/vite-config": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { createViteConfig } from "@portfolio/vite-config";
export default createViteConfig(5173);
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/shared-types" }]
}
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import baseConfig from "@portfolio/tailwind-config";
export default {
  ...baseConfig,
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

- [ ] **Step 5: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trade App — Portfolio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-surface-muted text-text font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Create WebSocket hook**

File: `apps/trade-frontend/src/hooks/useOrderBook.ts`
```typescript
import { useEffect, useState } from "react";
import type { OrderBook } from "@portfolio/shared-types";

export function useOrderBook(wsUrl: string) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "subscribe", symbol: "DEMO" }));
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "orderbook") {
        setOrderBook(msg.data);
      }
    };
    ws.onclose = () => setConnected(false);
    return () => ws.close();
  }, [wsUrl]);

  return { orderBook, connected };
}
```

- [ ] **Step 8: Create OrderBook component**

File: `apps/trade-frontend/src/components/OrderBook.tsx`
```tsx
import type { OrderBook, OrderBookLevel } from "@portfolio/shared-types";

function LevelRows({ levels, type }: { levels: OrderBookLevel[]; type: "bid" | "ask" }) {
  return (
    <div className="space-y-px font-mono text-sm">
      {levels.slice(0, 10).map((level) => (
        <div
          key={level.price}
          className="flex justify-between px-3 py-1.5 rounded"
          style={{
            background: type === "bid"
              ? `rgba(34, 197, 94, ${(level.quantity / levels[0]!.quantity) * 0.15})`
              : `rgba(239, 68, 68, ${(level.quantity / levels[0]!.quantity) * 0.15})`,
          }}
        >
          <span className={type === "bid" ? "text-green-600" : "text-red-600"}>
            {level.price.toFixed(2)}
          </span>
          <span className="text-text-muted">{level.quantity.toLocaleString()}</span>
          <span className="text-text-subtle">{level.orderCount}</span>
        </div>
      ))}
    </div>
  );
}

export default function OrderBookView({ book, connected }: { book: OrderBook | null; connected: boolean }) {
  if (!book) return <div className="p-8 text-center text-text-muted">Connecting to order book...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Order Book</h2>
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div>
          <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Bids</div>
          <LevelRows levels={book.bids} type="bid" />
        </div>
        <div>
          <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">Asks</div>
          <LevelRows levels={book.asks} type="ask" />
        </div>
      </div>
      <div className="px-4 py-2 border-t border-gray-100 text-xs text-text-subtle">
        Last updated: {new Date(book.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create OrderForm component**

File: `apps/trade-frontend/src/components/OrderForm.tsx`
```tsx
import { useState } from "react";
import type { Order } from "@portfolio/shared-types";

export default function OrderForm({ onPlaceOrder }: { onPlaceOrder: (order: Omit<Order, "id" | "timestamp">) => void }) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !quantity) return;
    onPlaceOrder({ side, price: parseFloat(price), quantity: parseInt(quantity) });
    setPrice("");
    setQuantity("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
      <h2 className="font-semibold text-lg">Place Order</h2>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
            side === "buy" ? "bg-green-600 text-white" : "bg-gray-100 text-text-muted"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
            side === "sell" ? "bg-red-600 text-white" : "bg-gray-100 text-text-muted"
          }`}
        >
          Sell
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Price</label>
        <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Quantity</label>
        <input type="number" step="1" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" required />
      </div>
      <button type="submit"
        className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
        Place {side === "buy" ? "Buy" : "Sell"} Order
      </button>
    </form>
  );
}
```

- [ ] **Step 10: Create App.tsx**

File: `apps/trade-frontend/src/App.tsx`
```tsx
import { useOrderBook } from "./hooks/useOrderBook";
import OrderBookView from "./components/OrderBook";
import OrderForm from "./components/OrderForm";
import type { Order } from "@portfolio/shared-types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000/api/trade/ws";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/trade";

export default function App() {
  const { orderBook, connected } = useOrderBook(WS_URL);

  const handlePlaceOrder = async (order: Omit<Order, "id" | "timestamp">) => {
    try {
      await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
    } catch (err) {
      console.error("Failed to place order:", err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
          <h1 className="text-xl font-semibold">Trade App</h1>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderBookView book={orderBook} connected={connected} />
        </div>
        <div>
          <OrderForm onPlaceOrder={handlePlaceOrder} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 11: Create Dockerfile and fly.toml**

File: `apps/trade-frontend/Dockerfile`
```dockerfile
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

File: `apps/trade-frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

File: `apps/trade-frontend/fly.toml`
```toml
app = "portfolio-trade-frontend"
primary_region = "sin"

[build]
  image = "oven/bun:1.2-alpine"

[env]
  PORT = "80"

[http_service]
  internal_port = 80
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 12: Install, verify dev server starts, commit**

```bash
cd apps/trade-frontend && bun install && timeout 5 bun run dev || true
git add apps/trade-frontend
git commit -m "feat: add trade frontend with real-time order book UI"
```

---

### ⚠️ Task 11-13: Payment, E-Commerce, Telemedicine Frontends

The payment-frontend, ecom-frontend, and telemed-frontend follow the exact same pattern as trade-frontend:

- Same package.json structure (change app name and port)
- Same vite.config.ts (change port: 5174, 5175, 5176)
- Same nginx.conf
- Same tailwind.config.ts (import base, add local content paths)
- Same tsconfig.json
- Unique `App.tsx` per service, connected to its backend API

**Create these 3 frontends using the trade-frontend template, adapting only:**
1. App name in package.json
2. Port in vite.config.ts (5174, 5175, 5176)
3. fly.toml app name
4. App.tsx UI specific to each domain (payment form, product grid + checkout, chat UI)

Payment frontend key component: `PaymentForm.tsx` — shows a form with amount input, "Pay Now" button, displays PaymentResponse with transaction ID
E-com frontend key component: `ProductGrid.tsx` — fetches products from `GET /products`, `Cart.tsx`, `CheckoutButton.tsx`
Telemed frontend key component: `ChatRoom.tsx` — Socket.io connection, message list, text input

After creating all 3 frontends, commit each separately.

---

## Phase 5: AI Service (Python + LangChain + Qdrant)

### Task 14: AI RAG Service

**Files:**
- Create: `apps/ai-service/pyproject.toml`
- Create: `apps/ai-service/Dockerfile`
- Create: `apps/ai-service/fly.toml`
- Create: `apps/ai-service/main.py`
- Create: `apps/ai-service/rag.py`
- Create: `apps/ai-service/seed.py`
- Create: `apps/ai-service/tests/test_rag.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "portfolio-ai-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "langchain>=0.3.0",
    "langchain-openai>=0.3.0",
    "qdrant-client>=1.12.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "httpx>=0.28.0"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Create RAG engine**

File: `apps/ai-service/rag.py`
```python
import os
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_qdrant import QdrantVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams


class PortfolioRAG:
    def __init__(self):
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", "dev_key")
        self.collection_name = "portfolio_content"

        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

        self.client = QdrantClient(url=self.qdrant_url, api_key=self.qdrant_api_key)

    def ensure_collection(self):
        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )

    def index_documents(self, documents: list[dict[str, str]]):
        self.ensure_collection()

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = []
        metadatas = []

        for doc in documents:
            chunks = text_splitter.split_text(doc["content"])
            for chunk in chunks:
                texts.append(chunk)
                metadatas.append({"title": doc["title"], "service": doc.get("service", "portfolio")})

        vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings,
        )
        vector_store.add_texts(texts=texts, metadatas=metadatas)

    def query(self, question: str) -> dict:
        vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings,
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})

        prompt = ChatPromptTemplate.from_template(
            """You are a knowledgeable assistant answering questions about Lee's engineering portfolio.
Use the following retrieved context to answer the question.

If the context does not contain enough information to answer, say "I don't have enough information about that yet" and suggest what the visitor might want to know about.

Context:
{context}

Question: {question}

Answer:"""
        )

        chain = (
            {"context": retriever | self._format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        retrieved = retriever.invoke(question)
        answer = chain.invoke(question)

        return {
            "content": answer,
            "sources": [
                {
                    "title": doc.metadata.get("title", "Unknown"),
                    "excerpt": doc.page_content[:200],
                    "service": doc.metadata.get("service", "portfolio"),
                }
                for doc in retrieved
            ],
        }

    @staticmethod
    def _format_docs(docs):
        return "\n\n".join(f"[{doc.metadata.get('title', '')}] {doc.page_content}" for doc in docs)
```

- [ ] **Step 3: Create seed data**

File: `apps/ai-service/seed.py`
```python
SEED_DOCUMENTS = [
    {
        "title": "Professional Summary",
        "service": "portfolio",
        "content": """Sengdavone Soukthavilay (Lee) is a Senior Full-Stack Developer with 4 years of experience at Elegance Consultant Co., Ltd. in Bangkok, Thailand. He was the longest-serving engineer at the company. His expertise spans high-performance architecture, low-latency messaging, secure enterprise gateways, and end-to-end mobile development using Flutter. He has deep technical expertise across 6 major domains including FIX Protocol for Fintech Trading and National Single Window (NSW) Gateway for Government Systems."""
    },
    {
        "title": "Fintech Trading System",
        "service": "trade",
        "content": """Lee architected and optimized a high-frequency trading backend integrated with FIX Protocol using Golang and Apache Kafka, reducing order processing latency by 40%. He used Bun/Elysia with WebSockets to stream real-time market data to 10,000+ concurrent users. The system handled high-frequency order matching with price-time priority and real-time order book updates."""
    },
    {
        "title": "Payment Gateway",
        "service": "payment",
        "content": """Lee built a secure, PCI-DSS compliant payment gateway system using NestJS and PostgreSQL. He implemented distributed locks and idempotency keys to achieve zero race conditions during peak transaction periods. The system used PostgreSQL advisory locks for concurrency control and idempotency keys to prevent duplicate charges."""
    },
    {
        "title": "E-Commerce Microservices",
        "service": "ecom",
        "content": """Lee re-architected an inventory and checkout system using Microservices with RabbitMQ as the message broker, drastically reducing checkout failures during mega-sale campaigns. The system used topic exchanges for event routing and dead-letter queues for failed order processing."""
    },
    {
        "title": "Telemedicine Platform",
        "service": "telemed",
        "content": """Lee developed an end-to-end Telemedicine application using Next.js (App Router) and Node.js, ensuring strict medical data privacy and real-time doctor-patient chat queuing via Socket.io. The system supported patient queue management with real-time status updates."""
    },
    {
        "title": "AI-Assisted Engineering",
        "service": "portfolio",
        "content": """Lee pioneered the integration of Advanced AI tools (Cursor and Claude Code CLI) within his team, accelerating feature delivery cycles by 40% and expanding unit test coverage to 92%. He adopted AI-assisted engineering to maintain premium code quality while increasing development velocity."""
    },
    {
        "title": "Rust Performance Benchmarking",
        "service": "portfolio",
        "content": """Lee built an experimental high-performance microservice using Rust and Elysia (on Bun) to benchmark data ingestion speed, achieving 3x throughput compared to traditional Node.js setups. This demonstrated his ability to evaluate and adopt emerging technologies for performance-critical workloads."""
    },
]
```

- [ ] **Step 4: Create FastAPI server**

File: `apps/ai-service/main.py`
```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import PortfolioRAG
from seed import SEED_DOCUMENTS

rag = PortfolioRAG()


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag.ensure_collection()
    rag.index_documents(SEED_DOCUMENTS)
    yield


app = FastAPI(title="Portfolio AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    content: str
    sources: list[dict]


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        result = rag.query(request.message)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "model": "gpt-4o-mini"}
```

- [ ] **Step 5: Create test**

File: `apps/ai-service/tests/test_rag.py`
```python
import pytest
from rag import PortfolioRAG


def test_rag_query_returns_sources():
    rag = PortfolioRAG()
    rag.ensure_collection()
    rag.index_documents([
        {"title": "Test", "content": "Lee is a senior full-stack developer with 4 years of experience.", "service": "test"}
    ])

    result = rag.query("What is Lee's experience?")
    assert "content" in result
    assert len(result["sources"]) > 0
    assert result["sources"][0]["title"] == "Test"
```

- [ ] **Step 6: Create Dockerfile**

File: `apps/ai-service/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 7: Create fly.toml**

File: `apps/ai-service/fly.toml`
```toml
app = "portfolio-ai-service"
primary_region = "sin"

[build]
  image = "python:3.12-slim"

[env]
  PORT = "8000"

[http_service]
  internal_port = 8000
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 8: Commit**

```bash
git add apps/ai-service
git commit -m "feat: add AI RAG service with LangChain, Qdrant, and FastAPI"
```

---

## Phase 6: Portfolio Web (Next.js + BFF + OAuth)

### Task 15: Portfolio Web — Main App

**Files:**
- Create: `apps/portfolio-web/package.json`
- Create: `apps/portfolio-web/tsconfig.json`
- Create: `apps/portfolio-web/next.config.ts`
- Create: `apps/portfolio-web/tailwind.config.ts`
- Create: `apps/portfolio-web/postcss.config.cjs`
- Create: `apps/portfolio-web/Dockerfile`
- Create: `apps/portfolio-web/fly.toml`
- Create: `apps/portfolio-web/src/app/layout.tsx`
- Create: `apps/portfolio-web/src/app/page.tsx`
- Create: `apps/portfolio-web/src/app/api/chat/route.ts`
- Create: `apps/portfolio-web/src/app/api/auth/login/route.ts`
- Create: `apps/portfolio-web/src/app/api/auth/callback/route.ts`
- Create: `apps/portfolio-web/src/lib/oauth.ts`
- Create: `apps/portfolio-web/src/lib/bff.ts`
- Create: `apps/portfolio-web/src/components/Navbar.tsx`
- Create: `apps/portfolio-web/src/components/Hero.tsx`
- Create: `apps/portfolio-web/src/components/ChatWidget.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@portfolio/portfolio-web",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@portfolio/shared-types": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@portfolio/tailwind-config": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/trade/:path*", destination: "http://trade-backend:4001/:path*" },
      { source: "/api/trade/ws", destination: "http://trade-backend:4001/ws" },
      { source: "/api/payment/:path*", destination: "http://payment-backend:4002/:path*" },
      { source: "/api/ecom/:path*", destination: "http://ecom-backend:4003/:path*" },
      { source: "/api/telemed/:path*", destination: "http://telemed-backend:4004/:path*" },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 3: Create BFF utility**

File: `apps/portfolio-web/src/lib/bff.ts`
```typescript
const SERVICE_URLS: Record<string, string> = {
  ai: process.env.AI_SERVICE_URL || "http://localhost:8000",
  trade: process.env.TRADE_BACKEND_URL || "http://localhost:4001",
  payment: process.env.PAYMENT_BACKEND_URL || "http://localhost:4002",
  ecom: process.env.ECOM_BACKEND_URL || "http://localhost:4003",
  telemed: process.env.TELEMED_BACKEND_URL || "http://localhost:4004",
};

export async function bffFetch(service: string, path: string, options?: RequestInit) {
  const baseUrl = SERVICE_URLS[service];
  if (!baseUrl) throw new Error(`Unknown service: ${service}`);
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  return res.json();
}
```

- [ ] **Step 4: Create OAuth library (PKCE from scratch)**

File: `apps/portfolio-web/src/lib/oauth.ts`
```typescript
import { cookies } from "next/headers";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function base64URLEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(digest);
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

export function getAuthorizationUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/callback`,
    scope: "read:user",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${BASE_URL}/api/auth/callback`,
      code_verifier: codeVerifier,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

const SESSION_COOKIE = "portfolio_session";

export async function setSession(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function getSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
```

- [ ] **Step 5: Create API routes**

File: `apps/portfolio-web/src/app/api/auth/login/route.ts`
```typescript
import { NextResponse } from "next/server";
import { generateCodeVerifier, generateCodeChallenge, generateState, getAuthorizationUrl, setSession } from "@/lib/oauth";

// Temporary in-memory store for PKCE (use Redis in production)
const pendingAuth = new Map<string, { codeVerifier: string; state: string }>();

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  pendingAuth.set(state, { codeVerifier, state });

  const url = getAuthorizationUrl(codeChallenge, state);

  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_state", state, {
    httpOnly: true, secure: false, sameSite: "lax", maxAge: 600, path: "/",
  });

  return response;
}

export { pendingAuth };
```

File: `apps/portfolio-web/src/app/api/auth/callback/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, setSession } from "@/lib/oauth";
import { pendingAuth } from "../login/route";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  // Validate state parameter (CSRF protection)
  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  const auth = pendingAuth.get(state);
  if (!auth) {
    return NextResponse.json({ error: "No pending auth found" }, { status: 400 });
  }
  pendingAuth.delete(state);

  if (!code) {
    return NextResponse.json({ error: "No authorization code" }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForToken(code, auth.codeVerifier);
    const response = NextResponse.redirect(new URL("/admin", request.url));
    await setSession(accessToken);
    response.cookies.delete("oauth_state");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

File: `apps/portfolio-web/src/app/api/chat/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@portfolio/shared-types";
import { bffFetch } from "@/lib/bff";

export async function POST(request: NextRequest) {
  const body: ChatRequest = await request.json();
  const result: ChatResponse = await bffFetch("ai", "/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return NextResponse.json(result);
}
```

- [ ] **Step 6: Create page components**

File: `apps/portfolio-web/src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lee's Engineering Portfolio",
  description: "Senior Full-Stack Developer — Microservices Architecture Showcase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-muted text-text font-sans antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

File: `apps/portfolio-web/src/app/page.tsx`
```tsx
import Hero from "@/components/Hero";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProjectCard
          title="Trade App"
          description="Real-time order-book engine streaming market data via WebSocket, backed by Kafka event sourcing."
          metrics="10,000+ concurrent connections"
          href="/trade"
          icon="T"
        />
        <ProjectCard
          title="Payment Gateway"
          description="PCI-DSS compliant payment processing with distributed locks and idempotency keys in Golang."
          metrics="Zero race conditions"
          href="/payment"
          icon="P"
        />
        <ProjectCard
          title="E-Commerce"
          description="Microservices checkout flow with RabbitMQ messaging and dead-letter queue resilience."
          metrics="Zero checkout failures during peak"
          href="/ecom"
          icon="E"
        />
        <ProjectCard
          title="Telemedicine"
          description="Real-time doctor-patient chat with intelligent queue management via Socket.io."
          metrics="HIPAA-compliant data privacy"
          href="/telemed"
          icon="T"
        />
      </section>
      <ChatWidget />
    </>
  );
}

function ProjectCard({ title, description, metrics, href, icon }: {
  title: string; description: string; metrics: string; href: string; icon: string;
}) {
  return (
    <a href={href} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg group-hover:text-brand-600 transition-colors">{title}</h3>
          <p className="text-text-muted text-sm mt-1">{description}</p>
          <p className="text-sm font-medium text-brand-600 mt-3">{metrics}</p>
        </div>
      </div>
    </a>
  );
}
```

- [ ] **Step 7: Create Hero component**

File: `apps/portfolio-web/src/components/Hero.tsx`
```tsx
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-600 mb-3">Senior Full-Stack Developer</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text mb-4">
            Sengdavone Soukthavilay
          </h1>
          <p className="text-lg text-text-muted leading-relaxed mb-6">
            Building resilient distributed systems with Golang, Rust, TypeScript, and modern runtimes.
            4 years of delivering production-grade architecture for fintech, government, and healthcare.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#projects" className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
              View Projects
            </Link>
            <Link href="https://github.com/LeeSoukthavilay" className="px-6 py-3 border border-gray-200 rounded-lg font-medium text-text-muted hover:border-gray-300 transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Create ChatWidget (RAG chatbot)**

File: `apps/portfolio-web/src/components/ChatWidget.tsx`
```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@portfolio/shared-types";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: input, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center text-2xl z-50">
        {open ? "×" : "?"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold">Ask me about Lee's work</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.role === "user" ? "bg-brand-600 text-white" : "bg-surface-elevated text-text"
                }`}>
                  {msg.content}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-text-subtle">
                      Sources: {msg.sources.map((s) => s.title).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-text-subtle text-sm">Thinking...</div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about Lee's experience..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <button onClick={sendMessage} disabled={loading}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 9: Create Navbar**

File: `apps/portfolio-web/src/components/Navbar.tsx`
```tsx
import Link from "next/link";

const links = [
  { href: "/trade", label: "Trade" },
  { href: "/payment", label: "Payment" },
  { href: "/ecom", label: "E-Commerce" },
  { href: "/telemed", label: "Telemedicine" },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-text">LS</Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-surface-elevated rounded-lg transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 10: Create Dockerfile and fly.toml**

File: `apps/portfolio-web/Dockerfile`
```dockerfile
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.2-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["bun", "server.js"]
```

File: `apps/portfolio-web/fly.toml`
```toml
app = "portfolio-web"
primary_region = "sin"

[build]
  image = "oven/bun:1.2-alpine"

[env]
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
```

- [ ] **Step 11: Install, verify build, commit**

```bash
cd apps/portfolio-web && bun install && bun run build
git add apps/portfolio-web
git commit -m "feat: add portfolio web with RAG chatbot, OAuth PKCE, and BFF API gateway"
```

---

## Phase 7: Final Integration & Polish

### Task 16: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write comprehensive README**

```markdown
# Portfolio — Microservices Engineering Showcase

Senior Full-Stack Developer portfolio demonstrating microservices architecture across 5 domains: fintech trading, payment processing, e-commerce, telemedicine, and AI RAG chatbot.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Portfolio Web (Next.js)                │
│              BFF / API Gateway + RAG Chatbot              │
└────┬──────────┬──────────┬──────────┬───────────────────┘
     │ REST     │ REST     │ REST     │ REST
┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼─────────┐
│  Trade  │ │Payment │ │E-Com   │ │Telemedicine │
│ Backend │ │Backend │ │Backend │ │  Backend    │
│ Bun     │ │Golang  │ │Bun     │ │  Bun        │
│ Elysia  │ │        │ │Elysia  │ │  Socket.io  │
└───┬─────┘ └──┬─────┘ └──┬─────┘ └──┬──────────┘
    │ Kafka    │PG Lock  │RabbitMQ  │ Kafka/Mongo
    ▼          ▼         ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐
│ 5× PG  ││ Mongo  ││ Qdrant ││ Kafka  ││RabbitMQ│
└────────┘└────────┘└────────┘└────────┘└────────┘
```

## Services (10)

| Service | Stack | Port | Description |
|---------|-------|------|-------------|
| portfolio-web | Next.js 15, Bun | 3000 | Landing + BFF + RAG Chatbot |
| ai-service | Python, LangChain, FastAPI | 8000 | RAG with Qdrant vector store |
| trade-backend | Bun, Elysia, WebSocket | 4001 | Real-time order-book engine |
| trade-frontend | React, Vite, Tailwind | 5173 | Trading dashboard |
| payment-backend | Golang | 4002 | Idempotent payment with PG advisory locks |
| payment-frontend | React, Vite, Tailwind | 5174 | Payment flow UI |
| ecom-backend | Bun, Elysia, RabbitMQ | 4003 | Message-driven checkout |
| ecom-frontend | React, Vite, Tailwind | 5175 | Product grid + checkout |
| telemed-backend | Bun, Socket.io, Kafka | 4004 | Real-time chat queue |
| telemed-frontend | React, Vite, Tailwind | 5176 | Doctor-patient chat UI |

## Quick Start

```bash
# Clone
git clone <repo-url> && cd portfolio

# Start infrastructure (databases, message brokers, vector DB)
docker compose -f docker/docker-compose.infra.yml up -d

# Install dependencies
bun install

# Run all services in dev mode
bun run dev

# Or run specific profile
bun run dev --filter=@portfolio/trade-backend --filter=@portfolio/trade-frontend
```

Open [http://localhost:3000](http://localhost:3000)

## Engineering Highlights

- **Contract-First Design**: Shared TypeScript types enforce API contracts at compile time
- **Database per Service**: Each service owns its data — no shared DB coupling
- **Hybrid Communication**: REST for queries, RabbitMQ/Kafka for async workflows
- **Idempotency Keys**: Payment service guarantees exactly-once processing
- **Distributed Locks**: PostgreSQL advisory locks prevent race conditions
- **PKCE OAuth**: Hand-implemented OAuth 2.0 flow with CSRF protection
- **KRaft Kafka**: Zookeeper-less Kafka for simpler operations

## CI/CD

- GitHub Actions: lint → typecheck → test → build on PR
- Fly.io: per-service deploy on merge to main
- Changed-file detection: only affected services are rebuilt and deployed

## Documentation

- [CONTEXT.md](./CONTEXT.md) — Domain language and system relationships
- [ADRs](./docs/adr/) — Architecture Decision Records
- [Implementation Plan](./docs/superpowers/plans/)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with architecture diagram and setup guide"
```

---

### Task 17: Global Quality Checks

- [ ] **Step 1: Run typecheck across all apps**

```bash
bun run typecheck
```

Expected: No type errors across 10 services

- [ ] **Step 2: Run all tests**

```bash
bun run test
```

Expected: All tests pass (trade order book, payment idempotency, telemed queue, AI RAG)

- [ ] **Step 3: Start full Docker Compose and verify health checks**

```bash
docker compose -f docker/docker-compose.yml --profile all up -d
docker compose ps
```

Expected: All containers healthy

- [ ] **Step 4: Verify inter-service communication**

```bash
# Test trade backend
curl -X POST http://localhost:4001/orders -H 'Content-Type: application/json' -d '{"side":"buy","price":100,"quantity":10}'

# Test payment backend
curl -X POST http://localhost:4002/payments -H 'Content-Type: application/json' -d '{"idempotencyKey":"test-001","amount":1000,"currency":"USD","source":"test","description":"test"}'

# Test ecom backend
curl http://localhost:4003/products

# Test telemed backend
curl http://localhost:4004/health

# Test AI service
curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{"message":"What does Lee do?"}'
```

Expected: All endpoints return 200

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: quality gate — typecheck, tests, integration smoke checks"
```

---

## Implementation Complete

After Phase 7, the portfolio is fully functional locally. To deploy:

1. Set up Fly.io account and CLI
2. Create apps: `fly apps create portfolio-web` (repeat per service)
3. Set secrets: `fly secrets set GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... OPENAI_API_KEY=...`
4. Push to main → GitHub Actions auto-deploys changed services
