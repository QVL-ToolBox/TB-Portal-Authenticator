import { BulletList, Feedback, Stack } from "@canop/ui";
import { useCguTerms } from "../hooks/useCguTerms";
import { LegalSection } from "./LegalSection";

export function CguTerms() {
  const { versionLabel, sections, translateSection } = useCguTerms();

  return (
    <Stack gap="lg">
      <Feedback severity="info">{versionLabel}</Feedback>
      {sections.map((section) => (
        <LegalSection key={section.key} title={translateSection(`${section.key}.title`)}>
          {section.kind === "text" ? (
            translateSection(`${section.key}.body`)
          ) : (
            <>
              {translateSection(`${section.key}.intro`)}
              <BulletList
                items={section.items.map((item) => ({
                  key: item,
                  content: translateSection(`${section.key}.${item}`),
                }))}
              />
            </>
          )}
        </LegalSection>
      ))}
    </Stack>
  );
}
