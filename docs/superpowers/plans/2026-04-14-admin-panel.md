# Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un panel d'administration complet sur `/admin` pour qu'Alibi Immo gère ses annonces et ses leads, en remplaçant le fichier `listings.json` mock par une vraie base Supabase.

**Architecture:** Next.js App Router dans le même repo. Supabase Auth via `@supabase/ssr` avec middleware de protection. Server Actions pour le CRUD. Le site public lit les annonces depuis Supabase au lieu de `listings.json`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), @supabase/ssr

---

## Structure des fichiers

```
src/
├── middleware.ts                              # CRÉER — protection /admin/*
├── lib/
│   ├── supabase-server.ts                    # CRÉER — client Supabase côté serveur
│   └── supabase-browser.ts                   # CRÉER — client Supabase côté navigateur
├── app/
│   ├── actions/
│   │   ├── listings.ts                       # CRÉER — Server Actions CRUD annonces
│   │   └── leads.ts                          # CRÉER — Server Action lecture leads
│   ├── admin/
│   │   ├── layout.tsx                        # CRÉER — layout admin avec AdminNavbar
│   │   ├── page.tsx                          # CRÉER — dashboard stats
│   │   ├── login/
│   │   │   └── page.tsx                      # CRÉER — formulaire auth
│   │   ├── listings/
│   │   │   ├── page.tsx                      # CRÉER — liste annonces
│   │   │   ├── new/page.tsx                  # CRÉER — création annonce
│   │   │   └── [id]/edit/page.tsx            # CRÉER — édition annonce
│   │   └── leads/
│   │       └── page.tsx                      # CRÉER — liste leads
│   ├── api/
│   │   └── listings/route.ts                 # CRÉER — GET public listings
│   ├── offres/
│   │   ├── page.tsx                          # MODIFIER — server component + pass data
│   │   └── _components/OffresClient.tsx      # CRÉER — filtres client-side
│   └── page.tsx                              # MODIFIER — lire Supabase
├── components/
│   ├── admin/
│   │   ├── AdminNavbar.tsx                   # CRÉER
│   │   └── ListingForm.tsx                   # CRÉER — formulaire partagé new/edit
│   └── ListingRow.tsx                        # MODIFIER — adapter nouveaux champs
├── types.ts                                  # MODIFIER — interface Listing complète
└── data/
    └── listings.json                         # SUPPRIMER
```

---

### Task 1: Supabase — setup packages, tables, clients

**Files:**
- Modify: `package.json` (npm install)
- Create: `src/lib/supabase-server.ts`
- Create: `src/lib/supabase-browser.ts`
- Modify: `.env.local`

- [ ] **Step 1: Installer les packages**

```bash
cd C:\Users\nadir\Desktop\VsCode\alibi-immo-front
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Créer les tables dans Supabase**

Aller dans Supabase → SQL Editor → coller et exécuter :

```sql
-- Table listings
CREATE TABLE listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text,
  titre text NOT NULL,
  statut text NOT NULL DEFAULT 'actif',
  type text NOT NULL,
  ville text NOT NULL,
  code_postal text NOT NULL,
  prix integer NOT NULL,
  prix_hors_honoraires integer,
  honoraires_pct numeric(5,2),
  surface numeric(8,2) NOT NULL,
  pieces integer NOT NULL,
  chambres integer,
  salle_de_bains integer,
  charges integer,
  taxe_fonciere integer,
  etage text,
  annee_construction integer,
  etat_general text,
  chauffage text,
  chauffage_type text,
  cuisine text,
  exposition text,
  vue text,
  ouvertures text,
  ascenseur boolean DEFAULT false,
  cave boolean DEFAULT false,
  dpe text,
  ges text,
  points_forts text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON listings
  FOR SELECT USING (true);

CREATE POLICY "Auth write" ON listings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Table leads
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  email text NOT NULL,
  telephone text,
  adresse_bien text NOT NULL,
  surface numeric,
  pieces integer,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read leads" ON leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public insert leads" ON leads
  FOR INSERT WITH CHECK (true);
