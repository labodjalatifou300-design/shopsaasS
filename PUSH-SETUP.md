# Notifications sur téléphone : guide simple

Le code est prêt dans ce paquet. Pour l’instant, fais seulement la **première étape** ci-dessous. On fera ensuite les réglages Supabase un par un, sans te faire deviner quoi que ce soit.

## Les deux mots à connaître

- **Dossier du projet** (on dit parfois « racine ») : le grand dossier ShopSaaS où tu vois le fichier `package.json` et les dossiers `app` et `supabase`. C’est là que tu copies les fichiers du paquet.
- **HTTPS** : une adresse de site qui commence par `https://`. C’est indispensable pour que les téléphones autorisent les notifications Push. Une adresse Wi-Fi locale comme `http://192.168...` ne suffit pas.

## Étape 1 : copier les fichiers

1. Télécharge et ouvre `ShopSaaS-correctifs.zip`.
2. Ouvre le dossier ShopSaaS qui contient `package.json`.
3. Copie le contenu du ZIP dans ce dossier, en gardant les mêmes sous-dossiers (`app`, `components`, `lib`, `public`, `scripts`, `supabase`).
4. Si Windows demande s’il faut remplacer des fichiers, choisis **Remplacer**.

Ne partage jamais `PUSH-VALUES.txt` si ce fichier existe déjà. Le générateur refuse d’écraser un fichier de clés existant.

## Étape 2 : créer les clés avec un double-clic (Windows)

1. Dans le dossier ShopSaaS, double-clique `CREER-CLES-PUSH.cmd`.
2. Une fenêtre noire s’ouvre. Attends le message `Done`, puis appuie sur une touche si la fenêtre le demande.
3. Ouvre `PUSH-VALUES.txt`, qui se trouve dans le même dossier.
4. Remplace seulement `YOUR-EMAIL@example.com` par ton adresse à toi, sur la ligne `VAPID_SUBJECT`.
5. Garde ce fichier pour toi. Il contient des clés privées.

Si Windows affiche une erreur ou si Node.js manque, arrête-toi et dis-moi le message exact. Ne désactive aucune protection Windows.

## Étape 3 : créer la table des abonnements dans Supabase

1. Connecte-toi à Supabase et ouvre le projet ShopSaaS.
2. Dans le menu de gauche, clique **SQL Editor**.
3. Clique **New query**.
4. Sur ton ordinateur, ouvre le fichier `supabase/migrations/0014_web_push_subscriptions.sql`.
5. Copie tout le texte de ce fichier, colle-le dans Supabase, puis clique **Run**.
6. Attends le message de réussite. Cette étape se fait une seule fois.

## Étape 4 : ajouter trois valeurs privées à Supabase

1. Dans Supabase, clique **Edge Functions**, puis **Secrets**.
2. Dans `PUSH-VALUES.txt`, repère les lignes `PUSH_HOOK_SECRET=...`, `VAPID_KEYS_JSON=...` et `VAPID_SUBJECT=...`.
3. Pour chaque ligne, la partie avant `=` va dans la case **Name**; tout ce qui est après `=` va dans **Value**.
4. Enregistre.

Ne colle pas `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dans cette page. Ne partage pas ces valeurs par message.

## Étape 5 : installer la fonction qui envoie les alertes

1. Dans Supabase, ouvre **Edge Functions**.
2. Clique **Deploy a new function**, puis **Via Editor**.
3. Donne exactement ce nom à la fonction : `push-order`.
4. Ouvre sur ton ordinateur `supabase/functions/push-order/index.ts`, copie tout son contenu et colle-le dans l’éditeur Supabase en remplaçant le texte d’exemple.
5. Clique **Deploy function** et attends la confirmation.
6. Ouvre la fonction `push-order`, puis **Details**. Désactive **Verify JWT** (le nom peut aussi être **Enforce JWT Verification**) et enregistre. L’appel reste protégé par le secret de l’étape 4.

## Étape 6 : ajouter deux lignes au projet

1. Dans le dossier ShopSaaS, ouvre `.env.local`. C’est un petit fichier de réglages privé. S’il n’existe pas, crée-le dans le même dossier que `package.json`.
2. Dans `PUSH-VALUES.txt`, copie le texte après `=` de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, puis ajoute cette ligne dans `.env.local` :

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=COLLE-LA-VALEUR-ICI
```

