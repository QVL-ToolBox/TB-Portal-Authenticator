export type CguSection =
  { key: string; kind: "text" } | { key: string; kind: "list"; items: readonly string[] };

const DEFAULT_CGU_OBLIGATION_ITEMS: readonly string[] = ["item1", "item2", "item3", "item4"];

export function defaultCguSections(services: readonly string[]): readonly CguSection[] {
  return [
    { key: "object", kind: "text" },
    { key: "acceptance", kind: "text" },
    { key: "services", kind: "list", items: services },
    { key: "account", kind: "text" },
    { key: "obligations", kind: "list", items: DEFAULT_CGU_OBLIGATION_ITEMS },
    { key: "personalData", kind: "text" },
    { key: "intellectualProperty", kind: "text" },
    { key: "liability", kind: "text" },
    { key: "availability", kind: "text" },
    { key: "termination", kind: "text" },
    { key: "modifications", kind: "text" },
    { key: "governingLaw", kind: "text" },
  ];
}
