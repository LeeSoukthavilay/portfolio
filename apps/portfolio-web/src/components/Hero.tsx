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
              href="https://github.com/leesdavone"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-surface-elevated bg-white px-8 text-sm font-semibold text-text-muted shadow-sm transition-all hover:border-text-subtle hover:text-text hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