```

- [ ] **Step 3: Ajouter les variables d'env dans `.env.local`**

Récupérer les valeurs dans Supabase → Project Settings → API :

```bash
# Ajouter dans .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 4: Créer `src/lib/supabase-server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

- [ ] **Step 5: Créer `src/lib/supabase-browser.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 6: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ .env.local package.json package-lock.json
git commit -m "feat: add Supabase SSR clients and database tables"
```

---

### Task 2: Middleware auth

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Créer `src/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPath = request.nextUrl.pathname === "/admin/login";

  if (isAdminPath && !isLoginPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isLoginPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add admin middleware auth guard via Supabase"
```

---

### Task 3: Mise à jour des types + Server Actions

**Files:**
- Modify: `src/types.ts`
- Create: `src/app/actions/listings.ts`
- Create: `src/app/actions/leads.ts`

- [ ] **Step 1: Mettre à jour `src/types.ts`**

Remplacer l'interface `Listing` existante :

```typescript
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
  reference: string | null;
  titre: string;
  statut: "nouveaute" | "actif" | "compromis" | "vendu";
  type: "Appartement" | "Maison";
  ville: string;
  code_postal: string;
  prix: number;
  prix_hors_honoraires: number | null;
  honoraires_pct: number | null;
  surface: number;
  pieces: number;
  chambres: number | null;
  salle_de_bains: number | null;
  charges: number | null;
  taxe_fonciere: number | null;
  etage: string | null;
  annee_construction: number | null;
  etat_general: string | null;
  chauffage: string | null;
  chauffage_type: string | null;
  cuisine: string | null;
  exposition: string | null;
  vue: string | null;
  ouvertures: string | null;
  ascenseur: boolean;
  cave: boolean;
  dpe: string | null;
  ges: string | null;
  points_forts: string[];
  photos: string[];
  description: string;
  created_at: string;
}

export interface MarketStats {
  commune_name: string;
  median_price_m2: number;
  count_2023: number;
  count_2024: number;
  monthly: { month: string; median_price_m2: number; count: number }[];
}
```

- [ ] **Step 2: Créer `src/app/actions/listings.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Listing } from "@/types";

export async function getListings(): Promise<Listing[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Listing[]) ?? [];
}

export async function getPublicListings(): Promise<Listing[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .in("statut", ["actif", "nouveaute"])
    .order("created_at", { ascending: false });
  return (data as Listing[]) ?? [];
}

export async function getListing(id: string): Promise<Listing | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Listing) ?? null;
}

export async function createListing(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const payload = extractPayload(formData);
  const { error } = await supabase.from("listings").insert([payload]);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/listings");
  revalidatePath("/offres");
  revalidatePath("/");
  redirect("/admin/listings");
}

export async function updateListing(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const payload = extractPayload(formData);
  const { error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/listings");
  revalidatePath("/offres");
  revalidatePath("/");
  redirect("/admin/listings");
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/listings");
  revalidatePath("/offres");
  revalidatePath("/");
}

function extractPayload(formData: FormData) {
  const num = (key: string) => {
    const v = formData.get(key);
    return v && v !== "" ? Number(v) : null;
  };
  return {
    reference: (formData.get("reference") as string) || null,
    titre: formData.get("titre") as string,
    statut: formData.get("statut") as string,
    type: formData.get("type") as string,
    ville: formData.get("ville") as string,
    code_postal: formData.get("code_postal") as string,
    prix: Number(formData.get("prix")),
    prix_hors_honoraires: num("prix_hors_honoraires"),
    honoraires_pct: num("honoraires_pct"),
    surface: Number(formData.get("surface")),
    pieces: Number(formData.get("pieces")),
    chambres: num("chambres"),
    salle_de_bains: num("salle_de_bains"),
    charges: num("charges"),
    taxe_fonciere: num("taxe_fonciere"),
    etage: (formData.get("etage") as string) || null,
    annee_construction: num("annee_construction"),
    etat_general: (formData.get("etat_general") as string) || null,
    chauffage: (formData.get("chauffage") as string) || null,
    chauffage_type: (formData.get("chauffage_type") as string) || null,
    cuisine: (formData.get("cuisine") as string) || null,
    exposition: (formData.get("exposition") as string) || null,
    vue: (formData.get("vue") as string) || null,
    ouvertures: (formData.get("ouvertures") as string) || null,
    ascenseur: formData.get("ascenseur") === "true",
    cave: formData.get("cave") === "true",
    dpe: (formData.get("dpe") as string) || null,
    ges: (formData.get("ges") as string) || null,
    points_forts: JSON.parse(
      (formData.get("points_forts") as string) || "[]"
    ),
    photos: JSON.parse((formData.get("photos") as string) || "[]"),
    description: formData.get("description") as string,
  };
}
```

