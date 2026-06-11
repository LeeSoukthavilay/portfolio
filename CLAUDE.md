# Portfolio Monorepo — AI Context

## Branch Protection (main)

- **main branch is protected** — ห้าม push ตรง ต้องผ่าน PR เท่านั้น
- Status checks: `lint-and-typecheck` + `test` ต้องผ่านก่อน merge ได้
- Force push และ branch deletion ถูกบล็อกบน main
- Workflow: `สร้าง feature branch → push → เปิด PR → CI ผ่าน → merge`

## Monorepo Structure

```
apps/
├── trade-backend/       Bun/Elysia — order-book matching engine (REST + WS)
├── payment-backend/     Go — idempotent payment gateway
├── ecom-backend/        Bun/Elysia — product catalog + checkout (RabbitMQ)
├── telemed-backend/     Bun/Elysia — chat queue + Socket.io
├── ai-service/          Python/FastAPI — LangChain RAG + Qdrant
├── portfolio-web/       Next.js 15 — BFF gateway + OAuth PKCE + RAG chatbot UI
├── trade-frontend/      React/Vite — order-book dashboard
├── payment-frontend/    React/Vite — payment transaction viewer
├── ecom-frontend/       React/Vite — product listing + checkout
└── telemed-frontend/    React/Vite — telemedicine chat (Socket.io client)
packages/
├── shared-types/        Contract-first — trade, payment, ecom, telemed, chat
├── tailwind-config/     Shared design tokens
└── vite-config/         Shared Vite config factory
docker/
├── docker-compose.infra.yml   PostgreSQL ×5, MongoDB, Qdrant, RabbitMQ, Kafka
└── docker-compose.yml         All 10 app services (profiles)
```

## Skill Pipeline

Reference: `pipeline-skill.md`

```
/grill-me → /grill-with-docs → /writing-plans → /subagent-driven-development → /requesting-code-review → /finishing-a-development-branch
```

ห้ามข้าม Phase 1-3, ห้าม dispatch parallel subagents, ห้าม skip review

## Key Commands

```bash
bun install          # ติดตั้ง deps (Bun workspaces)
bun run typecheck    # TypeScript check ทุก package (Turbo)
bun run test         # รันทุก test
bun run dev          # เริ่ม dev servers ทั้งหมด
bun run build        # Build ทั้งหมด
bun run docker:infra # Start infrastructure containers
```

## Architecture Notes

- Contract-first: `@portfolio/shared-types` เป็น source of truth
- BFF Pattern: `portfolio-web` Next.js API routes → backend services
- Hybrid comms: REST (sync) + RabbitMQ (payment/ecom) + Kafka (trade/telemed)
- Database per service + Docker Compose profiles
- PG volumes mount at `/var/lib/postgresql` (PG18 PGDATA change)
- PKCE OAuth from scratch (crypto.subtle.digest SHA-256, GitHub provider)

## Documentation

- `CONTEXT.md` — domain language
- `docs/adr/` — 5 Architecture Decision Records
- `docs/superpowers/plans/` — implementation plans
