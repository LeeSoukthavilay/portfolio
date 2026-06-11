# Portfolio — Engineering Showcase Platform

A microservices-based portfolio that demonstrates senior full-stack engineering capability through live, interactive demos of fintech trading, payment processing, e-commerce, and telemedicine systems — orchestrated as a monorepo with contract-first design and deployable to Fly.io.

## Language

### Systems

**Portfolio Web**:
The public-facing landing page and API gateway (BFF) that narrates the engineer's impact metrics, hosts the AI chatbot, and routes requests to all backend services.
_Avoid_: Main site, homepage, gateway

**AI Service**:
A Python/LangChain RAG chatbot that answers visitor questions about the engineer's experience and projects by querying a vector store.
_Avoid_: Chatbot, LLM service, bot

**Trade App**:
A real-time order-book engine (Bun/Elysia/WebSocket) paired with a React dashboard, consuming market data events from Kafka.
_Avoid_: Trading platform, exchange, market app

**Payment App**:
A Golang payment gateway demonstrating distributed locks and idempotency keys with PostgreSQL persistence.
_Avoid_: Checkout, billing, transaction service

**E-Commerce App**:
A Bun/Elysia microservice with RabbitMQ-driven messaging for inventory and checkout flows.
_Avoid_: Shop, store, cart app

**Telemedicine App**:
A Bun/Socket.io real-time chat queue system simulating doctor-patient communication.
_Avoid_: Chat app, messaging, health app

### Infrastructure

**BFF (Backend For Frontend)**:
The Portfolio Web's Next.js API routes acting as the single entry point — aggregating backend responses, handling auth, and shielding internal services from the public internet.
_Avoid_: Proxy, middleware, gateway

**Contract**:
A shared TypeScript type definition in `packages/shared-types` that both frontend and backend import, ensuring request/response shapes stay synchronized at compile time.
_Avoid_: Schema, DTO, interface

**KRaft**:
Kafka's built-in consensus protocol that eliminates the Zookeeper dependency — used for trade and telemedicine event streams.
_Avoid_: Zookeeper mode, legacy Kafka

### Data

**Vector Store**:
Qdrant — a Rust-based vector database storing embeddings for RAG retrieval, enabling filtered semantic search across the engineer's portfolio content.
_Avoid_: Embedding DB, search index

**Idempotency Key**:
A client-generated unique key guaranteeing that retried payment requests produce exactly one transaction — no double charges.
_Avoid_: Dedup token, replay guard

### Messaging

**Order Book**:
A real-time sorted ledger of buy/sell orders, matched by price-time priority in the trade backend and streamed to the frontend via WebSocket.
_Avoid_: Market depth, order list, trade list

**Distributed Lock**:
A PostgreSQL advisory lock ensuring that only one process modifies a payment record at a time, preventing race conditions during concurrent transactions.
_Avoid_: Mutex, semaphore, critical section

## Relationships

- **Portfolio Web** routes visitor requests to **AI Service** (REST) and proxies API calls to all backend services
- **AI Service** queries the **Vector Store** (Qdrant) and may call any backend service for live data
- **Trade App** publishes order events to **Kafka**; the frontend consumes real-time **Order Book** snapshots via WebSocket
- **Payment App** validates **Idempotency Keys** before writing to its **PostgreSQL** database
- **E-Commerce App** publishes checkout events to **RabbitMQ**; **Payment App** may consume them to trigger payment flows
- **Telemedicine App** publishes chat events to **Kafka** for replayable message history

## Example dialogue

> **Visitor:** "What did Lee do at Elegance?"
> **AI Service:** retrieves relevant chunks from **Vector Store** → "Lee was the longest-serving engineer at Elegance Consultant (2022-2026), building fintech trading systems with FIX Protocol and Golang, and a PCI-DSS compliant payment gateway."
>
> **Visitor** (on Trade page): clicks "Place Order"
> **Trade Frontend** → REST → **Trade Backend** → matches order in **Order Book** → emits via WebSocket → frontend updates in real-time
>
> **Visitor** (on E-Commerce page): clicks "Checkout"
> **E-Com Backend** → publishes to **RabbitMQ** → **Payment Backend** consumes → acquires **Distributed Lock** → checks **Idempotency Key** → processes payment → returns confirmation

## Flagged ambiguities

- "checkout" was used interchangeably between E-Commerce and Payment — resolved: E-Commerce owns checkout flow; Payment only processes the payment leg
- "chat" was ambiguous between AI chatbot and Telemedicine chat — resolved: AI Service handles RAG Q&A; Telemedicine handles real-time doctor-patient messaging
