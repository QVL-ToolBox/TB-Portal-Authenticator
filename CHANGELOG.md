# Changelog — @canop/auth-portals

Toutes les modifications notables de ce paquet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce paquet adhère au [Semantic Versioning](https://semver.org/lang/fr/). La version publiée est celle
de `package.json` : ce fichier n'est pas lu par la pipeline.

## [0.5.0] - 2026-10-29

### Modifié

- Compatible `@canop/ui` 2.x : peerDependency élargie à `^1.3.1 || ^2.0.0`, `@canop/ui` 2.1.1 en dépendance de développement. Aucun export ni prop utilisé par le paquet n'est retiré ou modifié en 2.0 : code inchangé. Rendu suivant la 2.x : fond de `Layout` en trame lave et titre de marque à la couleur de texte du thème, état vide des grilles admin (`EmptyState surface="plain"`) sans surface propre, squelettes à la place des `Spinner` medium dans `PageContent` (#226).

## [0.4.1] - 2026-10-20

### Modifié

- Publication publique : licence MIT, paquet publié sur npmjs (en plus du registre QVL), chaque release reflétée sur https://github.com/QVL-ToolBox/TB-Portal-Authenticator. `@canop/ui` 1.3.3 en dépendance de développement. Code inchangé.

## [0.4.0] - 2026-10-19

### Ajouté

- Slots du portail d'auth : `branding.layout` (composant `{ children }`) remplace le `Layout` de `@canop/ui` autour des pages, `branding.footer` s'affiche sous chaque page. Sans eux, rendu inchangé ; le `Layout` par défaut est exporté sous `AuthBrandLayout`.
- Portail admin clé en main : `createAdminApp(config)` et `<AdminPortalApp config>` (garde admin, tableau de bord, pages Utilisateurs, Rôles et Portails, page Accès refusé, redirection vers le portail d'auth à la perte de session, pied de page légal par défaut). Config : `appName`, `authPortalUrl` (requis), `apiBasePath` (défaut `/api/auth`), `adminApiBasePath` (défaut `/api/admin`), `adminRole` (défaut `admin`), `branding.theme`, `branding.footer`, `adminLayout`, `messages`, `defaultLocale`, `redirect.cookieName` / `cookieDomain`.
- Client admin du portail admin : un seul client HTTP (un seul refresh) pour l'API d'auth et l'API admin ; une 401 ou un compte bloqué (`account_disabled`, `account_pending`) renvoie une seule fois vers la connexion.
- `AdminApi` : `getRegistrationSetting`, `setRegistrationSetting`, `getTraffic` (`/settings/registration`, `/analytics/traffic`).
- Exports headless : `AuthPortalShell`, `AdminPortalShell`, `AdminPortalProvider`, `AdminPortalRoutes`, `RequireAdmin`, `AdminLayout`, `DashboardPage`, `ForbiddenPage`, les cartes du tableau de bord, `useAdminNav`, `useAdminPortalNav`, `useAdminLayout`, `useRequireAdmin`, `useCurrentAdmin`, `useDashboardPage`, `useDashboardStats`, `useRegistrationSetting`, `useTraffic`, `useTrafficCard`, `useForbiddenPage`, `isSessionLostError`, `hasRole`, `ADMIN_APP_PATHS`.
- Textes admin fr/en du tableau de bord, de la garde et de la page Accès refusé (`auth.admin.dashboard.*`, `auth.admin.forbidden.*`, `auth.admin.guard.loadError`), surchargeables par `messages`.
- Serveur : option `securityHeaders` de `startPortalServer` (défaut : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`, exportés sous `DEFAULT_SECURITY_HEADERS`), posée sur toutes les réponses, erreurs et réponses proxifiées comprises. `false` la coupe, un objet surcharge ou retire (`false`) un en-tête ; valeur invalide refusée au démarrage.

### Modifié

- `startPortalServer` pose désormais les en-têtes de sécurité par défaut ; `createPortalServer` n'en pose toujours aucun sans `securityHeaders`.
- `AdminPageContent` n'affiche plus la navigation segmentée dans le portail admin, déjà doté de sa barre de navigation ; inchangé dans un portail d'auth en `admin: true`.
- `useUsers` expose `notify`.

## [0.3.0] - 2026-10-16

### Modifié

- **Changement cassant** : les pages admin `/users`, `/roles` et `/portals` ne sont plus montées par défaut. Un portail admin doit passer `admin: true` à `createAuthApp` ; sans l'option (défaut `false`), ces chemins redirigent vers `/login` et aucun appel admin n'est émis (#176).
- **Changement cassant** : `ResolvedAuthPortalConfig.admin` devient obligatoire (#176).
- Option `admin` validée au démarrage : une valeur non booléenne lève une `AuthPortalConfigError`, sans coercition (#176).

### Sécurité

- Une valeur de config non affichable (objet sans prototype, Proxy révoqué…) lève désormais une `AuthPortalConfigError`, et non plus une `TypeError` (SEC-176-02, #176).

## [0.2.0] - 2026-10-16

### Ajouté

- Option `terms.sections` : sections des CGU injectables (descripteurs de clés, textes portés par `messages`), validées au démarrage, et export `defaultCguSections` (#115).
- Pages admin `/users`, `/roles` et `/portals`, portails chargés dynamiquement via `GET /portals` (#116).
- Client admin unique par portail porté par `AuthPortalProvider` : un seul refresh de session à la fois (#116).
- Option `adminApiBasePath` (défaut `apiBasePath`) pour les seuls appels admin ; le refresh vise toujours `${apiBasePath}/refresh` (#116).
- Annonces d'erreur accessibles et messages explicites pour `last_admin` et `self_modification` (#116).

## [0.1.0] - 2026-10-15

### Ajouté

- Socle `@canop/auth-portals`, repris du portail d'authentification existant et rendu agnostique du projet : pages, hooks, client API et routes (`AUTH_PORTAL_PATHS`), `@canop/ui`, `react` et `react-router-dom` en peerDependencies (#113).
- Serveur de portail mutualisé `@canop/auth-portals/server` : `createPortalServer` et `startPortalServer`, `GET /health`, fichiers statiques avec repli sur `index.html`, `/api` proxifié vers la gateway par un proxy maison sur `node:http`/`node:https` (`502` gateway injoignable, `504` après `gatewayTimeoutMs`), écoute sur `127.0.0.1` par défaut, aucun en-tête de sécurité côté portail (#113).
- Pipeline de publication sur Verdaccio (Qualite, Version, Release derrière l'environnement `verdaccio`) (#113).
- Point d'entrée `createAuthApp(config)` : branding, textes fr/en, CGU et redirection pilotés par la seule config projet, config validée dès l'appel (`AuthPortalConfigError`), aucune variable d'environnement lue par le paquet (#114).
- Anti open-redirect : `resolvePostLoginTarget` et `safeRedirect` n'acceptent qu'un chemin relatif propre (décodage répété jusqu'à stabilité) ou une URL http(s) d'une origine de `redirect.trustedOrigins`, sinon `fallbackRedirect` ; nom de cookie par défaut neutre `auth_redirect` (#114).

### Sécurité

- `http-proxy-middleware` écarté au profit du proxy maison : sa dépendance `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm) n'a pas de correctif (#113).
