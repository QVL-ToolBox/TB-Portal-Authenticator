import {
  DescriptionList,
  Heading,
  LEGAL_NOTICE_ANCHOR,
  Stack,
  Text,
  useTranslation,
} from "@canop/ui";
import { LegalSection } from "./LegalSection";

interface LegalBlock {
  key: string;
  fields: readonly string[];
}

const LEGAL_BLOCKS: readonly LegalBlock[] = [
  {
    key: "editor",
    fields: ["companyName", "legalForm", "shareCapital", "headOffice", "rcs", "vat"],
  },
  { key: "contact", fields: ["email", "phone"] },
  { key: "publicationDirector", fields: ["name"] },
  { key: "host", fields: ["name", "address", "contact"] },
];

export function LegalNotice() {
  const { t } = useTranslation();

  return (
    <section id={LEGAL_NOTICE_ANCHOR}>
      <Stack gap="lg">
        <Heading level={3} size={5}>
          {t("auth.legal.title")}
        </Heading>
        <Text>{t("auth.legal.intro")}</Text>
        {LEGAL_BLOCKS.map((block) => (
          <LegalSection key={block.key} level={4} title={t(`auth.legal.${block.key}.title`)}>
            <DescriptionList
              items={block.fields.map((field) => ({
                label: t(`auth.legal.${block.key}.${field}.label`),
                value: t(`auth.legal.${block.key}.${field}.value`),
              }))}
            />
          </LegalSection>
        ))}
      </Stack>
    </section>
  );
}