- [ ] **Step 3: Créer `src/app/actions/leads.ts`**

```typescript
"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface Lead {
  id: string;
  nom: string;
  email: string;
  telephone: string | null;
  adresse_bien: string;
  surface: number | null;
  pieces: number | null;
  message: string | null;
  created_at: string;
}

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Lead[]) ?? [];
}
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/app/actions/
git commit -m "feat: update Listing type and add Server Actions for listings and leads"
```

---

### Task 4: AdminNavbar + Layout admin

**Files:**
- Create: `src/components/admin/AdminNavbar.tsx`
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Créer `src/components/admin/AdminNavbar.tsx`**

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/listings", label: "Annonces" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <nav className="bg-gray-900 text-white h-14 flex items-center px-6 gap-8 sticky top-0 z-50">
      <span className="font-serif font-bold text-terracotta text-lg">
        Alibi Immo <span className="text-gray-400 text-xs font-sans font-normal ml-1">Admin</span>
      </span>
      <div className="flex gap-6 flex-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm transition-colors ${
              pathname === l.href
                ? "text-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 hover:text-white transition-colors"
      >
        Déconnexion
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Créer `src/app/admin/layout.tsx`**

```typescript
import AdminNavbar from "@/components/admin/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ src/app/admin/layout.tsx
git commit -m "feat: add AdminNavbar and admin layout"
```

---

### Task 5: Page Login

**Files:**
- Create: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Créer `src/app/admin/login/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="font-serif text-2xl font-bold text-gray-800 mb-1">
          Alibi Immo
        </h1>
        <p className="text-sm text-gray-400 mb-8">Espace administration</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-terracotta text-white rounded-lg py-2.5 text-sm font-medium hover:bg-terracotta/90 transition disabled:opacity-50 mt-2"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tester manuellement**

Démarrer le serveur : `npm run dev`
- Aller sur `http://localhost:3000/admin` → doit rediriger vers `/admin/login`
- Se connecter avec un compte Supabase Auth (en créer un dans Supabase → Authentication → Users si besoin)
- Après login → doit rediriger vers `/admin`

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/
git commit -m "feat: add admin login page with Supabase Auth"
```

---

### Task 6: Dashboard

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Créer `src/app/admin/page.tsx`**

```typescript
import Link from "next/link";
import { getListings } from "@/app/actions/listings";
import { getLeads } from "@/app/actions/leads";

