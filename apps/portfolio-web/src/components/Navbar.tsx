import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "https://trade.leesportfolio.dev", label: "Trade" },
  { href: "https://payment.leesportfolio.dev", label: "Payment" },
  { href: "https://ecom.leesportfolio.dev", label: "E-Commerce" },
  { href: "https://telemed.leesportfolio.dev", label: "Telemedicine" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-surface-elevated bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-text transition-colors hover:text-brand-600"
        >
          LS
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={
                link.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="text-sm font-medium text-text-muted transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
