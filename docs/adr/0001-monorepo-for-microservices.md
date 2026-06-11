# Monorepo for Microservices Portfolio

Decided to house all 10 microservices in a single Git repository (`monorepo`) rather than one repository per service (`polyrepo`), using Turborepo for orchestration and contract-first shared types.

**Context**: a portfolio must demonstrate architecture to a hiring manager in seconds. Polyrepo (10 separate GitHub repos) forces the reviewer to clone 10 repos and mentally reconstruct the system. A monorepo puts the full architecture diagram and inter-service contracts in one place — `git clone` → `docker compose up` → the entire system runs.

**Trade-off**: monorepos couple CI/CD pipelines (a change in one service triggers evaluation of all others) and require tooling discipline (Turborepo, `--filter`, changed-file detection). But for a solo developer portfolio, this coupling is theoretical — there's no team to step on each other. The real cost of polyrepo (fragmented visibility, 10 deploy pipelines, 10 sets of issues) far outweighs the monorepo's tooling tax.

**Why this would surprise a reader**: standard microservices doctrine says "one repo per deployable." We're deliberately violating that because the primary audience is a human reviewer, not a distributed team.