export default async function AdminDashboard() {
  const [listings, leads] = await Promise.all([getListings(), getLeads()]);

  const activeCount = listings.filter(
    (l) => l.statut === "actif" || l.statut === "nouveaute"
  ).length;
  const lastListing = listings[0];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-8">
        Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-serif font-bold text-terracotta">
            {activeCount}
          </div>
          <div className="text-sm text-gray-500 mt-1">Annonces actives</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-serif font-bold text-sage">
            {leads.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Leads reçus</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-800 truncate">
            {lastListing?.titre ?? "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {lastListing
              ? `Ajoutée le ${new Date(lastListing.created_at).toLocaleDateString("fr-FR")}`
              : "Aucune annonce"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Dernière annonce</div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link
          href="/admin/listings/new"
          className="bg-terracotta text-white rounded-xl p-5 hover:bg-terracotta/90 transition"
        >
          <div className="font-semibold mb-1">+ Nouvelle annonce</div>
          <div className="text-sm text-terracotta-light/80">
            Ajouter un bien au catalogue
          </div>
        </Link>
        <Link
          href="/admin/leads"
          className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition"
        >
          <div className="font-semibold text-gray-800 mb-1">
            Voir les leads
          </div>
          <div className="text-sm text-gray-400">
            {leads.length} contact{leads.length > 1 ? "s" : ""} en attente
          </div>
        </Link>
      </div>

      {/* CRM Placeholder */}
      <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center opacity-60">
        <div className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full mb-4">
          Prochainement
        </div>
        <h2 className="font-serif text-lg font-semibold text-gray-700 mb-2">
          CRM Négociateur
        </h2>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Suivi des contacts vendeurs et acheteurs, pipeline de transactions,
          historique des interactions et score de chaleur des leads.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier dans le navigateur**

`http://localhost:3000/admin` → les 3 stat cards s'affichent (0 si tables vides), section CRM grisée visible.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add admin dashboard with stats and CRM placeholder"
```

---

### Task 7: Page liste annonces

**Files:**
- Create: `src/app/admin/listings/page.tsx`

- [ ] **Step 1: Créer `src/app/admin/listings/page.tsx`**

```typescript
import Link from "next/link";
import { getListings, deleteListing } from "@/app/actions/listings";

const STATUT_COLORS: Record<string, string> = {
  nouveaute: "bg-green-100 text-green-700",
  actif: "bg-blue-100 text-blue-700",
  compromis: "bg-amber-100 text-amber-700",
  vendu: "bg-gray-100 text-gray-500",
};

const STATUT_LABELS: Record<string, string> = {
  nouveaute: "Nouveauté",
  actif: "Actif",
  compromis: "Compromis",
  vendu: "Vendu",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const allListings = await getListings();
  const listings = statut
    ? allListings.filter((l) => l.statut === statut)
    : allListings;

  const tabs = ["", "nouveaute", "actif", "compromis", "vendu"];
  const tabLabels: Record<string, string> = {
    "": "Tous",
    nouveaute: "Nouveauté",
    actif: "Actif",
    compromis: "Compromis",
    vendu: "Vendu",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-800">
          Annonces
        </h1>
        <Link
          href="/admin/listings/new"
          className="bg-terracotta text-white text-sm px-4 py-2 rounded-lg hover:bg-terracotta/90 transition"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {/* Tabs filtres */}
      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={tab ? `/admin/listings?statut=${tab}` : "/admin/listings"}
            className={`text-sm px-4 py-2 -mb-px transition-colors ${
              statut === tab || (!statut && tab === "")
                ? "border-b-2 border-terracotta text-terracotta font-medium"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tabLabels[tab]}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="text-gray-400 text-center py-16">
          Aucune annonce dans cette catégorie.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Réf.</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Titre</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Ville</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Prix</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {listing.reference ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                    {listing.titre}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {listing.ville} {listing.code_postal}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {listing.prix.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        STATUT_COLORS[listing.statut] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUT_LABELS[listing.statut] ?? listing.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(listing.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Link
                      href={`/admin/listings/${listing.id}/edit`}
                      className="text-xs text-terracotta hover:underline"
                    >
                      Modifier
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteListing(listing.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          if (!confirm("Supprimer cette annonce ?")) e.preventDefault();
                        }}
                      >
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier dans le navigateur**

`http://localhost:3000/admin/listings` → tableau vide (ou avec annonces si des données existent), tabs fonctionnels.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/listings/page.tsx
git commit -m "feat: add admin listings list page with status tabs"
```

---

### Task 8: Composant ListingForm

**Files:**
- Create: `src/components/admin/ListingForm.tsx`

Ce composant est partagé entre `/new` et `/edit`. Il gère en client-side les tags (points forts) et les URLs de photos, puis les sérialise dans des `<input hidden>` avant soumission au Server Action.

- [ ] **Step 1: Créer `src/components/admin/ListingForm.tsx`**

```typescript
"use client";

import { useState } from "react";
import type { Listing } from "@/types";

interface Props {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<Listing>;
}

const STATUTS = ["nouveaute", "actif", "compromis", "vendu"];
const TYPES = ["Appartement", "Maison"];
const DPE_VALUES = ["A", "B", "C", "D", "E", "F", "G"];

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ListingForm({ action, defaultValues = {} }: Props) {
  const [tags, setTags] = useState<string[]>(defaultValues.points_forts ?? []);
  const [tagInput, setTagInput] = useState("");
  const [photos, setPhotos] = useState<string[]>(defaultValues.photos ?? []);
  const [photoInput, setPhotoInput] = useState("");
  const [ascenseur, setAscenseur] = useState(defaultValues.ascenseur ?? false);
  const [cave, setCave] = useState(defaultValues.cave ?? false);

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  const addPhoto = () => {
    const v = photoInput.trim();
    if (v && !photos.includes(v)) setPhotos([...photos, v]);
    setPhotoInput("");
  };

  return (
    <form action={action} className="space-y-8">
      {/* Bloc 1 — Général */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">Général</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Référence" name="reference" defaultValue={defaultValues.reference} placeholder="VA2298" />
          <Field label="Titre" name="titre" defaultValue={defaultValues.titre} placeholder="T2 Le Pecq 39 m²" required />
          <SelectField label="Statut" name="statut" options={STATUTS} defaultValue={defaultValues.statut ?? "actif"} required />
          <SelectField label="Type" name="type" options={TYPES} defaultValue={defaultValues.type} required />
          <Field label="Ville" name="ville" defaultValue={defaultValues.ville} required />
          <Field label="Code postal" name="code_postal" defaultValue={defaultValues.code_postal} required />
        </div>
      </section>

      {/* Bloc 2 — Prix & Surface */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">Prix & Surface</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Prix TTC (€)" name="prix" type="number" defaultValue={defaultValues.prix} required />
          <Field label="Prix hors honoraires (€)" name="prix_hors_honoraires" type="number" defaultValue={defaultValues.prix_hors_honoraires} />
          <Field label="Honoraires (%)" name="honoraires_pct" type="number" defaultValue={defaultValues.honoraires_pct} />
          <Field label="Surface (m²)" name="surface" type="number" defaultValue={defaultValues.surface} required />
          <Field label="Pièces" name="pieces" type="number" defaultValue={defaultValues.pieces} required />
          <Field label="Chambres" name="chambres" type="number" defaultValue={defaultValues.chambres} />
          <Field label="Salle de bains" name="salle_de_bains" type="number" defaultValue={defaultValues.salle_de_bains} />
          <Field label="Charges (€/mois)" name="charges" type="number" defaultValue={defaultValues.charges} />
          <Field label="Taxe foncière (€/an)" name="taxe_fonciere" type="number" defaultValue={defaultValues.taxe_fonciere} />
        </div>
      </section>

      {/* Bloc 3 — Caractéristiques */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">Caractéristiques</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Field label="Étage" name="etage" defaultValue={defaultValues.etage} placeholder="RDC, 1, 2..." />
          <Field label="Année construction" name="annee_construction" type="number" defaultValue={defaultValues.annee_construction} />
          <Field label="État général" name="etat_general" defaultValue={defaultValues.etat_general} />
          <Field label="Chauffage" name="chauffage" defaultValue={defaultValues.chauffage} placeholder="Gaz, Électrique..." />
          <SelectField label="Type chauffage" name="chauffage_type" options={["Individuel", "Collectif"]} defaultValue={defaultValues.chauffage_type} />
          <Field label="Cuisine" name="cuisine" defaultValue={defaultValues.cuisine} />
          <SelectField label="Exposition" name="exposition" options={["Nord", "Sud", "Est", "Ouest", "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest"]} defaultValue={defaultValues.exposition} />
          <Field label="Vue" name="vue" defaultValue={defaultValues.vue} />
          <Field label="Ouvertures" name="ouvertures" defaultValue={defaultValues.ouvertures} />
          <SelectField label="DPE" name="dpe" options={DPE_VALUES} defaultValue={defaultValues.dpe} />
          <SelectField label="GES" name="ges" options={DPE_VALUES} defaultValue={defaultValues.ges} />

          {/* Toggles */}
          <div className="flex flex-col gap-3 col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="hidden" name="ascenseur" value={String(ascenseur)} />
              <button
                type="button"
                onClick={() => setAscenseur(!ascenseur)}
                className={`w-10 h-6 rounded-full transition-colors ${ascenseur ? "bg-terracotta" : "bg-gray-200"}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${ascenseur ? "translate-x-4" : ""}`} />
              </button>
              <span className="text-sm text-gray-700">Ascenseur</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="hidden" name="cave" value={String(cave)} />
              <button
                type="button"
                onClick={() => setCave(!cave)}
                className={`w-10 h-6 rounded-full transition-colors ${cave ? "bg-terracotta" : "bg-gray-200"}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${cave ? "translate-x-4" : ""}`} />
              </button>
              <span className="text-sm text-gray-700">Cave</span>
            </label>
          </div>
        </div>
      </section>

      {/* Bloc 4 — Contenu */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">Contenu</h2>

        {/* Points forts */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-500 block mb-2">Points forts</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Ex: rénové, au calme..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <button type="button" onClick={addTag} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-terracotta-light text-terracotta text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:opacity-70">×</button>
              </span>
            ))}
          </div>
          <input type="hidden" name="points_forts" value={JSON.stringify(tags)} />
        </div>

        {/* Photos */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-500 block mb-2">Photos (URLs)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="url"
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhoto(); } }}
              placeholder="https://..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <button type="button" onClick={addPhoto} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {photos.map((url) => (
              <div key={url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((p) => p !== url))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input type="hidden" name="photos" value={JSON.stringify(photos)} />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={defaultValues.description ?? ""}
            rows={6}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-y"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <a href="/admin/listings" className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">
          Annuler
        </a>
        <button
          type="submit"
          className="bg-terracotta text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-terracotta/90 transition"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ListingForm.tsx
git commit -m "feat: add shared ListingForm component with tags and photo URL management"
```

---

### Task 9: Pages nouvelle annonce + édition

**Files:**
- Create: `src/app/admin/listings/new/page.tsx`
- Create: `src/app/admin/listings/[id]/edit/page.tsx`

- [ ] **Step 1: Créer `src/app/admin/listings/new/page.tsx`**

```typescript
import { createListing } from "@/app/actions/listings";
import ListingForm from "@/components/admin/ListingForm";

export default function NewListingPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-8">
        Nouvelle annonce
      </h1>
      <ListingForm action={createListing} />
    </div>
  );
}
```

- [ ] **Step 2: Créer `src/app/admin/listings/[id]/edit/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import { getListing, updateListing } from "@/app/actions/listings";
import ListingForm from "@/components/admin/ListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const updateWithId = updateListing.bind(null, id);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-2">
        Modifier l&apos;annonce
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        {listing.titre} · {listing.reference ?? listing.id.slice(0, 8)}
      </p>
      <ListingForm action={updateWithId} defaultValues={listing} />
    </div>
  );
}
```

- [ ] **Step 3: Tester dans le navigateur**

- `http://localhost:3000/admin/listings/new` → formulaire vide, enregistrer → redirect vers liste
- Cliquer "Modifier" sur une annonce → formulaire pré-rempli, enregistrer → redirect vers liste

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/listings/new/ src/app/admin/listings/
git commit -m "feat: add new and edit listing pages"
```

---

### Task 10: Page leads

**Files:**
- Create: `src/app/admin/leads/page.tsx`

- [ ] **Step 1: Créer `src/app/admin/leads/page.tsx`**

```typescript
import { getLeads } from "@/app/actions/leads";

export default async function LeadsPage() {
  const leads = await getLeads();

  const csvContent =
    "data:text/csv;charset=utf-8,Nom,Email,Téléphone,Adresse,Surface,Pièces,Message,Date\n" +
    leads
      .map((l) =>
        [
          l.nom, l.email, l.telephone ?? "", l.adresse_bien,
          l.surface ?? "", l.pieces ?? "", l.message ?? "",
          new Date(l.created_at).toLocaleDateString("fr-FR"),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-800">Leads</h1>
          <p className="text-gray-400 text-sm mt-1">
            {leads.length} contact{leads.length > 1 ? "s" : ""} reçu{leads.length > 1 ? "s" : ""}
          </p>
        </div>
        {leads.length > 0 && (
          <a
            href={encodeURI(csvContent)}
            download="leads-alibi-immo.csv"
            className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Export CSV
          </a>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📬</p>
          <p>Aucun lead pour le moment.</p>
          <p className="text-sm mt-1">
            Ils apparaîtront ici quand des visiteurs rempliront le formulaire d&apos;estimation.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Téléphone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Bien estimé</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{lead.nom}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${lead.email}`} className="text-terracotta hover:underline">
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lead.telephone ? (
                      <a href={`tel:${lead.telephone}`} className="hover:underline">
                        {lead.telephone}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {lead.adresse_bien}
                    {lead.surface && ` · ${lead.surface} m²`}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/leads/
git commit -m "feat: add leads page with CSV export"
```

---

### Task 11: Mise à jour du site public

**Files:**
- Create: `src/app/api/listings/route.ts`
- Modify: `src/app/offres/page.tsx`
- Create: `src/app/offres/_components/OffresClient.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/ListingRow.tsx`
- Delete: `src/data/listings.json`

- [ ] **Step 1: Créer `src/app/api/listings/route.ts`**

Route publique pour les pages client qui ont besoin des listings :

```typescript
import { NextResponse } from "next/server";
import { getPublicListings } from "@/app/actions/listings";

export const revalidate = 60;

export async function GET() {
  const listings = await getPublicListings();
  return NextResponse.json(listings);
}
```

- [ ] **Step 2: Mettre à jour `src/components/ListingRow.tsx`**

Remplacer le contenu entier (adapter les champs `adresse`→`ville`, `photo`→`photos[0]`) :

```typescript
import type { Listing } from "@/types";
import Image from "next/image";

interface Props {
  listing: Listing;
}

export default function ListingRow({ listing }: Props) {
  const photo = listing.photos[0] ?? null;
  const priceM2 =
    listing.surface > 0 ? Math.round(listing.prix / listing.surface) : null;

  return (
    <div className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {photo ? (
          <Image
            src={photo}
            alt={listing.titre}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
            🏠
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {listing.titre}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {listing.ville} {listing.code_postal}
            </p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              {listing.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-terracotta font-bold text-base">
              {listing.prix.toLocaleString("fr-FR")} €
            </div>
            <div className="text-xs text-gray-500">
              {listing.surface} m² · {listing.pieces} pièces
            </div>
            {priceM2 && (
              <div className="text-xs text-gray-400 mt-0.5">
                {priceM2.toLocaleString("fr-FR")} €/m²
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Créer `src/app/offres/_components/OffresClient.tsx`**

```typescript
"use client";

import { useState } from "react";
import ListingRow from "@/components/ListingRow";
import type { Listing } from "@/types";

export default function OffresClient({
  listings,
}: {
  listings: Listing[];
}) {
  const [typeFilter, setTypeFilter] = useState<"" | "Appartement" | "Maison">(
    ""
  );
  const [maxPrice, setMaxPrice] = useState<number>(2000000);

  const filtered = listings.filter((l) => {
    if (typeFilter && l.type !== typeFilter) return false;
    if (l.prix > maxPrice) return false;
    return true;
  });

  return (
    <>
      <p className="text-gray-500 mb-8">
        {filtered.length} bien{filtered.length > 1 ? "s" : ""} disponible
        {filtered.length > 1 ? "s" : ""}
      </p>

      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "" | "Appartement" | "Maison")
            }
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

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            Aucun bien ne correspond à vos critères.
          </p>
        ) : (
          filtered.map((l) => <ListingRow key={l.id} listing={l} />)
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Remplacer `src/app/offres/page.tsx`**

```typescript
import { getPublicListings } from "@/app/actions/listings";
import OffresClient from "./_components/OffresClient";

export const dynamic = "force-dynamic";

export default async function OffresPage() {
  const listings = await getPublicListings();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">
        Nos offres
      </h1>
      <OffresClient listings={listings} />
    </div>
  );
}
```

- [ ] **Step 5: Mettre à jour `src/app/page.tsx`**

Remplacer le contenu entier :

```typescript
export const dynamic = "force-dynamic";

import Hero from "@/components/Hero";
import StatCard from "@/components/StatCard";
import ListingRow from "@/components/ListingRow";
import { getPublicListings } from "@/app/actions/listings";

export default async function HomePage() {
  const listings = await getPublicListings();
  const featured = listings.slice(0, 3);

  return (
    <>
      <Hero />

      <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Transactions en base" value="70 000+" sub="Yvelines & Hauts-de-Seine" />
          <StatCard label="Prix médian/m² Yvelines" value="~3 200 €" sub="Source DVF 2023-2024" />
          <StatCard label="Prix médian/m² Hauts-de-Seine" value="~6 500 €" sub="Source DVF 2023-2024" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-16">
        <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6">
          Nos dernières offres
        </h2>
        <div className="flex flex-col gap-3">
          {featured.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune annonce disponible pour le moment.</p>
          ) : (
            featured.map((l) => <ListingRow key={l.id} listing={l} />)
          )}
        </div>
        <div className="mt-6 text-center">
          <a href="/offres" className="text-terracotta font-medium text-sm hover:underline">
            Voir toutes nos offres →
          </a>
        </div>
      </section>

      <section id="contact" className="max-w-6xl mx-auto px-4 mt-16 mb-8">
        <div className="bg-terracotta-light rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-gray-800 mb-2">
            Vous souhaitez estimer votre bien ?
          </h2>
          <p className="text-gray-600 mb-6">
            Nos agents analysent le marché local avec des données réelles pour vous donner une estimation précise.
          </p>
          <a
            href="mailto:contact@alibi-immo.fr"
            className="bg-terracotta text-white px-8 py-3 rounded-lg font-medium hover:bg-terracotta/90 transition inline-block"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 6: Supprimer `src/data/listings.json`**

```bash
rm src/data/listings.json
```

- [ ] **Step 7: Vérifier TypeScript + build**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 8: Vérifier dans le navigateur**

- `http://localhost:3000` → affiche les annonces depuis Supabase (vide si aucune insérée)
- `http://localhost:3000/offres` → idem, filtres fonctionnels
- Ajouter une annonce via `/admin/listings/new` → apparaît sur le site public

- [ ] **Step 9: Commit + push**

```bash
git add src/
git commit -m "feat: connect public pages to Supabase, remove mock JSON"
git push
```

Attendu : Vercel redéploie automatiquement. Ajouter dans Vercel les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
