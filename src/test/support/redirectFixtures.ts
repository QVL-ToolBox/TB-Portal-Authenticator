import type { RedirectPolicy } from "../../index";

export const PORTAL_ORIGIN = window.location.origin;
export const TRUSTED_ORIGIN = "https://app.example.test";
export const SECOND_TRUSTED_ORIGIN = "http://localhost:5173";
export const FALLBACK = "/account";

export const POLICY: RedirectPolicy = {
  trustedOrigins: [TRUSTED_ORIGIN, SECOND_TRUSTED_ORIGIN],
  fallbackRedirect: FALLBACK,
};

export const SAFE_ORIGINS = [PORTAL_ORIGIN, TRUSTED_ORIGIN, SECOND_TRUSTED_ORIGIN];

export function landingOrigin(target: string): string {
  return new URL(target, PORTAL_ORIGIN).origin;
}

const LONG = "a".repeat(100_000);
const DEEP_PERCENT = "%25".repeat(5_000);

export const REJECTED_TARGETS: Record<string, string> = {
  "origine absolue hors trustedOrigins": "https://evil.test/x",
  "backslash apres slash /\\x": "/\\x",
  "protocol-relative //x": "//x",
  "encode %2f%5Cx": "%2f%5Cx",
  "encode /%2f/x": "/%2f/x",
  "double encode /%255Cx": "/%255Cx",
  "encode majuscule %2F%2Fevil.com": "%2F%2Fevil.com",
  "double backslash /\\\\evil.com": "/\\\\evil.com",
  "backslash slash \\/evil.com": "\\/evil.com",
  "triple slash ///evil.com": "///evil.com",
  "encode /%5C%5Cevil.com": "/%5C%5Cevil.com",
  "encode /%2F%5Cevil.com": "/%2F%5Cevil.com",
  "javascript:alert(1)": "javascript:alert(1)",
  "JaVaScRiPt majuscules": "JaVaScRiPt:alert(1)",
  "javascript precede d'un espace": " javascript:alert(1)",
  "javascript avec tabulation": "java\tscript:alert(1)",
  "javascript encode": "javascript%3Aalert(1)",
  "data:": "data:text/html,<script>alert(1)</script>",
  "vbscript:": "vbscript:msgbox(1)",
  "file:": "file:///etc/passwd",
  "ftp sur hote de confiance": "ftp://app.example.test/",
  "identifiants user:pass sur hote de confiance": "https://user:pass@app.example.test/",
  "identifiant user seul sur hote de confiance": "https://user@app.example.test/",
  "hote de confiance en userinfo": "https://app.example.test@evil.com/",
  "sous-domaine piege trusted.evil.com": "https://app.example.test.evil.com/",
  "suffixe piege": "https://evilapp.example.test/",
  "http au lieu de https": "http://app.example.test/",
  "https au lieu de http": "https://localhost:5173/",
  "port different": "https://app.example.test:8443/",
  "port different sur origine localhost": "http://localhost:5174/",
  "https sans slashes": "https:evil.com",
  "https un seul slash": "https:/evil.com",
  "hote evil en majuscules": "https://EVIL.TEST/",
  "tabulation /\\t/evil.com": "/\t/evil.com",
  "retour chariot /\\r/evil.com": "/\r/evil.com",
  "saut de ligne /\\n/evil.com": "/\n/evil.com",
  "tabulation en tete \\t//evil.com": "\t//evil.com",
  "tabulation encodee /%09/evil.com": "/%09/evil.com",
  "CRLF encode /%0d%0a/evil.com": "/%0d%0a/evil.com",
  "caractere nul": "/\u0000/evil.com",
  "double encodage %252F%252Fevil.com": "%252F%252Fevil.com",
  "triple encodage %25252F%25252Fevil.com": "%25252F%25252Fevil.com",
  "double encodage /%25255Cevil.com": "/%25255Cevil.com",
  "unicode cyrillique homographe": "https://\u0430pp.example.test/",
  "unicode point ideographique": "https://app.example.test\u3002evil.com/",
  "unicode slashs pleine chasse en tete": "\uFF0F\uFF0Fevil.test",
  "tres longue URL hors confiance": `https://evil.test/${LONG}`,
  "tres longue chaine protocol-relative": `//evil.test/${LONG}`,
  "encodage tres profond": `${DEEP_PERCENT}2F%2Fevil.com`,
};

export const SAFE_BUT_UNSPECIFIED_TARGETS: Record<string, string> = {
  "majuscules d'hote de confiance": "https://APP.EXAMPLE.TEST/x",
  "port par defaut explicite": "https://app.example.test:443/x",
  "unicode slashs pleine chasse apres slash": "/\uFF0F/evil.test",
  "unicode division slash": "/\u2215\u2215evil.test",
  "unicode dans le chemin": "/caf\u00e9",
  "tres long chemin relatif": `/${LONG}`,
};
