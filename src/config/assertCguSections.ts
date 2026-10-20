import { invalidAuthPortalConfig } from "./AuthPortalConfigError";
import { isRecord } from "./configGuards";

const SECTION_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

function isSectionKey(value: unknown): value is string {
  return typeof value === "string" && SECTION_KEY_PATTERN.test(value);
}

function assertListItems(items: unknown, sectionKey: string): void {
  if (!Array.isArray(items) || items.length === 0 || !items.every(isSectionKey)) {
    invalidAuthPortalConfig(
      `terms.sections["${sectionKey}"].items doit etre une liste non vide de cles (lettres, chiffres, "_" ou "-")`,
    );
  }
}

function assertSection(section: unknown, index: number): string {
  const key = isRecord(section) ? section.key : undefined;
  if (!isRecord(section) || !isSectionKey(key)) {
    invalidAuthPortalConfig(
      `terms.sections[${index}].key doit etre une cle (lettres, chiffres, "_" ou "-")`,
    );
  }
  if (section.kind === "list") {
    assertListItems(section.items, key);
  } else if (section.kind !== "text") {
    invalidAuthPortalConfig(`terms.sections["${key}"].kind doit valoir "text" ou "list"`);
  }
  return key;
}

export function assertCguSections(sections: unknown): void {
  if (sections === undefined) return;
  if (!Array.isArray(sections) || sections.length === 0) {
    invalidAuthPortalConfig("terms.sections doit etre une liste non vide s'il est fourni");
  }
  const keys = sections.map(assertSection);
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
  if (duplicate !== undefined) {
    invalidAuthPortalConfig(`terms.sections contient la cle "${duplicate}" en double`);
  }
}
