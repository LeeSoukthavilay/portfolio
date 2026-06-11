# Hybrid Communication: REST + Message Broker

Decided on a hybrid inter-service communication pattern: synchronous REST for query/command-response flows, asynchronous messaging (RabbitMQ/Kafka) for transactional workflows.

**Context**: pure REST creates cascading failures — if the Payment service is down, the E-Commerce checkout fails immediately with no retry path. Pure messaging makes simple request-response flows (e.g., "get user's order history") unnecessarily complex with correlation IDs and reply queues. The hybrid approach uses each where it's strongest.

**Decision boundary**:
- **REST**: Portfolio Web → AI Service (Q&A), any frontend → its backend (CRUD), health checks, config reads
- **Messaging**: E-Commerce checkout → Payment processing, Trade order events → streaming consumers, Telemedicine chat persistence

**Trade-off**: two communication patterns means two sets of error handling, two monitoring strategies, and two mental models during debugging. But the alternative — forcing everything through one pattern — creates worse problems: REST-only loses resilience; messaging-only adds latency and complexity to simple reads.

**Why this would surprise a reader**: startups often pick "REST everywhere" or "event-driven everything" as a religious choice. This decision says: use the right tool for each interaction, not a one-size-fits-all dogma.
