"use client";

export interface Filters {
  commune_name: string;
  property_type: string;
  min_surface: string;
  max_surface: string;
  min_price: string;
  max_price: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function SearchFilters({ filters, onChange }: Props) {
  const update = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Commune</label>
        <input
          value={filters.commune_name}
          onChange={(e) => update("commune_name", e.target.value.toUpperCase())}
          placeholder="Ex: VERSAILLES"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
        <select
          value={filters.property_type}
          onChange={(e) => update("property_type", e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        >
          <option value="">Tous</option>
          <option value="Appartement">Appartement</option>
          <option value="Maison">Maison</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Surface min (m²)</label>
        <input
          type="number"
          value={filters.min_surface}
          onChange={(e) => update("min_surface", e.target.value)}
          placeholder="0"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Surface max (m²)</label>
        <input
          type="number"
          value={filters.max_surface}
          onChange={(e) => update("max_surface", e.target.value)}
          placeholder="500"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Prix min (€)</label>
        <input
          type="number"
          value={filters.min_price}
          onChange={(e) => update("min_price", e.target.value)}
          placeholder="0"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Prix max (€)</label>
        <input
          type="number"
          value={filters.max_price}
          onChange={(e) => update("max_price", e.target.value)}
          placeholder="2000000"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
      </div>
    </div>
  );
}
