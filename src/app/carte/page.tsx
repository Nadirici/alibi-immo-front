"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Transaction } from "@/types";

// Dynamic import pour éviter l'erreur SSR de Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <p className="text-gray-400 text-sm">Chargement de la carte...</p>
    </div>
  ),
});

export default function CartePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?department_code=78&page_size=200&map=true")
      .then((r) => r.json())
      .then((data) => setTransactions(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">Carte des transactions</h1>
      <p className="text-gray-500 mb-6">
        {loading ? "Chargement..." : `${transactions.length} transactions affichées · Yvelines`}
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
