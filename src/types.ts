export interface Transaction {
  id: number;
  date_mutation: string;
  price: number;
  surface: number;
  property_type: "Appartement" | "Maison";
  rooms: number | null;
  address: string | null;
  parcel_ref: string | null;
  commune_code: string | null;
  commune_name: string | null;
  department_code: string | null;
  lat: number | null;
  lng: number | null;
}

export interface TransactionPage {
  results: Transaction[];
  next_cursor: number | null;
}

export interface Listing {
  id: string;
  titre: string;
  type: "Appartement" | "Maison";
  adresse: string;
  commune: string;
  surface: number;
  pieces: number;
  prix: number;
  photo: string;
  description: string;
}

export interface MarketStats {
  commune_name: string;
  median_price_m2: number;
  count_2023: number;
  count_2024: number;
  monthly: { month: string; median_price_m2: number; count: number }[];
}
