import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-surface-elevated bg-gradient-to-br from-surface-muted via-white to-brand-50">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600">
            Senior Full-Stack Developer
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl">
            Sengdavone Soukthavilay
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-muted sm:text-xl">
            I build resilient distributed systems at scale -- from
            high-frequency trading engines with 10,000+ concurrent WebSocket
            connections to HIPAA-compliant telemedicine platforms. Every
            service here is containerized, observable, and production-ready.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#projects"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-600 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              View Projects
            </Link>
            <Link
              href="https://github.com/LeeSoukthavilay/portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-surface-elevated bg-white px-8 text-sm font-semibold text-text-muted shadow-sm transition-all hover:border-text-subtle hover:text-text hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
