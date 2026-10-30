# ShopSaaS · Étape 1 : Fondations

Boutiques multi-vendeurs, équipe et rôles, un marché par boutique, produits avec variantes et prix dans la devise de la boutique.
Stack : **Next.js 15 (App Router) + TypeScript + Tailwind 4 + Supabase**, hébergé sur **Vercel**.

## Ce que fait cette étape

- Inscription / connexion (email + mot de passe)
- Création d'une ou plusieurs boutiques, chacune sur son sous-domaine `maboutique.tondomaine.com`
- **Équipe et rôles** : invitation par lien (copie ou WhatsApp), 5 rôles prêts à l'emploi
  (Propriétaire, Admin, Agent commandes, Gestionnaire catalogue, Logistique) + **rôles personnalisés**
  en cochant les permissions. Par membre : limiter à certains marchés, ne voir que ses commandes,
  masquer les numéros clients. Historique des actions.
- **Marché unique par boutique** : le pays et la devise sont attribués à la création et partagés par tous les produits, pages et commandes de cette boutique. Pour cibler un autre pays ou une autre devise, crée une autre boutique avec le même compte.
- **Produits** : photos (upload), options (taille, couleur…), variantes générées automatiquement,
  stock, **prix et prix barré par marché**, brouillon / actif / archivé
- Vitrine minimale : liste des produits + page produit (les sections arrivent à l'étape 2,
  le formulaire de commande à l'étape 3)

La sécurité est faite **dans la base** (Row Level Security) : un Agent commandes ne peut pas lire
les produits ni les chiffres, même en appelant l'API directement.

---

## 1. Supabase (10 min)

1. Crée un projet sur https://supabase.com (région **Europe**, la plus proche de l'Afrique de l'Ouest).
2. **SQL Editor** → New query → exécute les fichiers `supabase/migrations/0001_fondations.sql` à `0013_one_market_per_store.sql`, **dans l’ordre**. La migration 0013 fixe un seul marché actif par boutique, tout en conservant les anciennes lignes pour l’historique des commandes. N’exécuter que `0001` laisse des tables et fonctions manquantes. Sur une base déjà utilisée, exécute uniquement les migrations qui ne l’ont pas encore été, dans l’ordre.
3. **Authentication → Sign In / Providers → Email** : pour un usage interne, tu peux désactiver
   *Confirm email* (sinon chaque nouveau membre doit cliquer le lien reçu par mail).
4. **Authentication → URL Configuration** :
   - Site URL : `https://app.tondomaine.com` (ou `http://localhost:3000` pour commencer)
   - Redirect URLs : ajoute `http://localhost:3000/**` et `https://app.tondomaine.com/**`
5. **Project Settings → API** : copie `Project URL` et la clé `anon public`.

## 2. En local

Prérequis : Node.js 20+.

```bash
cp .env.example .env.local     # puis remplis les variables Supabase et ton domaine
npm install
npm run dev
```

`SUPABASE_SERVICE_ROLE_KEY` est requise pour les routes serveur privilégiées. Elle reste uniquement dans `.env.local` ou dans les variables privées de Vercel : ne jamais la préfixer par `NEXT_PUBLIC_` ni la publier.

- Dashboard : http://localhost:3000
- Ta boutique : http://maboutique.localhost:3000 (remplace par ton sous-domaine, marche dans Chrome)

## 3. Mise en ligne sur Vercel

1. Pousse le dossier sur un repo GitHub (privé).
2. Vercel → **Add New Project** → importe le repo (framework détecté : Next.js).
3. **Environment Variables** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ROOT_DOMAIN` = `tondomaine.com`
   - `SUPABASE_SERVICE_ROLE_KEY` (clé secrète, côté serveur uniquement)
4. **Settings → Domains** : ajoute `app.tondomaine.com` et **`*.tondomaine.com`**.
   Le wildcard exige que le domaine utilise les **nameservers de Vercel**
   (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) chez ton registrar.
5. En attendant le domaine, la vitrine est visible en aperçu sur
   `https://ton-projet.vercel.app/s/maboutique`.

> Le plan gratuit Vercel (Hobby) est réservé à l'usage non commercial. Passe en **Pro** dès que les
> boutiques vendent pour de vrai.

## 4. Parcours de test

1. Crée ton compte → crée ta boutique (pays Togo) → tu arrives sur le dashboard.
2. Le pays, la devise et l’indicatif du marché unique sont configurés à la création de la boutique.
3. **Produits** : crée un produit, ajoute 2 photos, une option « Taille : S, M, L », mets des prix
   pour chaque marché, passe en **Actif**, enregistre → « Voir en ligne ».
4. **Équipe** : invite un email avec le rôle *Agent commandes*, ouvre le lien en navigation privée,
   crée le compte avec cet email → il ne voit que **Accueil** et **Commandes**.
5. Crée un rôle perso (ex. « Closeuse Bénin »), assigne-le, limite le membre au marché Bénin.

## Structure

```
middleware.ts                 Sous-domaine → vitrine (/s/<slug>), sinon session + protection dashboard
supabase/migrations/          Schéma, fonctions (create_store, accept_invitation), RLS, stockage
lib/permissions.ts            Liste des permissions et groupes (source unique)
lib/context.ts                Utilisateur, boutique courante, requirePerm()
app/(auth)/                   Connexion, inscription
app/onboarding/               Création de boutique
app/dashboard/                Accueil, commandes (étape 3), produits, marchés, équipe, réglages
app/invite/[token]/           Acceptation d'invitation
app/s/[store]/                Vitrine publique
components/                   UI, formulaires, upload d'images
```

## Permissions

| Clé | Sens |
|---|---|
| `orders.read` / `orders.write` / `orders.ship` | voir / confirmer et modifier / expédier et livrer |
| `products.read` / `products.write` / `pages.write` | voir / modifier les produits / modifier les pages produits |
| `markets.read` / `markets.write` | voir / modifier les réglages du marché unique |
| `analytics.read` / `export.read` | chiffres / export Google Sheets et CSV |
| `settings.write` / `team.write` | réglages et pixel / équipe et rôles |

Le Propriétaire a `*` (tout) et ne peut être ni modifié ni retiré. Aucun rôle personnalisé ne peut recevoir `*`.

## Étapes suivantes

- **Étape 2** : éditeur de page produit par sections (16 sections issues de Refresh + Shrine PRO), aperçu mobile.
- **Étape 3** : formulaire de commande, liste et fiche commande, statuts, notifications push (PWA).
- **Étape 4** : Google Sheets, pixels Meta / TikTok, tableau de bord chiffré.
