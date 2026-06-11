import Hero from "@/components/Hero";
import ChatWidget from "@/components/ChatWidget";
import Link from "next/link";

const projects = [
  {
    id: "trade",
    title: "Trade Engine",
    description:
      "Real-time order matching engine with WebSocket streaming, supporting 10,000+ concurrent connections with sub-millisecond latency.",
    metrics: "10,000+ concurrent connections",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-600"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    href: "https://trade.leesportfolio.dev",
    color: "border-t-brand-600",
  },
  {
    id: "payment",
    title: "Payment Gateway",
    description:
      "Idempotent payment processing with PostgreSQL partitioning, idempotency keys, and zero race conditions under concurrent writes.",
    metrics: "Zero race conditions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-600"
      >
        <rect x="1" y="5" width="22" height="14" rx="2" ry="2" />
        <line x1="1" y1="11" x2="23" y2="11" />
      </svg>
    ),
    href: "https://payment.leesportfolio.dev",
    color: "border-t-green-600",
  },
  {
    id: "ecom",
    title: "E-Commerce Platform",
    description:
      "Event-driven inventory and order management with RabbitMQ, ensuring zero checkout failures during peak traffic and seamless stock reconciliation.",
    metrics: "Zero checkout failures",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-purple-600"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    href: "https://ecom.leesportfolio.dev",
    color: "border-t-purple-600",
  },
  {
    id: "telemed",
    title: "Telemedicine Platform",
    description:
      "HIPAA-compliant virtual care platform with real-time video signaling, encrypted health records, and role-based access for patients and providers.",
    metrics: "HIPAA-compliant data privacy",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-teal-600"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    href: "https://telemed.leesportfolio.dev",
    color: "border-t-teal-600",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Projects Section */}
      <section
        id="projects"
        className="border-b border-surface-elevated bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 sm:mb-12 text-center">
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight text-text text-wrap balance">
              Production Systems
            </h2>
            <p className="mt-3 text-[clamp(0.9375rem,2vw,1.125rem)] text-text-muted text-wrap pretty">
              Four microservices, each demonstrating a different architectural
              pattern and technology stack.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-xl border border-surface-elevated bg-surface-muted p-5 sm:p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-t-2 ${project.color}`}
              >
                <div className="mb-3 sm:mb-4">{project.icon}</div>
                <h3 className="mb-2 text-base sm:text-lg font-semibold text-text group-hover:text-brand-600 transition-colors">
                  {project.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-text-muted text-wrap pretty">
                  {project.description}
                </p>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                  {project.metrics}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-surface-muted py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 sm:mb-12 text-center">
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight text-text text-wrap balance">
              Technology Stack
            </h2>
            <p className="mt-3 text-[clamp(0.9375rem,2vw,1.125rem)] text-text-muted text-wrap pretty">
              Modern tools and frameworks powering every service.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Frontend",
                items: [
                  "Next.js 15 (React 19)",
                  "Tailwind CSS v4",
                  "Vite + React",
                  "TypeScript",
                ],
                color: "text-brand-600",
              },
              {
                title: "Backend",
                items: [
                  "Bun + Elysia",
                  "Golang + Chi",
                  "Python + LangChain",
                  "WebSocket / Socket.io",
                ],
                color: "text-green-600",
              },
              {
                title: "Infrastructure",
                items: [
                  "Docker Compose",
                  "Fly.io / Railway",
                  "PostgreSQL / Qdrant",
                  "RabbitMQ / Redis",
                ],
                color: "text-purple-600",
              },
              {
                title: "Tooling",
                items: [
                  "Turborepo",
                  "Bun Workspaces",
                  "Husky + lint-staged",
                  "RTK Token Optimizer",
                ],
                color: "text-teal-600",
              },
            ].map((category) => (
              <div
                key={category.title}
                className="rounded-xl border border-surface-elevated bg-white p-4 sm:p-6 shadow-sm"
              >
                <h3
                  className={`mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-widest ${category.color}`}
                >
                  {category.title}
                </h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {category.items.map((item) => (
                    <li
                      key={item}
                      className="text-xs sm:text-sm text-text-muted flex items-center gap-2"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-text-subtle" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget />
    </>
  );
}
