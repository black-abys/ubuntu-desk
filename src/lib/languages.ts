import { SAMPLES } from "./scripts";
import { SA_LANGS, type Lang } from "./types";

export interface LanguageInfo {
  code: Lang;
  /** English name used in replies and other copy. */
  label: string;
  /** Name of the language in that language. Shown in the language picker. */
  native: string;
  bcp: string;
  /** full = a demo script exists. stub = English placeholder only. */
  support: "full" | "stub";
  /** reviewed = existing demo script. machine = static translation pending native-speaker review. */
  translation: "reviewed" | "machine";
  sample: string;
}

/**
 * All 11 official languages of South Africa.
 * English, isiZulu, and Sesotho use the reviewed demo scripts.
 * The other eight use static machine translations, marked as such in the UI.
 */
export const LANGUAGES: LanguageInfo[] = [
  { code: "en", label: "English", native: "English", bcp: "en-ZA", support: "full", translation: "reviewed", sample: SAMPLES.en },
  { code: "zu", label: "isiZulu", native: "isiZulu", bcp: "zu-ZA", support: "full", translation: "reviewed", sample: SAMPLES.zu },
  { code: "st", label: "Sesotho", native: "Sesotho", bcp: "st-ZA", support: "full", translation: "reviewed", sample: SAMPLES.st },
  { code: "af", label: "Afrikaans", native: "Afrikaans", bcp: "af-ZA", support: "full", translation: "machine", sample: SAMPLES.af },
  { code: "nr", label: "isiNdebele", native: "isiNdebele", bcp: "nr-ZA", support: "full", translation: "machine", sample: SAMPLES.nr },
  { code: "xh", label: "isiXhosa", native: "isiXhosa", bcp: "xh-ZA", support: "full", translation: "machine", sample: SAMPLES.xh },
  { code: "nso", label: "Sepedi", native: "Sepedi", bcp: "nso-ZA", support: "full", translation: "machine", sample: SAMPLES.nso },
  { code: "tn", label: "Setswana", native: "Setswana", bcp: "tn-ZA", support: "full", translation: "machine", sample: SAMPLES.tn },
  { code: "ss", label: "siSwati", native: "siSwati", bcp: "ss-ZA", support: "full", translation: "machine", sample: SAMPLES.ss },
  { code: "ve", label: "Tshivenda", native: "Tshivenḓa", bcp: "ve-ZA", support: "full", translation: "machine", sample: SAMPLES.ve },
  { code: "ts", label: "Xitsonga", native: "Xitsonga", bcp: "ts-ZA", support: "full", translation: "machine", sample: SAMPLES.ts },
];

const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l])) as Record<Lang, LanguageInfo>;

export function languageByCode(code: Lang): LanguageInfo {
  return byCode[code];
}

export function isLang(value: string | null | undefined): value is Lang {
  return !!value && (SA_LANGS as readonly string[]).includes(value);
}
