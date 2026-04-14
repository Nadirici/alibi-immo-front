# Admin Panel — Design Spec
**Date:** 2026-04-14  
**Projet:** alibi-immo-front  
**Périmètre:** Panel d'administration complet pour Alibi Immo — gestion des annonces, leads, et placeholder CRM

---

## 1. Architecture

Le panel admin est intégré dans le repo `alibi-immo-front` existant (Next.js 16, App Router). Aucun repo séparé.

```
src/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx          # Auth Supabase
│   │   ├── page.tsx                # Dashboard
│   │   ├── listings/
│   │   │   ├── page.tsx            # Liste annonces
│   │   │   ├── new/page.tsx        # Formulaire création
│   │   │   └── [id]/edit/page.tsx  # Formulaire édition
│   │   └── leads/page.tsx          # Liste leads
├── middleware.ts                    # Protection /admin/* via session Supabase
└── lib/
    ├── supabase-server.ts           # Client Supabase (Server Components / Actions)
    └── supabase-browser.ts          # Client Supabase (Client Components)
```

**Auth :** Supabase Auth (email + mot de passe). Le middleware Next.js vérifie le cookie de session sur chaque requête `/admin/*`. Si absent → redirect `/admin/login`.

**Données :** Server Actions pour toutes les opérations CRUD. Pas d'API route intermédiaire.

**Site public :** Les pages `/offres` et `/` lisent la table Supabase `listings` au lieu de `listings.json`. Le fichier mock est supprimé.

---

## 2. Schéma Supabase

### Table `listings`

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid | PK, gen_random_uuid() |
| reference | text | Ex: VA2298 |
| titre | text | |
| statut | text | 'nouveaute' \| 'actif' \| 'compromis' \| 'vendu' |
| type | text | 'Appartement' \| 'Maison' |
| ville | text | |
| code_postal | text | |
| prix | int | € TTC |
| prix_hors_honoraires | int | nullable |
| honoraires_pct | numeric(5,2) | nullable |
| surface | numeric(8,2) | m² |
| pieces | int | |
| chambres | int | nullable |
| salle_de_bains | int | nullable |
| charges | int | €/mois, nullable |
| taxe_fonciere | int | €/an, nullable |
| etage | text | 'RDC', '1', '2'… nullable |
| annee_construction | int | nullable |
| etat_general | text | nullable |
| chauffage | text | nullable |
| chauffage_type | text | 'Individuel' \| 'Collectif', nullable |
| cuisine | text | nullable |
| exposition | text | nullable |
| vue | text | nullable |
| ouvertures | text | nullable |
| ascenseur | boolean | default false |
| cave | boolean | default false |
| dpe | text | 'A'→'G', nullable |
| ges | text | 'A'→'G', nullable |
| points_forts | text[] | tags libres |
| photos | text[] | URLs |
| description | text | |
| created_at | timestamptz | default now() |

**RLS :**
- Lecture publique (SELECT) : autorisée sans auth → site public
- INSERT / UPDATE / DELETE : uniquement utilisateurs authentifiés Supabase

### Table `leads`

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid | PK |
| nom | text | |
| email | text | |
| telephone | text | nullable |
| adresse_bien | text | adresse du bien estimé |
| surface | numeric | nullable |
| pieces | int | nullable |
| message | text | nullable |
| created_at | timestamptz | default now() |

**RLS :** Lecture/écriture uniquement pour utilisateurs authentifiés. INSERT public autorisé (formulaire côté site).

---

## 3. Pages & Composants

### `/admin/login`
- Formulaire email + mot de passe
- Appel `supabase.auth.signInWithPassword()`
- Redirect `/admin` après succès
- Message d'erreur inline si échec

### `/admin` — Dashboard
Quatre sections :

1. **Stats rapides** (3 cartes) : annonces actives, leads reçus, dernière annonce (date)
2. **Accès rapides** : boutons vers Annonces et Leads
3. **CRM — Bientôt disponible** : carte grisée avec badge "Prochainement", aperçu du contenu futur (suivi contacts, pipeline vendeurs/acheteurs, historique interactions)
4. **Bouton déconnexion** dans la navbar admin

### `/admin/listings` — Liste des annonces
- Tableau : référence, titre, ville, prix, statut (badge coloré), date
- Boutons par ligne : **Modifier** → `/admin/listings/[id]/edit`, **Supprimer** (confirmation)
- Bouton **"+ Nouvelle annonce"** en haut à droite
- Filtre par statut (tabs : Tous / Actif / Compromis / Vendu)

### `/admin/listings/new` et `/admin/listings/[id]/edit`
Même formulaire, deux modes (création / édition). Organisé en 4 blocs :

**Bloc 1 — Général**
référence, titre, statut (select), type (select), ville, code postal

**Bloc 2 — Prix & Surface**
prix, prix hors honoraires, honoraires %, surface, pièces, chambres, salle de bains, charges, taxe foncière

**Bloc 3 — Caractéristiques**
étage, année construction, état général, chauffage, type chauffage, cuisine, exposition, vue, ouvertures, ascenseur (toggle), cave (toggle), DPE (select A→G), GES (select A→G)

**Bloc 4 — Contenu**
- Points forts : input tag (Enter pour ajouter, clic pour supprimer)
- Photos : champ URL + bouton Ajouter, liste avec aperçu miniature et bouton supprimer
- Description : textarea pleine largeur

Bouton **Enregistrer** (Server Action) + bouton **Annuler**.

### `/admin/leads` — Liste des leads
- Tableau : nom, email, téléphone, adresse bien, date
- Tri par date décroissant
- Bouton **Export CSV**

### Navbar Admin
Composant séparé de la Navbar publique. Contient : logo "Alibi Immo — Admin", liens Annonces / Leads, bouton Déconnexion.

---

## 4. Modifications du site public

- `/offres/page.tsx` : lit `listings` depuis Supabase (filtre `statut = 'actif' OR statut = 'nouveaute'`) au lieu de `listings.json`
- `/page.tsx` (accueil) : idem pour les 3 annonces en vedette
- `src/data/listings.json` : supprimé
- `src/types.ts` : interface `Listing` mise à jour avec les nouveaux champs

---

## 5. Dépendances à ajouter

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Variables d'environnement à ajouter dans `.env.local` et Vercel :
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 6. Hors périmètre (cette itération)

- Générateur d'annonces IA
- Upload de photos (Supabase Storage) — les photos sont des URLs
- CRM complet — placeholder affiché uniquement
- Tunnel d'estimation / lead scoring
