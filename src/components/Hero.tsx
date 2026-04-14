import Link from "next/link";

export default function Hero() {
  return (
    <div
      className="relative h-[520px] flex items-center justify-center text-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(https://images.unsplash.com/photo-1549517045-bc93de075e53?w=1400)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="text-white px-4">
        <p className="text-sage-light text-sm font-medium mb-3 uppercase tracking-widest">
          Yvelines &amp; Hauts-de-Seine
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
          L&apos;immobilier local,<br />avec des données réelles
        </h1>
        <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">
          Consultez 70 000+ transactions DVF, explorez la carte des prix
          et estimez votre bien au juste prix.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/recherche"
            className="bg-terracotta text-white px-6 py-3 rounded-lg font-medium hover:bg-terracotta/90 transition"
          >
            Explorer le marché
          </Link>
          <Link
            href="/offres"
            className="bg-white text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Voir nos offres
          </Link>
        </div>
      </div>
    </div>
  );
}
