# Dual Message Brokers: RabbitMQ + Kafka

Decided to run both RabbitMQ and Kafka, each serving different communication patterns, rather than standardizing on one.

**Context**: the portfolio includes two fundamentally different messaging workloads. E-Commerce → Payment is a transactional workflow requiring exchanges, bindings, dead-letter queues, and per-message acknowledgements — RabbitMQ's native model. Trade order events and Telemedicine chat are ordered, replayable event streams — Kafka's native model. Forcing either broker to do the other's job would demonstrate anti-patterns, not expertise.

**Assignment**:
- **RabbitMQ**: E-Commerce checkout → Payment processing, order fulfillment events
- **Kafka (KRaft)**: Trade order-book events, Telemedicine chat message streams

**Trade-off**: two brokers means two sets of operational knowledge, two Docker containers, and two sets of client libraries. But the portfolio's purpose IS to demonstrate breadth of operational knowledge. A single broker would hide capability; dual brokers showcase the judgment of when to use which.

**Why this would surprise a reader**: "pick one broker" is standard advice. This decision says: the engineer has production experience with both and knows their distinct sweet spots — and the portfolio is the proof.
