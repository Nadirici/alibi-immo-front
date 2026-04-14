"use client";
import { useState } from "react";
import MonthlyChart from "@/components/MonthlyChart";
import type { MarketStats } from "@/types";

const COMMUNES = [
  "VERSAILLES", "SAINT-GERMAIN-EN-LAYE", "POISSY", "MANTES-LA-JOLIE",
  "BOULOGNE-BILLANCOURT", "NEUILLY-SUR-SEINE", "LEVALLOIS-PERRET",
  "COURBEVOIE", "NANTERRE", "COLOMBES", "SEVRES", "ISSY-LES-MOULINEAUX",
];

export default function MarchePage() {
  const [commune, setCommune] = useState("");
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = async (c: string) => {
    if (!c) return;
    setLoading(true);
    setError("");
    setStats(null);
    try {
      const res = await fetch(`/api/marche?commune=${encodeURIComponent(c)}`);
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Impossible de charger les données pour cette commune.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">Marché local</h1>
      <p className="text-gray-500 mb-8">Statistiques de marché par commune — données DVF 2023-2024</p>

      {/* Sélecteur commune */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <select
          value={commune}
          onChange={(e) => {
            setCommune(e.target.value);
            fetchStats(e.target.value);
          }}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 min-w-48"
        >
          <option value="">Choisir une commune...</option>
          {COMMUNES.map((c) => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {loading && <span className="text-sm text-gray-400 self-center">Chargement...</span>}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {stats && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-serif font-bold text-terracotta">
                {stats.median_price_m2.toLocaleString("fr-FR")} €
              </div>
              <div className="text-sm text-gray-600 mt-1">Prix médian/m²</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-serif font-bold text-sage">
                {stats.count_2023}
              </div>
              <div className="text-sm text-gray-600 mt-1">Transactions 2023</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-serif font-bold text-sage">
                {stats.count_2024}
              </div>
              <div className="text-sm text-gray-600 mt-1">Transactions 2024</div>
            </div>
          </div>

          {/* Graphique */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm">
              Évolution mensuelle du prix médian/m² — {commune.charAt(0) + commune.slice(1).toLowerCase()}
            </h2>
            <MonthlyChart data={stats.monthly} />
          </div>
        </div>
      )}

      {!stats && !loading && !commune && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Sélectionnez une commune pour afficher les statistiques.</p>
        </div>
      )}
    </div>
  );
}
