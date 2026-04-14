"use client";
import { useState, useCallback } from "react";
import SearchFilters, { type Filters } from "@/components/SearchFilters";
import TransactionRow from "@/components/TransactionRow";
import type { Transaction, TransactionPage } from "@/types";

const DEFAULT_FILTERS: Filters = {
  commune_name: "",
  property_type: "",
  min_surface: "",
  max_surface: "",
  min_price: "",
  max_price: "",
};

export default function RecherchePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const buildParams = (f: Filters, cur?: number | null) => {
    const p = new URLSearchParams({ page_size: "25" });
    if (f.commune_name) p.set("commune_name", f.commune_name);
    if (f.property_type) p.set("property_type", f.property_type);
    if (f.min_surface) p.set("min_surface", f.min_surface);
    if (f.max_surface) p.set("max_surface", f.max_surface);
    if (f.min_price) p.set("min_price", f.min_price);
    if (f.max_price) p.set("max_price", f.max_price);
    if (cur) p.set("cursor", String(cur));
    return p;
  };

  const search = useCallback(async (f: Filters) => {
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/transactions?${buildParams(f)}`);
    const data: TransactionPage = await res.json();
    setResults(data.results);
    setCursor(data.next_cursor ?? null);
    setLoading(false);
  }, []);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    const res = await fetch(`/api/transactions?${buildParams(filters, cursor)}`);
    const data: TransactionPage = await res.json();
    setResults((prev) => [...prev, ...data.results]);
    setCursor(data.next_cursor ?? null);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">Recherche marché</h1>
      <p className="text-gray-500 mb-8">Explorez 70 000+ transactions DVF réelles</p>

      <SearchFilters filters={filters} onChange={setFilters} />

      <button
        onClick={() => search(filters)}
        disabled={loading}
        className="bg-terracotta text-white px-6 py-2.5 rounded-lg font-medium hover:bg-terracotta/90 transition disabled:opacity-50 mb-6"
      >
        {loading ? "Chargement..." : "Rechercher"}
      </button>

      {searched && !loading && results.length === 0 && (
        <p className="text-gray-400 text-center py-12">Aucun résultat pour ces critères.</p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((t) => (
          <TransactionRow key={t.id} t={t} />
        ))}
      </div>

      {cursor && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="border border-terracotta text-terracotta px-6 py-2 rounded-lg text-sm font-medium hover:bg-terracotta/5 transition disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Charger plus"}
          </button>
        </div>
      )}
    </div>
  );
}
