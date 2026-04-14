import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alibi Immo — Votre agence en Île-de-France",
  description: "Transactions immobilières, carte des prix et statistiques du marché en Yvelines et Hauts-de-Seine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-cream min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <footer className="bg-white border-t border-gray-100 mt-16 py-8 text-center text-sm text-gray-400">
          © 2024 Alibi Immo · Données DVF — data.gouv.fr
        </footer>
      </body>
    </html>
  );
}
