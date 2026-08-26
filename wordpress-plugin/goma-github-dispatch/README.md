# GOMA - GitHub Article Notifications

Plugin WordPress autonome pour déclencher un événement `repository_dispatch` GitHub lorsqu'un contenu est publié.

## Installation

1. Télécharge le dossier `goma-github-dispatch`.
2. Compresse-le en `goma-github-dispatch.zip` ou copie-le dans `wp-content/plugins/`.
3. Dans WordPress, ouvre **Extensions** et active **GOMA - GitHub Article Notifications**.
4. Va dans **Réglages > Notifications GitHub**.
5. Crée une GitHub OAuth App dans **Settings > Developer settings > OAuth Apps > New OAuth App**.
6. Utilise comme callback l'URL affichée par le plugin, puis renseigne le Client ID et le Client Secret.
7. Enregistre les réglages. Le bouton de connexion est alors activé.
8. Clique sur **Se connecter à GitHub** et autorise l’application avec le compte qui possède le dépôt.
9. Choisis le dépôt cible dans la liste chargée depuis GitHub et enregistre à nouveau.
10. Utilise **Tester la connexion GitHub**.

Le dépôt n'est pas nécessaire pour démarrer la connexion : il est chargé et choisi seulement après le retour de GitHub. GitHub exige toutefois que le Client ID et le Client Secret de l'OAuth App soient enregistrés avant cette connexion. Le plugin désactive donc le bouton tant que ces deux champs ne sont pas renseignés.

## Token GitHub

Le bouton OAuth crée et enregistre un token OAuth côté WordPress. Pour les dépôts privés, l'autorisation OAuth utilise la portée `repo`.

Alternative manuelle : crée un token fine-grained limité au dépôt cible avec au minimum :

- Repository access : le dépôt cible uniquement
- Repository permissions : `Contents: Read and write`
- Metadata : `Read-only`

Les identifiants OAuth et le token sont stockés dans les options privées WordPress et ne sont jamais envoyés au navigateur public. La création d'un token GitHub personnel ne peut pas être automatisée directement par un plugin ; OAuth est le mécanisme prévu par GitHub.

## Contrat avec GitHub Actions

Le workflow du dépôt doit écouter :

```yaml
on:
  repository_dispatch:
    types: [article_published]
```

Le plugin envoie dans `client_payload` : `article_id`, `post_id`, `post_type`, `slug`, `title`, `url`, `image`, `published_at` et `site_url`.

Le script GitHub peut utiliser `article_id` pour récupérer l'article dans l'API REST WordPress et `url`/`image` pour la notification FCM.

## Délai et publications rapprochées

Les contenus publiés sont placés dans une file puis envoyés à GitHub après environ 2 minutes. Plusieurs publications pendant cette fenêtre sont regroupées dans un seul événement `repository_dispatch`, avec `article_ids` dans `client_payload`.

Le délai repose sur WP-Cron : il démarre lorsqu'une visite arrive sur le site. Pour un délai plus régulier sur un site peu visité, configure une vraie tâche cron serveur qui appelle `wp-cron.php` toutes les minutes. Le bouton de test reste envoyé immédiatement.

## Sécurité

- Ne mets jamais le token dans un article ou dans le code frontend.
- Limite le token au dépôt nécessaire.
- Supprime ou régénère le token immédiatement s'il est exposé.
- Le bouton « Envoyer un événement de test » utilise le dernier article publié avec `test: true`.
