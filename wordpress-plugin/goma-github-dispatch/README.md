# GOMA - FCM Article Notifications

Plugin WordPress autonome pour envoyer directement une notification Firebase Cloud Messaging lorsqu'un contenu est publié.

## Installation

1. Télécharge le dossier `goma-github-dispatch`.
2. Compresse-le en `goma-github-dispatch.zip` ou copie-le dans `wp-content/plugins/`.
3. Dans WordPress, ouvre **Extensions** et active **GOMA - FCM Article Notifications**.
4. Va dans **Réglages > Notifications FCM**.
5. Dans Firebase Console, crée un compte de service et télécharge sa clé JSON.
6. Colle le JSON dans le champ **Compte de service Firebase JSON**.
7. Renseigne l’ID du projet, l’URL Realtime Database, le chemin des tokens et l’URL de l’application, puis enregistre.
8. Utilise **Envoyer un événement de test**.

Le compte de service doit avoir le rôle IAM **Cloud Datastore Viewer** ou **Firebase Realtime Database Viewer** dans Google Cloud IAM, et les règles Realtime Database doivent autoriser la lecture serveur. Le plugin utilise les scopes OAuth `userinfo.email` et `firebase.database`, lit les tokens sous `fcmTokens`, puis appelle l’API FCM HTTP v1 sans exposer la clé privée au navigateur. L’URL d’ouverture des notifications est `https://app.gomawebradio.com/articles/<slug>`.

Les paramètres suivants sont configurables dans le plugin :

- **ID du projet Firebase** : valeur `project_id` du compte de service.
- **URL Realtime Database** : URL de l’instance qui contient les tokens.
- **URL de l’application** : base du lien ouvert par une notification.
- **Chemin des tokens** : nœud Firebase contenant les appareils, par exemple `fcmTokens`.
- **Chemin des articles** : modèle du lien, avec `{slug}` remplacé par le slug WordPress, par exemple `articles/{slug}`.
- **Titre de notification** : titre affiché sur les appareils.
- **Types de contenu** : types WordPress qui déclenchent l’envoi.

Par défaut, la base contient un nœud `fcmTokens` à sa racine, avec chaque appareil sous `fcmTokens/<uid>/token`. Vérifie que l’URL et le chemin saisis dans le plugin correspondent à la structure visible dans Firebase.

## Délai et publications rapprochées

Les contenus publiés sont placés dans une file puis envoyés à FCM après environ 2 minutes. Plusieurs publications pendant cette fenêtre sont envoyées séparément afin que chaque notification contienne son titre, son image et son URL.

Chaque notification utilise le titre complet de l’article, son image mise en avant comme image et badge, ainsi que l’icône `/logo.png`. Le badge `/notification-badge.png` sert de repli lorsqu’un article n’a pas d’image. Un identifiant stable par article est utilisé comme tag afin qu’une nouvelle tentative remplace la notification existante au lieu d’en afficher une seconde.

Le délai repose sur WP-Cron : il démarre lorsqu'une visite arrive sur le site. Pour un délai plus régulier sur un site peu visité, configure une vraie tâche cron serveur qui appelle `wp-cron.php` toutes les minutes. Le bouton de test reste envoyé immédiatement.

Les articles en attente sont envoyés un par un, avec deux minutes entre deux notifications. Le service worker Firebase peut ainsi afficher les notifications même si l'application mobile n'est pas ouverte.

La page **Réglages > Notifications FCM** affiche le nombre d'articles en attente et l'heure du prochain traitement. Le bouton **Traiter maintenant** envoie le prochain article sans attendre le cron, tandis que **Vider la file** supprime les articles en attente sans les envoyer.

## Sécurité

- Ne mets jamais le token dans un article ou dans le code frontend.
- Limite le token au dépôt nécessaire.
- Supprime ou régénère le token immédiatement s'il est exposé.
- Le bouton « Envoyer un événement de test » utilise le dernier article publié.
- Ne colle jamais la clé JSON dans le frontend ou dans un dépôt public.
