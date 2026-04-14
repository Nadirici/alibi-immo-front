"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: string;
  median_price_m2: number;
  count: number;
}

export default function MonthlyChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.month.slice(0, 7), // "2023-01"
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [`${(value as number).toLocaleString("fr-FR")} €/m²`, "Prix médian"]}
          labelStyle={{ color: "#374151", fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
        />
        <Bar dataKey="median_price_m2" fill="#C4622D" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
