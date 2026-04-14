"use client";
import { useState } from "react";
import ListingRow from "@/components/ListingRow";
import listingsData from "@/data/listings.json";
import type { Listing } from "@/types";

const listings = listingsData as Listing[];

export default function OffresPage() {
  const [typeFilter, setTypeFilter] = useState<"" | "Appartement" | "Maison">("");
  const [maxPrice, setMaxPrice] = useState<number>(2000000);

  const filtered = listings.filter((l) => {
    if (typeFilter && l.type !== typeFilter) return false;
    if (l.prix > maxPrice) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">Nos offres</h1>
      <p className="text-gray-500 mb-8">{filtered.length} bien{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | "Appartement" | "Maison")}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          >
            <option value="">Tous</option>
            <option value="Appartement">Appartement</option>
            <option value="Maison">Maison</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Budget max : {maxPrice.toLocaleString("fr-FR")} €
          </label>
          <input
            type="range"
            min={50000}
            max={1500000}
            step={50000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-48 accent-terracotta"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Aucun bien ne correspond à vos critères.</p>
        ) : (
          filtered.map((l) => <ListingRow key={l.id} listing={l} />)
        )}
      </div>
    </div>
  );
}
