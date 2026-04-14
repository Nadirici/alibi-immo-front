import { NextRequest, NextResponse } from "next/server";
import type { Transaction, MarketStats } from "@/types";

const API_URL = process.env.IMMO_API_URL!;
const API_KEY = process.env.IMMO_API_KEY!;

async function fetchAllTransactions(commune_name: string): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let cursor: number | null = null;

  do {
    const params = new URLSearchParams({
      commune_name,
      page_size: "500",
      ...(cursor ? { cursor: String(cursor) } : {}),
    });
    const res = await fetch(`${API_URL}/transactions?${params}`, {
      headers: { "X-API-Key": API_KEY },
    });
    if (!res.ok) break;
    const page = await res.json();
    all.push(...page.results);
    cursor = page.next_cursor ?? null;
  } while (cursor);

  return all;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export async function GET(req: NextRequest): Promise<NextResponse<MarketStats | { error: string }>> {
  const commune_name = new URL(req.url).searchParams.get("commune");
  if (!commune_name) {
    return NextResponse.json({ error: "commune param required" }, { status: 400 });
  }

  const transactions = await fetchAllTransactions(commune_name);

  const pricesPerM2 = transactions
    .filter((t) => t.surface > 0)
    .map((t) => Math.round(t.price / t.surface));

  const count2023 = transactions.filter((t) => t.date_mutation.startsWith("2023")).length;
  const count2024 = transactions.filter((t) => t.date_mutation.startsWith("2024")).length;

  // Regrouper par mois (YYYY-MM)
  const byMonth: Record<string, number[]> = {};
  transactions.forEach((t) => {
    if (!t.surface || t.surface <= 0) return;
    const month = t.date_mutation.slice(0, 7); // "2023-01"
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(Math.round(t.price / t.surface));
  });

  const monthly = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, prices]) => ({
      month,
      median_price_m2: median(prices),
      count: prices.length,
    }));

  return NextResponse.json({
    commune_name,
    median_price_m2: median(pricesPerM2),
    count_2023: count2023,
    count_2024: count2024,
    monthly,
  });
}
