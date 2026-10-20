import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

function productionFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "test" ? [] : productionFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

interface Hit {
  file: string;
  line: number;
  text: string;
}

function hitsOf(pattern: RegExp): Hit[] {
  return productionFiles(SRC).flatMap((file) =>
    readFileSync(file, "utf-8")
      .split(/\r?\n/)
      .flatMap((text, index) =>
        pattern.test(text)
          ? [{ file: relative(SRC, file).split(sep).join("/"), line: index + 1, text: text.trim() }]
          : [],
      ),
  );
}

describe("aucune valeur de projet en dur dans src", () => {
  it("le scan couvre bien les sources du paquet", () => {
    expect(productionFiles(SRC).length).toBeGreaterThan(10);
  });

  it("le scan inclut le code serveur", () => {
    expect(productionFiles(SRC).some((file) => file.split(sep).includes("server"))).toBe(true);
  });

  it.each([
    ["maloe", /malo[eë]/i],
    ["custhome", /custhome/i],
    ["prefixe ch_", /\bch_/i],
    ["prefixe ml_", /\bml_/i],
    ["budgy", /budgy/i],
    ["drive", /\bdrive\b/i],
    ["qvl-project", /qvl-project/i],
    [
      "nom de domaine en litteral",
      /["'`][^"'`]*\b[a-z0-9-]+\.(com|fr|io|net|org|dev|app|eu|cloud)\b/i,
    ],
    ["URL http(s) absolue hors TLD reserve .invalid", /https?:\/\/(?![a-z0-9.-]+\.invalid\b)/i],
  ])("%s", (_, pattern) => {
    expect(hitsOf(pattern)).toEqual([]);
  });
});

describe("aucune variable d'environnement lue par le paquet", () => {
  it("aucune reference VITE_", () => {
    expect(hitsOf(/VITE_/)).toEqual([]);
  });

  it("aucun import.meta.env", () => {
    expect(hitsOf(/import\.meta\.env/)).toEqual([]);
  });

  it("aucun process.env", () => {
    expect(hitsOf(/process\.env/)).toEqual([]);
  });
});
