# Meta Pixel + Conversions API : installation et test

Ce correctif relie le Pixel du navigateur et l’API serveur Meta pour chaque boutique. Le token serveur est chiffré dans Supabase Vault. Il n’est pas stocké dans les réglages publics de la page.

## Les fichiers à copier

Copie les fichiers du ZIP dans le dossier ShopSaaS où se trouve `package.json`. Garde les sous-dossiers et accepte le remplacement lorsqu’il est demandé.

**À remplacer :**

```text
app/api/orders/create/route.ts
app/s/[store]/p/[slug]/OrderForm.tsx
app/s/[store]/p/[slug]/actions.ts
app/s/[store]/p/[slug]/page.tsx
components/store-builder/Editor.tsx
components/store-builder/SidebarLeft.tsx
components/store-builder/sections/OrderFormRender.tsx
```

**À ajouter :**

```text
app/api/integrations/meta/route.ts
app/api/integrations/meta/test/route.ts
app/api/stores/save/route.ts
app/s/[store]/p/[slug]/MetaPixelTracker.tsx
components/store-builder/MetaPixelSettings.tsx
lib/meta/browser.ts
lib/meta/conversions-api.ts
lib/meta/store-access.ts
supabase/migrations/0015_meta_pixel_conversions_api.sql
```

`app/api/stores/save/route.ts` existe déjà dans ton projet : remplace-le par celui du ZIP. Il empêche un ancien token d’être enregistré dans les données publiques d’une page.

## Étape 1 : mettre à jour Supabase

1. Connecte-toi à Supabase et ouvre le projet ShopSaaS.
2. Clique **SQL Editor → New query**.
3. Sur ton ordinateur, ouvre `supabase/migrations/0015_meta_pixel_conversions_api.sql`.
4. Copie tout son contenu dans la requête Supabase, puis clique **Run**.
5. Il faut voir un message de réussite. La migration copie l’ancien Pixel ID et son token vers la nouvelle configuration privée, puis retire ces valeurs du JSON public des pages.

La migration utilise **Supabase Vault**, le coffre chiffré de Supabase. Si Supabase indique que `vault` n’existe pas, arrête-toi et envoie le texte exact de l’erreur : ne supprime pas les protections de la base.

Si un ancien token avait déjà été enregistré dans une page publiée, le choix le plus prudent est de le remplacer par un nouveau token Meta après la migration.

## Étape 2 : récupérer les valeurs dans Meta

Dans **Meta Events Manager**, choisis le Pixel de la boutique.

- **Pixel ID** : visible dans les réglages du Pixel.
- **Token Conversions API** : dans la section de configuration de la Conversions API, génère un token d’accès pour ce Pixel.
- **Code Test Events** : dans l’onglet **Test Events**, copie le code de test affiché.

Le Pixel ID peut être visible dans le navigateur, c’est normal. Le token ne doit jamais être copié dans du code public, une capture d’écran ou un message.

## Étape 3 : saisir les valeurs dans ShopSaaS

1. Ouvre l’éditeur de la boutique.
2. Va dans **Personnaliser le thème → Réglages → Facebook Pixel & CAPI** (le titre peut s’afficher comme **Meta Pixel & Conversions API**).
3. Colle le Pixel ID.
4. Colle le token Conversions API.
5. Colle le code Test Events.
6. Coche **Mode test activé**, puis clique **Enregistrer Meta**.
7. Clique **Envoyer un événement test**. Le message doit confirmer la réception d’un événement.

Le token est envoyé au serveur de ShopSaaS et chiffré dans Supabase Vault. L’éditeur ne le réaffiche pas ensuite : le champ vide veut dire « garder le token déjà enregistré ».

## Étape 4 : tester une vraie commande d’essai

Pour une vraie vérification, utilise d’abord une adresse **HTTPS de prévisualisation Vercel**, pas ta version de production :

1. Ouvre l’adresse de prévisualisation Vercel sur le téléphone ou l’ordinateur.
2. Sur la page produit, accepte la demande de mesure Meta. Si tu refuses, les événements Meta ne partent pas.
3. Dans Meta Events Manager, garde ouvert **Test Events**.
4. Passe une commande d’essai sur la boutique.
5. Vérifie dans **Test Events** que Meta reçoit :
   - `PageView` et `ViewContent` du navigateur après acceptation;
   - `Purchase` du navigateur et du serveur après la commande.
