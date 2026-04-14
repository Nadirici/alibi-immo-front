import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.IMMO_API_URL!;
const API_KEY = process.env.IMMO_API_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Paramètres autorisés à passer en aval
  const allowed = [
    "commune_name", "department_code", "property_type",
    "min_price", "max_price", "min_surface", "max_surface",
    "cursor", "page_size",
  ];
  const upstream = new URLSearchParams();
  allowed.forEach((key) => {
    const val = searchParams.get(key);
    if (val) upstream.set(key, val);
  });

  // Limiter à 500 points pour la carte
  if (searchParams.get("map") === "true") {
    upstream.set("page_size", "500");
  }

  const url = `${API_URL}/transactions?${upstream.toString()}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": API_KEY },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) {
    return NextResponse.json({ error: "upstream error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
