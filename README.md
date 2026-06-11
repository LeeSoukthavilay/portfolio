# Portfolio -- Microservices Engineering Showcase

Senior Full-Stack Developer portfolio demonstrating microservices architecture across 5 domains.

## Architecture

```
+------------------------------------------------------------------+
|                    Portfolio Web (Next.js 15)                     |
|              BFF / API Gateway + RAG Chatbot                      |
+-------+-----------+-----------+-----------+----------------------+
        |           |           |           |
        | REST      | REST      | REST      | REST
+-------v----+ +----v----+ +----v----+ +----v----------+
|   Trade    | | Payment | | E-Com   | | Telemedicine  |
|   Backend  | | Backend | | Backend | |   Backend     |
|   Bun      | | Golang  | | Bun     | |   Bun         |
|   Elysia   | |         | | Elysia  | |   Elysia      |
|   WebSocket| |         | |RabbitMQ | |   Socket.io   |
+-----+------+ +----+----+ +----+----+ +----+----------+
      |             |           |            |
      | Kafka       | PG Lock   | RabbitMQ  | Kafka/Mongo
      v             v           v            v
+----------+ +----------+ +----------+ +----------+ +----------+
|  5x PG   | |  MongoDB | |  Qdrant  | |  Kafka   | | RabbitMQ |
+----------+ +----------+ +----------+ +----------+ +----------+
```

## Services (10)

| Service | Stack | Port | Description |
|---------|-------|------|-------------|
| portfolio-web | Next.js 15, Bun | 3000 | Landing page, BFF API gateway, RAG chatbot UI |
| ai-service | Python, LangChain, FastAPI | 8000 | RAG chatbot with Qdrant vector store |
| trade-backend | Bun, Elysia, WebSocket | 4001 | Real-time order-book engine with Kafka events |
| trade-frontend | React 19, Vite, Tailwind | 5173 | Trading dashboard with live WebSocket updates |
| payment-backend | Go 1.26, net/http, lib/pq | 4002 | Idempotent payment processing with PG advisory locks |
| payment-frontend | React 19, Vite, Tailwind | 5174 | Payment flow UI |
| ecom-backend | Bun, Elysia, RabbitMQ | 4003 | Message-driven checkout with inventory |
| ecom-frontend | React 19, Vite, Tailwind | 5175 | Product grid and checkout experience |
| telemed-backend | Bun, Elysia, Socket.io, Kafka | 4004 | Real-time doctor-patient chat queue |
| telemed-frontend | React 19, Vite, Tailwind | 5176 | Chat UI with rooms and queue management |

## Quick Start

```bash
git clone <repo-url> && cd portfolio

# Start infrastructure (databases, message brokers, vector DB)
docker compose -f docker/docker-compose.infra.yml up -d

# Install dependencies
bun install

# Run all services in dev mode
bun run dev

# Or run a specific service profile
docker compose -f docker/docker-compose.yml --profile trade up -d
```

Open http://localhost:3000

## Engineering Highlights

- **Contract-First Design**: Shared TypeScript types in `packages/shared-types` enforce API contracts at compile time across all frontend and backend services
- **Database per Service**: Each service owns its data store -- no shared database coupling, following the database-per-service pattern
- **Hybrid Communication**: REST for synchronous queries, RabbitMQ for async workflows, Kafka for event streaming, WebSocket/Socket.io for real-time updates
- **Idempotency Keys**: Payment service guarantees exactly-once processing with client-generated idempotency keys
- **Distributed Locks**: PostgreSQL advisory locks prevent race conditions in concurrent payment transactions
- **PKCE OAuth**: Hand-implemented OAuth 2.0 Authorization Code Flow with PKCE and CSRF token protection
- **KRaft Kafka**: Zookeeper-less Kafka (KRaft mode) for simpler operations and reduced infrastructure complexity
- **RAG Chatbot**: Python/LangChain chatbot with Qdrant vector store answering questions about engineering experience
- **Monorepo Orchestration**: Turborepo managing 10 apps with shared packages, coordinated build pipelines, and CI caching

## CI/CD

- **GitHub Actions**: lint -> typecheck -> test -> build on every PR (see `.github/workflows/ci.yml`)
- **Fly.io**: Per-service deployment triggered on merge to main (see `.github/workflows/deploy.yml`)
- **Changed-file detection**: Only affected services rebuilt through Turborepo caching

## Documentation

- [CONTEXT.md](./CONTEXT.md) -- Domain language, system relationships, and project terminology
- [ADRs](./docs/adr/) -- Architecture Decision Records covering key technical choices
