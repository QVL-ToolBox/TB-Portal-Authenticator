# TB-Portal-Authenticator

Paquet `@canop/auth-portals` : socle commun des portails d'authentification QVL (pages, hooks, client API), repris du portail d'authentification existant et rendu agnostique du projet. Publié sur Verdaccio (`https://npm.qvl-project.com/`), épinglé par chaque projet.

Miroir public à chaque release : [GitHub `QVL-ToolBox/TB-Portal-Authenticator`](https://github.com/QVL-ToolBox/TB-Portal-Authenticator) (un commit par version) et [npmjs](https://www.npmjs.com/package/@canop/auth-portals).

Exemple d'intégration complet : le dépôt ToolBox [`Authenticator`](https://github.com/QVL-ToolBox/Authenticator) (portails `portal-auth/` et `portal-admin/` minces sur ce paquet, prêts à cloner).

## Installation

```bash
npm install --save-exact @canop/auth-portals@0.4.1
```

Peer dependencies, une seule copie chez le consommateur : `@canop/ui` (^1.3.1), `react` (^19), `react-router-dom` (^7), ainsi que les peers de `@canop/ui` (MUI, Emotion, framer-motion). Le registre du scope `@canop` est déclaré dans `.npmrc` (`@canop:registry=https://npm.qvl-project.com/`).

## Usage

```tsx
import { createAuthApp } from "@canop/auth-portals";
import "@canop/ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Logo } from "./Logo";
import { trustedOrigins } from "./env";

const AuthApp = createAuthApp({
  appName: "Acme",
  terms: { version: "v1", effectiveDate: "2026-07-03", services: ["authenticator", "admin"] },
  branding: { logo: <Logo />, theme: { storageKey: "acme-theme" } },
  messages: { fr: { "auth.cgu.services.admin": "…", "auth.legal.host.name.value": "…" } },
  redirect: { trustedOrigins, cookieName: "acme_redirect", cookieDomain: ".acme.example" },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthApp />
  </StrictMode>,
);
```

`createAuthApp(config)` valide la config dès l'appel et rend le composant racine (i18n, thème, routeur, routes). Une config invalide lève une `AuthPortalConfigError` explicite. Le paquet ne lit aucune variable d'environnement : le projet lit les siennes et les passe dans la config.

- `appName` (requis, non vide) : nom affiché dans l'en-tête, le titre d'onglet et les CGU.
- `terms` (requis) : `version` non vide, `effectiveDate` au format `AAAA-MM-JJ` et date réelle, `services` listés dans les CGU (défaut `["authenticator"]`).
- `terms.sections` (défaut `defaultCguSections(services)`) : sections des CGU, dans l'ordre d'affichage. `{ key, kind: "text" }` lit `auth.cgu.<key>.title` et `.body` ; `{ key, kind: "list", items }` lit `.title`, `.intro` puis `auth.cgu.<key>.<item>` pour chaque item. Les textes viennent de `messages` (`{appName}` interpolé) ; clés et items en lettres, chiffres, `_` ou `-`, clés uniques, liste non vide. `services` n'alimente que les sections par défaut : pour en garder une partie, partir de `defaultCguSections(services)` (exporté).
- `apiBasePath` (défaut `/api/auth`) : API d'auth derrière la gateway, chemin relatif commençant par un seul `/`. Le refresh de session vise toujours `${apiBasePath}/refresh`.
- `admin` (booléen, défaut `false`) : monte les pages admin `/users`, `/roles` et `/portals`. À activer (`admin: true`) uniquement dans un portail admin ; sans l'option, ces chemins tombent sur la route inconnue (redirection vers `/login`). Une valeur non booléenne lève une `AuthPortalConfigError`.
- `adminApiBasePath` (défaut `apiBasePath`) : préfixe des seuls appels admin (`/users`, `/roles`, `/portals`), même validation que `apiBasePath`. Pour un portail admin derrière la gateway, `/api/admin` est recommandé (filtrage `/validate` de la gateway en plus du contrôle `PortalAdmin` d'Auth) ; le refresh reste sur l'API d'auth, jamais sous le chemin admin.
- `branding.logo`, `header`, `maxWidth`, `showUtilities` : props du `Layout` de `@canop/ui` (logo par défaut : icône `home`).
- `branding.layout` (composant `{ children }`) : remplace le `Layout` de `@canop/ui` autour des pages ; `branding.footer` (`ReactNode`) : affiché sous chaque page. Voir « Personnaliser ».
- `branding.animatedShapes` (défaut `true`) : formes animées du fond.
- `branding.theme` (défaut `{ defaultMode: "system" }`) : props de `CanopThemeProvider` (`defaultMode`, `mode`, `storageKey`, `season`, `seasonalDecor`).
- `messages`, `defaultLocale` (`fr` ou `en`, défaut `fr`) : surcharge des textes fr/en d'`authPortalMessages` (marque, services des CGU, mentions légales `auth.legal.*`).
- `redirect.trustedOrigins` (défaut `[]`) : origines http(s) acceptées après connexion, sans identifiants ni chemin (`https://app.acme.example`) ; les entrées vides sont ignorées.
- `redirect.fallbackRedirect` (défaut `/account`) : cible si la redirection demandée est absente ou refusée ; doit elle-même passer la validation.
- `redirect.cookieName` (défaut neutre `auth_redirect`) : chaque projet passe le nom de cookie de ses portails, celui donné à `buildLoginUrl` de `@canop/ui`. Lettres, chiffres, `_` et `-` uniquement, préfixes `__Host-` et `__Secure-` refusés (le paquet ne saurait pas les effacer).
- `redirect.cookieDomain` : doit être identique au `redirectCookieDomain` passé à `buildLoginUrl` par les portails producteurs, sinon le cookie n'est pas effacé après connexion.

Avec le composant `<AuthPortal config={config} />` plutôt que `createAuthApp`, déclarer `config` au niveau module (référence stable). Pour composer ses propres routes : `AuthPortalProvider` (qui reçoit la config résolue par `resolveAuthPortalConfig`) + `AuthPortalRoutes`, ou les pages (`LoginPage`, `RegisterPage`…) et hooks (`useLogin`, `useRegister`…) exportés un à un.

## Portail admin

```tsx
import { createAdminApp } from "@canop/auth-portals";
import "@canop/ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { authPortalUrl, cookieDomain } from "./env";

const AdminApp = createAdminApp({
  appName: "Acme",
  authPortalUrl,
  branding: { theme: { storageKey: "acme-theme" } },
  messages: { fr: { "auth.admin.portal.files": "Fichiers" } },
  redirect: { cookieName: "acme_redirect", cookieDomain },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
```

`createAdminApp(config)` (ou `<AdminPortalApp config={config} />`, config au niveau module) valide la config dès l'appel (`AuthPortalConfigError`) et rend : `/forbidden`, puis derrière la garde admin `/dashboard` (statistiques, ouverture des inscriptions, trafic, comptes en attente), `/users`, `/roles`, `/portals` ; `/` et toute route inconnue mènent au tableau de bord — voir `ADMIN_APP_PATHS`.

- `appName` (requis) : titre de la barre de navigation et de l'onglet.
- `authPortalUrl` (requis) : origine http(s) du portail d'auth, sans chemin. Connexion (`/login?redirect=1`, cookie de retour posé avant de partir) et CGU (`/cgu`) y pointent.
- `apiBasePath` (défaut `/api/auth`) : `me`, `logout` et `refresh`. `adminApiBasePath` (défaut `/api/admin`) : appels admin. Un seul client HTTP sert les deux, donc un seul refresh à la fois.
- `adminRole` (défaut `admin`) : rôle exigé par la garde. Non connecté (401, `account_disabled`, `account_pending`) : redirection unique vers la connexion ; connecté sans le rôle : `/forbidden`.
- `branding.theme`, `messages`, `defaultLocale` : comme pour le portail d'auth (textes `auth.admin.*`).
- `branding.footer` (défaut : liens CGU et mentions légales du portail d'auth, `LegalLinks` de `@canop/ui`) ; `null` pour aucun pied de page.
- `adminLayout` (composant `{ children }`) : remplace `AdminLayout` (`PageScaffold` de `@canop/ui`).
- `redirect.cookieName` (défaut `auth_redirect`), `redirect.cookieDomain` : identiques à ceux du portail d'auth.

## Personnaliser

Trois niveaux, du plus simple au plus libre :

1. **Thème** : `branding.theme` (props de `CanopThemeProvider`), `branding.logo`, `appName`, `messages` (tout texte fr/en, libellés des portails `auth.admin.portal.<name>`).
2. **Slots** : `branding.layout` remplace le cadre des pages d'auth, `branding.footer` ajoute un pied de page, `adminLayout` remplace le cadre du portail admin. Un slot reçoit `{ children }` (type `PortalLayoutProps`) et peut s'appuyer sur `useAuthPortal()` ou `useAdminLayout()` (navigation, utilisateur, déconnexion, pied de page) :

   ```tsx
   import { useAdminLayout, type PortalLayoutProps } from "@canop/auth-portals";

   function AcmeAdminLayout({ children }: PortalLayoutProps) {
     const { items, onNavigate, userName, onLogout, footer } = useAdminLayout();
     return <AcmeShell nav={items} onNavigate={onNavigate} user={userName} onLogout={onLogout} footer={footer}>{children}</AcmeShell>;
   }

   createAdminApp({ appName: "Acme", authPortalUrl, adminLayout: AcmeAdminLayout });
   ```

3. **Headless** : composer ses propres routes avec `AuthPortalShell` / `AdminPortalShell` (config résolue par `resolveAuthPortalConfig` / `resolveAdminPortalConfig`), ou `AuthPortalProvider` / `AdminPortalProvider` + ses écrans, en réutilisant les pages (`DashboardPage`, `UsersPage`…), `RequireAdmin` et les hooks (`useLogin`, `useRequireAdmin`, `useCurrentAdmin`, `useAdminNav`, `useAdminPortalNav`, `useDashboardPage`, `useRegistrationSetting`, `useTraffic`…).

## Redirection après connexion

`resolvePostLoginTarget({ search, cookieTarget }, policy)` est pure : la cible vient du paramètre `redirect` (ou du cookie si `redirect=1`), puis `safeRedirect` la valide. Sont acceptés uniquement un chemin relatif propre (commence par un seul `/`, sans `\` ni caractère de contrôle, à chaque passe de décodage jusqu'à stabilité) ou une URL http(s) sans identifiants dont l'origine figure dans `trustedOrigins`. Tout le reste (`//x`, `/\x`, `%2f%5Cx`, `javascript:`…) renvoie `fallbackRedirect`.

## Serveur du portail (`@canop/auth-portals/server`)

Point d'entrée Node (ESM) qui remplace `app.js` / `server.js` du portail : `GET /health` → `{ "status": "ok", "service": <service> }`, `/api` et `/api/*` proxifiés vers la gateway (méthode, chemin et query, corps en flux, `Host` réécrit vers la gateway, `X-Forwarded-For/Proto/Host`, statut et corps relayés, `502` si la gateway est injoignable, `504` après `gatewayTimeoutMs` sans activité), fichiers statiques de `distDir` puis repli sur `index.html`. Les erreurs (404, 416…) répondent le statut seul, sans détail interne. `server.js` du portail :

```js
import { fileURLToPath } from "node:url";
import { startPortalServer } from "@canop/auth-portals/server";

startPortalServer({
  service: "mon-portail-auth",
  port: Number(process.env.PORT ?? 3000),
  gatewayUrl: process.env.GATEWAY_URL ?? "http://localhost:8080",
  distDir: fileURLToPath(new URL("./dist", import.meta.url)),
});
```

- `startPortalServer` écoute sur `host` (défaut `LOOPBACK_HOST`, `127.0.0.1`) et journalise une ligne JSON au démarrage.
- `securityHeaders` (défaut `true` pour `startPortalServer`, `false` pour `createPortalServer`) : en-têtes posés sur toutes les réponses, erreurs et réponses proxifiées comprises (un en-tête renvoyé par la gateway garde la valeur de la gateway). `true` = `DEFAULT_SECURITY_HEADERS` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'`) ; `false` : aucun ; objet : surcharge par nom (insensible à la casse), `false` retire un en-tête, par exemple `{ "Content-Security-Policy": "frame-ancestors 'self'", "X-Frame-Options": false }`. Nom ou valeur invalide : `TypeError` au démarrage.
- `gatewayTimeoutMs` (optionnel, défaut `30000`) : délai sans activité vers la gateway avant le `504` ; entier strictement positif, sinon `RangeError` à la création du serveur.
- `createPortalServer({ service, gatewayUrl, distDir, gatewayTimeoutMs })` renvoie le `RequestListener` sans écouter (tests `supertest`, serveur `http` maison).
- Le déploiement du portail doit embarquer `node_modules` (ou lancer `npm ci --omit=dev`) : le serveur n'est plus un fichier autonome.

## Routes

`/login`, `/register`, `/forgot-password`, `/reset-password`, `/pending`, `/cgu` (ancre `#mentions-legales`), `/account` — voir `AUTH_PORTAL_PATHS`.

Portail admin (`createAdminApp`) : `/forbidden`, `/dashboard`, `/users`, `/roles`, `/portals` — voir `ADMIN_APP_PATHS` et « Portail admin ».

Pages admin dans un portail d'auth : `/users`, `/roles`, `/portals` — voir `ADMIN_PORTAL_PATHS`, montées par `AuthPortalRoutes` seulement avec `admin: true` (un portail d'authentification ne les expose pas). Elles appellent l'API sous `adminApiBasePath` via un client admin unique créé par `AuthPortalProvider` (`useAdminApi()` le lit dans le contexte) : un seul verrou de refresh pour tout le portail, donc des 401 simultanés ne déclenchent qu'un `POST /refresh`. Le contrôle d'accès reste côté serveur (403 pour un non-admin).

Libellés des portails : chaque portail déclaré côté Auth s'affiche sous le libellé de la clé `auth.admin.portal.<name>` passée dans `messages` (par exemple `messages: { fr: { "auth.admin.portal.drive": "Drive" }, en: { … } }`), sinon sous son `name` brut.

## Développement

`npm run build` (tsc + Vite lib, ESM + `.d.ts` ; puis `tsc -p tsconfig.server.json` pour `dist/server`), `npm run lint`, `npm run format:check`, `npm test`. Le code de `src/server/` est du Node pur (`tsconfig.server.json`, NodeNext, imports relatifs en `.js`), exclu de `tsconfig.app.json`.

## Publication

`azure-pipelines.yml` (pool `QVL-Local`, calquée sur CanopUI, `version.mjs` de `QVL-ToolBox/Pipelines` en mode registre) :

| Stage | Branches | Contenu |
|---|---|---|
| Qualite | toutes | `version.mjs check`, `npm ci` (build via `prepare`), lint, Prettier, osv-scanner, Vitest |
| Version | `main` | `version.mjs release` : la version de `package.json` est-elle à publier ? |
| Release | `main`, si nouvelle version | approbation de l'environnement `verdaccio`, tag `vX.Y.Z` (message `@canop/auth-portals vX.Y.Z`), `npm pack` puis publication du tarball sur Verdaccio, artefact du paquet |

La version se monte sur la branche (`package.json`), le merge sur `main` publie ; tags jamais posés à la main. Prérequis de la définition : variable secrète `NPM_TOKEN`, accès aux environnements `verdaccio` et au dépôt `QVL-ToolBox/Pipelines`.

## Décisions

- 2026-10-15 — Socle repris du portail d'authentification existant, `@canop/ui` en peerDependency ; aucun projet réel cité dans le paquet publié (#113).
- 2026-10-15 — Serveur du portail mutualisé (`./server`) ; `express` seul en `dependencies` (détail d'implémentation, API publique typée sur `node:http` seul) ; proxy maison sur `node:http`/`node:https` à la place de `http-proxy-middleware` (dépendance `braces@3.0.3`, GHSA-vfj7-8cjw-p6xm, sans correctif) ; pipeline sans vitrine, déploiement ni rebuild des fronts (#113).
- 2026-10-15 — Point d'entrée `createAuthApp(config)` : branding, textes, CGU et redirection pilotés par la seule config projet, aucune variable `VITE_*` lue par le paquet, anti open-redirect repris du portail d'origine et durci (décodage multiple, config validée au démarrage), nom de cookie par défaut neutre `auth_redirect` (#114).
- 2026-10-16 — Sections des CGU injectables par `terms.sections` (descripteurs de clés, textes toujours portés par `messages` pour rester bilingues), validées au démarrage ; défaut inchangé (#115).
- 2026-10-16 — Client admin unique par portail porté par `AuthPortalProvider` (un seul verrou de refresh : des refresh concurrents étaient vus comme un rejeu et révoquaient la famille de tokens) ; option `adminApiBasePath` (défaut `apiBasePath`, `/api/admin` recommandé derrière la gateway), refresh toujours sur `${apiBasePath}/refresh` (#116).
- 2026-10-16 — Pages admin montées seulement sur option `admin: true` (défaut `false`) : un portail d'authentification n'expose plus `/users`, `/roles` ni `/portals` ; changement de comportement par défaut par rapport à la 0.2.0 (#176, D11).
- 2026-10-19 — Personnalisation à trois niveaux (thème, slots `branding.layout` / `branding.footer` / `adminLayout`, headless) et portail admin `createAdminApp` remonté du portail admin existant ; client HTTP unique par portail admin ; en-têtes de sécurité posés par défaut par `startPortalServer` (jeu de la gateway), `createPortalServer` inchangé (D2).
- 2026-10-19 — Dépôt renommé `AuthPortals` → `TB-Portal-Authenticator` (l'ancienne URL `_git/AuthPortals` ne redirige pas) ; nom du paquet npm `@canop/auth-portals` inchangé.
