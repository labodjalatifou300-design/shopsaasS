# Correctif pré-lancement ShopSaaS : sécurité, équipe, Meta et paniers

Copie le contenu du ZIP dans le dossier ShopSaaS contenant `package.json`, en gardant les dossiers. Remplace les fichiers existants.

## Fichiers à remplacer

```text
app/api/orders/create/route.ts
app/api/pages/create/route.ts
app/api/stores/save/route.ts
app/boutiques/[id]/page.tsx
app/boutiques/page/[pageId]/page.tsx
app/dashboard/layout.tsx
app/dashboard/team/actions.ts
app/dashboard/team/page.tsx
app/s/[store]/page.tsx
app/s/[store]/p/[slug]/OrderForm.tsx
app/s/[store]/p/[slug]/actions.ts
components/store-builder/sections/OrderFormRender.tsx
components/store-builder/Editor.tsx
components/store-builder/SidebarLeft.tsx
```

## Fichiers à ajouter

```text
app/api/abandoned-carts/route.ts
app/api/integrations/meta/route.ts
app/api/integrations/meta/test/route.ts
app/dashboard/orders/abandoned-carts/actions.ts
app/dashboard/orders/abandoned-carts/page.tsx
app/s/[store]/p/[slug]/MetaPixelTracker.tsx
components/store-builder/MetaPixelSettings.tsx
lib/abandoned-cart/browser.ts
lib/abandoned-cart/server.ts
lib/meta/browser.ts
lib/meta/conversions-api.ts
lib/meta/store-access.ts
supabase/migrations/0015_meta_pixel_conversions_api.sql
supabase/migrations/0016_abandoned_carts_and_order_guards.sql
supabase/migrations/0017_public_order_market_guard.sql
```

`META-PIXEL-TEST-GUIDE.md` contient le guide précédent du Pixel/CAPI.

## Migrations Supabase

Dans **Supabase → SQL Editor → New query**, exécute chaque migration une fois, dans cet ordre : `0015_meta_pixel_conversions_api.sql`, `0016_abandoned_carts_and_order_guards.sql`, puis `0017_public_order_market_guard.sql`.

0015 déplace l’ancien Pixel ID/token des pages vers un réglage privé et stocke le token dans Supabase Vault. Si elle échoue car Vault n’est pas disponible, arrête-toi et copie l’erreur; ne publie pas avant d’avoir vérifié que l’ancien token n’est plus dans les pages. 0016 crée les paniers avec consentement, accès réservé aux rôles commandes, expiration à 30 jours. Elle programme une purge quotidienne si Supabase autorise pg_cron; sinon les paniers expirés sont cachés, mais une purge programmée doit être activée avant de compter sur leur suppression. 0017 bloque les commandes où le marché, la variante ou son prix n’appartient pas à la boutique.

## Comment inviter une personne

Dans le dashboard, ouvre **Équipe**, choisis son adresse email, un rôle et ses marchés, puis crée le lien d’invitation. Partage-le manuellement via WhatsApp ou copie/colle. ShopSaaS n’envoie pas l’email automatiquement. La personne ouvre le lien, crée un compte ou se connecte avec exactement cette adresse, puis clique **Rejoindre**. L’accès est limité aux droits et marchés du rôle. L’ancien bouton de création directe ne change plus le mot de passe d’un compte existant.

## Test avant production

1. Déploie d’abord en Preview Vercel, pas en Production. Applique les trois migrations sur le projet Supabase de test si tu en as un.
2. Teste un compte propriétaire et un autre email sans invitation : le second doit rester bloqué sur le dashboard et l’éditeur.
3. Invite ce second email avec un rôle limité. Confirme son email si Supabase le demande, puis accepte l’invitation. Vérifie qu’il ne voit que la boutique/marché attribués et ne peut pas modifier les pages sans `pages.write`.
4. Teste les commandes avec un marché/variant valide; tente aussi un market ID d’une autre boutique en test, la commande doit être refusée.
5. Sur une page produit, coche l’accord « conserver mes coordonnées et mon panier … pour me recontacter », remplis nom + téléphone et attends environ une seconde. Dans **Commandes → Paniers abandonnés**, le panier de test doit apparaître. Sans coche, aucune fiche ne doit être créée. Après une commande réussie, il disparaît de la liste active.
6. Les paniers abandonnés ne déclenchent ni commande ni notification Push. L’équipe peut appeler ou envoyer un email depuis la liste.
7. Pour Meta, utilise **Events Manager → Test Events**, laisse le mode test activé, accepte la mesure sur la page, envoie une commande test et vérifie le Purchase. Désactive le mode test avant les annonces réelles.
8. Teste Push séparément sur le téléphone : ouvre la Preview Vercel en HTTPS sur le téléphone, active Push sur cet appareil, puis crée une commande depuis un autre appareil. Une activation sur PC ne couvre pas le téléphone. Consulte **Supabase → Edge Functions → push-order → Logs** si aucune notification n’arrive.

## Important avant GitHub/Vercel

Ne pousse pas de fichier `.env.local`, token Meta, clé `SUPABASE_SERVICE_ROLE_KEY`, `PUSH-VALUES.txt` ou abonnement Push. Ces valeurs restent secrètes côté serveur. J’ai validé la syntaxe des fichiers et l’audit statique, mais pas une connexion réelle à ton Supabase/Meta ni les notifications sur un téléphone. Fais les essais Preview ci-dessus avant production.
