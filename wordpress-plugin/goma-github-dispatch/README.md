# GOMA - GitHub Article Notifications

Plugin WordPress autonome pour déclencher un événement `repository_dispatch` GitHub lorsqu'un contenu est publié.

## Installation

1. Télécharge le dossier `goma-github-dispatch`.
2. Compresse-le en `goma-github-dispatch.zip` ou copie-le dans `wp-content/plugins/`.
3. Dans WordPress, ouvre **Extensions** et active **GOMA - GitHub Article Notifications**.
4. Va dans **Réglages > Notifications GitHub**.
5. Renseigne le propriétaire GitHub, le nom du dépôt et le token.
6. Enregistre puis utilise **Tester la connexion GitHub**.

## Token GitHub

Crée un token fine-grained limité au dépôt cible avec au minimum :

- Repository access : le dépôt cible uniquement
- Repository permissions : `Contents: Read and write`
- Metadata : `Read-only`

Le token est stocké dans les options privées WordPress et n'est jamais envoyé au navigateur public.

## Contrat avec GitHub Actions

Le workflow du dépôt doit écouter :

```yaml
on:
  repository_dispatch:
    types: [article_published]
```

Le plugin envoie dans `client_payload` : `article_id`, `post_id`, `post_type`, `slug`, `title`, `url`, `image`, `published_at` et `site_url`.

Le script GitHub peut utiliser `article_id` pour récupérer l'article dans l'API REST WordPress et `url`/`image` pour la notification FCM.

## Sécurité

- Ne mets jamais le token dans un article ou dans le code frontend.
- Limite le token au dépôt nécessaire.
- Supprime ou régénère le token immédiatement s'il est exposé.
- Le bouton « Envoyer un événement de test » utilise le dernier article publié avec `test: true`.