3. Copie le texte après `=` de `PUSH_HOOK_SECRET` et ajoute aussi :

```text
PUSH_HOOK_SECRET=COLLE-ICI-LA-MEME-VALEUR
```

4. Ne supprime pas les lignes Supabase déjà présentes dans `.env.local`. Il doit garder `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. La clé `SUPABASE_SERVICE_ROLE_KEY` reste privée.
5. Enregistre, arrête ShopSaaS avec `Ctrl+C`, puis relance-le comme d’habitude.

### Si ton site est hébergé sur Vercel

Les réglages de `.env.local` ne quittent pas ton ordinateur. Il faut aussi donner les deux nouvelles valeurs à Vercel pour que le site en ligne les connaisse :

1. Ouvre Vercel, choisis le projet ShopSaaS, puis **Settings → Environment Variables**.
2. Ajoute `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et colle la valeur publique correspondante de `PUSH-VALUES.txt`.
3. Ajoute `PUSH_HOOK_SECRET` et colle la même valeur secrète que celle enregistrée dans Supabase.
4. Sélectionne **Production** et **Preview** si les deux sont proposés, puis enregistre.
5. Ouvre **Deployments**, choisis le dernier déploiement et clique **Redeploy**.

Ne mets jamais `VAPID_KEYS_JSON` ni `SUPABASE_SERVICE_ROLE_KEY` dans une variable qui commence par `NEXT_PUBLIC_`. `VAPID_KEYS_JSON` reste uniquement dans les secrets Supabase.

## Étape 7 : tester sur le téléphone, sans tunnel compliqué

Un tunnel est une porte provisoire entre ton ordinateur et Internet. Il faut le garder ouvert et son adresse peut changer. Pour éviter toute cette confusion, la méthode la plus simple et la plus fiable est d’utiliser une adresse ShopSaaS déjà en ligne qui commence par `https://` (par exemple ton adresse Vercel). Ce n’est pas une publication dans un magasin d’applications.

- Si tu as déjà cette adresse HTTPS, ouvre-la sur le téléphone, connecte-toi, puis active **Push hors app** dans le dashboard.
- Si tu n’as pas d’adresse HTTPS en ligne, ne modifie pas `NEXT_PUBLIC_ROOT_DOMAIN`, ne devine pas un nom d’hôte et ne change pas Supabase au hasard. Dis-moi simplement : **« Je n’ai pas encore d’adresse HTTPS en ligne »**. Je te guiderai avec une seule action à la fois pour obtenir une adresse de test.

Sur iPhone/iPad, il faut iOS/iPadOS 16.4 ou plus récent : dans Safari, touche **Partager → Sur l’écran d’accueil**, ouvre la nouvelle icône ShopSaaS, puis active les notifications. Sur Android, ouvre le site dans Chrome et accepte la demande de notification.

Pour vérifier l’alerte, laisse le téléphone abonné, ferme ShopSaaS sur le téléphone, puis crée une commande test depuis un autre appareil.

## Ce qui est gratuit et ce qui doit être vrai

L’envoi utilise les notifications standard du navigateur et Supabase; aucun abonnement OneSignal n’est nécessaire. Le Push ne fonctionnera qu’après la table SQL, la fonction Supabase, les clés et l’autorisation sur le téléphone. Le forfait gratuit de Supabase a des limites et peut mettre un projet en pause après une période d’inactivité.

L’alerte avec l’application fermée est différente du son du dashboard : le son du dashboard marche seulement quand la page est ouverte; la notification système du téléphone dépend du navigateur et de ses réglages.
