import type { AuthPortalConfig } from "../index";

export const TEST_APP_NAME = "Portail Générique";
export const TEST_TERMS_VERSION = "v-test";
export const TEST_TERMS_DATE = "2026-01-15";
export const TEST_TERMS_DATE_FR = "15/01/2026";

export const TEST_CONFIG: AuthPortalConfig = {
  appName: TEST_APP_NAME,
  terms: { version: TEST_TERMS_VERSION, effectiveDate: TEST_TERMS_DATE },
};
