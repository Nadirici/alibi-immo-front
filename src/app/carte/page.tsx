import dynamic from "next/dynamic";

// Dynamic import pour éviter l'erreur SSR de Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <p className="text-gray-400 text-sm">Chargement de la carte...</p>
    </div>
  ),
});

async function getTransactions() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${base}/api/transactions?department_code=78&page_size=200&map=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export default async function CartePage() {
  const transactions = await getTransactions();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">Carte des transactions</h1>
      <p className="text-gray-500 mb-6">
        {transactions.length} transactions affichées · Yvelines & Hauts-de-Seine
      </p>
      <div className="h-[600px] rounded-xl overflow-hidden shadow border border-gray-100">
        <MapView transactions={transactions} />
      </div>
      <div className="mt-4 flex gap-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sage inline-block" /> &lt; 3 000 €/m²</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 3 000–5 000 €/m²</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 5 000–8 000 €/m²</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> &gt; 8 000 €/m²</span>
      </div>
    </div>
  );
}