6. Pour l’achat, les deux sources doivent partager le même identifiant d’événement. Meta peut ainsi les dédupliquer, au lieu de compter deux achats.

Dans ShopSaaS, une commande validée dans le formulaire est envoyée comme événement `Purchase`. Pour le paiement à la livraison, cela signifie **commande passée**, pas forcément commande livrée ni argent encaissé. Teste avec une commande clairement identifiée comme essai.

Le bouton **Envoyer un événement test** confirme que le serveur atteint Meta. La commande d’essai vérifie en plus le formulaire, la boutique, la valeur, la devise et la déduplication.

## Étape 5 : désactiver le mode test avant le lancement réel

Après les essais :

1. Retourne à **Réglages → Meta Pixel & Conversions API**.
2. Décoche **Mode test activé**.
3. Enregistre.
4. Déploie ensuite la version Vercel.

Sinon, les événements serveur resteront marqués comme événements de test.

## Ce que le code envoie

- `PageView` et `ViewContent` côté navigateur, seulement après consentement.
- `Purchase` côté navigateur et côté serveur, seulement après consentement et création réussie de la commande.
- Le même `event_id` pour les deux événements Purchase afin de permettre la déduplication.
- Valeur et devise relues depuis la commande enregistrée dans Supabase.
- Email normalisé puis haché côté serveur s’il est fourni; téléphone haché uniquement s’il est écrit au format international avec `+`. Aucun token Meta n’est renvoyé au navigateur.

Le code utilise Graph API Meta `v25.0`. Vérifie la version prise en charge et les alertes de diagnostic de Meta avant d’augmenter la diffusion publicitaire.

## Téléphone et version locale

Sur un téléphone, `localhost` désigne **le téléphone**, pas ton ordinateur. Pour voir une page locale sur le même Wi-Fi :

1. Sur le PC, lance Next.js en écoutant les autres appareils : `npm run dev -- --hostname 0.0.0.0`.
2. Dans Windows, ouvre l’invite de commande et tape `ipconfig`.
3. Repère l’adresse IPv4 du Wi-Fi, souvent de la forme `192.168.1.25`.
4. Sur le téléphone connecté au même Wi-Fi, ouvre `http://192.168.1.25:3000` en remplaçant l’adresse par celle du PC.

Cette méthode sert à vérifier l’affichage. Les notifications push demandent HTTPS sur le téléphone. Pour tester le Pixel et le Push ensemble sans tunnel, l’adresse **HTTPS de prévisualisation Vercel** est le test le plus simple; elle ne met pas la version de production en ligne.

## Notifications Push toujours sans alerte ?

Les changements Meta ne réparent pas les notifications Push. Pour trouver la cause sans refaire toute la configuration :

1. Ouvre **Supabase → Edge Functions → push-order → Logs**.
2. Depuis le téléphone abonné, passe une commande d’essai.
3. Regarde la nouvelle ligne du journal au même moment.
4. Si l’erreur dit `Unauthorized`, vérifie que `PUSH_HOOK_SECRET` est identique dans Vercel et Supabase.
5. Si le journal indique qu’aucun abonnement n’existe, ouvre le dashboard sur le téléphone, vérifie que **Push activé** est affiché pour cette boutique, puis réactive-le.
6. Si le journal affiche une erreur d’envoi, copie seulement le message d’erreur, sans token, URL privée, téléphone ni adresse d’abonnement.

Dans Vercel, les deux valeurs de Push doivent être définies côté serveur/public selon leur nom : `PUSH_HOOK_SECRET` et `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Le serveur doit ensuite être redéployé. Sur chaque appareil, le site doit être ouvert en HTTPS et les notifications autorisées par le téléphone.

## Références

- [Meta Conversions API : schéma officiel d’événement](https://raw.githubusercontent.com/facebookincubator/Facebook-Server-Side-API-Swagger/master/server-side-api.yaml)
- [Meta Pixel : événements standards](https://developers.facebook.com/docs/meta-pixel/reference)
- [Meta : déduplication Pixel et événements serveur](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
