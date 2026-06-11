# Fly.io for Per-Service Deployment

Decided to deploy each microservice to Fly.io individually, using Fly's internal network (`.internal` domains) for inter-service communication, over a single VPS running Docker Compose.

**Context**: a single VPS with Docker Compose is simpler and cheaper, but it undermines the microservices narrative. If everything runs on one machine via `docker compose up`, the "microservices" claim looks like a monolith in containers. Fly.io's per-app deployment (`fly deploy` per service) proves that each service has an independent lifecycle — the defining characteristic of microservices.

**Public/private boundary**:
- **Public**: Portfolio Web, all frontends (Trade, Payment, E-Com, Telemedicine)
- **Private** (`.internal` only): All backends, AI Service — accessible only through Portfolio Web (BFF)

**Trade-off**: 10 Fly.io apps cost more than one VPS and require per-app CI/CD configuration. But the cost is modest for a portfolio (~$30-60/mo for minimal instances), and the per-app deployment is the pedagogical value — it's the architecture being demonstrated, not just the app.

**Why this would surprise a reader**: "Portfolio traffic doesn't need this" is correct. The deployment IS the portfolio — the infrastructure itself demonstrates capability (CI/CD pipelines, internal networking, zero-trust public/private boundaries).
