import type { Transaction } from "@/types";

export default function TransactionRow({ t }: { t: Transaction }) {
  const pricePerM2 = t.surface > 0 ? Math.round(t.price / t.surface) : null;
  return (
    <div className="flex items-center gap-4 bg-white rounded-lg px-4 py-3 border border-gray-100 hover:shadow-sm transition text-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{t.address ?? "Adresse non disponible"}</div>
        <div className="text-xs text-gray-400 mt-0.5">{t.commune_name} · {t.date_mutation}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-terracotta">{t.price.toLocaleString("fr-FR")} €</div>
        <div className="text-xs text-gray-400">{t.surface} m²</div>
      </div>
      <div className="text-right w-20 flex-shrink-0 hidden md:block">
        <div className="text-xs font-medium text-gray-600">
          {pricePerM2 ? `${pricePerM2.toLocaleString("fr-FR")} €/m²` : "—"}
        </div>
        <div className="text-xs text-gray-400">{t.property_type}</div>
      </div>
    </div>
  );
}
