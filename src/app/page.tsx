export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import StatCard from "@/components/StatCard";
import ListingRow from "@/components/ListingRow";
import listings from "@/data/listings.json";
import type { Listing } from "@/types";

export default function HomePage() {
  const featuredListings = (listings as Listing[]).slice(0, 3);

  return (
    <>
      <Hero />

      {/* Chiffres clés */}
      <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Transactions en base" value="70 000+" sub="Yvelines & Hauts-de-Seine" />
          <StatCard label="Prix médian/m² Yvelines" value="~3 200 €" sub="Source DVF 2023-2024" />
          <StatCard label="Prix médian/m² Hauts-de-Seine" value="~6 500 €" sub="Source DVF 2023-2024" />
        </div>
      </section>

      {/* Dernières offres */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6">
          Nos dernières offres
        </h2>
        <div className="flex flex-col gap-3">
          {featuredListings.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <a
            href="/offres"
            className="text-terracotta font-medium text-sm hover:underline"
          >
            Voir toutes nos offres →
          </a>
        </div>
      </section>

      {/* CTA contact */}
      <section id="contact" className="max-w-6xl mx-auto px-4 mt-16 mb-8">
        <div className="bg-terracotta-light rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-gray-800 mb-2">
            Vous souhaitez estimer votre bien ?
          </h2>
          <p className="text-gray-600 mb-6">
            Nos agents analysent le marché local avec des données réelles pour vous donner une estimation précise.
          </p>
          <a
            href="mailto:contact@alibi-immo.fr"
            className="bg-terracotta text-white px-8 py-3 rounded-lg font-medium hover:bg-terracotta/90 transition inline-block"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </>
  );
}
