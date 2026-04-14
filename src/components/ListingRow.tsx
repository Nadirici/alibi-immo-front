import type { Listing } from "@/types";
import Image from "next/image";

interface Props {
  listing: Listing;
}

export default function ListingRow({ listing }: Props) {
  return (
    <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden">
        <Image
          src={listing.photo}
          alt={listing.titre}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{listing.titre}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {listing.adresse}, {listing.commune}
            </p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{listing.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-terracotta font-bold text-base">
              {listing.prix.toLocaleString("fr-FR")} €
            </div>
            <div className="text-xs text-gray-500">
              {listing.surface} m² · {listing.pieces} pièces
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {Math.round(listing.prix / listing.surface).toLocaleString("fr-FR")} €/m²
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
