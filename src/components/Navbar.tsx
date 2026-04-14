"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/offres", label: "Nos offres" },
  { href: "/recherche", label: "Marché" },
  { href: "/carte", label: "Carte" },
  { href: "/marche", label: "Statistiques" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-xl font-bold text-terracotta">
          Alibi Immo
        </Link>
        <div className="hidden md:flex gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-terracotta"
                  : "text-gray-600 hover:text-terracotta"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <a
          href="#contact"
          className="bg-terracotta text-white text-sm px-4 py-2 rounded-lg hover:bg-terracotta/90 transition"
        >
          Estimer mon bien
        </a>
      </div>
    </nav>
  );
}
