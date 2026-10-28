import { SA_LANGS, type Lang } from "@/lib/types";

export interface LanguageInfo {
  code: Lang;
  /** English name used in replies and other copy. */
  label: string;
  /** Name of the language in that language. Shown in the language picker. */
  native: string;
  bcp: string;
  /** Reviewed demo reply and sample utterance exist for this language. */
  support: "full" | "stub";
  sample: string;
}

/**
 * All 11 official languages of South Africa.
 * English, isiZulu, and Sesotho are wired for typed and spoken demo replies.
 * The other eight can be selected, but replies stay an English coming-soon placeholder.
 */
export const LANGUAGES: LanguageInfo[] = [
  {
    code: "en",
    label: "English",
    native: "English",
    bcp: "en-ZA",
    support: "full",
    sample: "Hi, why is my electricity bill R3,107 this month? I normally pay about R1,200.",
  },
  {
    code: "zu",
    label: "isiZulu",
    native: "isiZulu",
    bcp: "zu-ZA",
    support: "full",
    sample: "Sawubona, kungani ibhili yami kagesi ingu-R3,107 kulenyanga? Imvamisa ngikhokha cishe u-R1,200.",
  },
  {
    code: "st",
    label: "Sesotho",
    native: "Sesotho",
    bcp: "st-ZA",
    support: "full",
    sample: "Dumela, hobaneng bili ya ka ya motlakase e le R3,107 kgweding ena? Hangata ke lefa R1,200 feela.",
  },
  { code: "af", label: "Afrikaans", native: "Afrikaans", bcp: "af-ZA", support: "stub", sample: "" },
  { code: "nr", label: "isiNdebele", native: "isiNdebele", bcp: "nr-ZA", support: "stub", sample: "" },
  { code: "xh", label: "isiXhosa", native: "isiXhosa", bcp: "xh-ZA", support: "stub", sample: "" },
  { code: "nso", label: "Sepedi", native: "Sepedi", bcp: "nso-ZA", support: "stub", sample: "" },
  { code: "tn", label: "Setswana", native: "Setswana", bcp: "tn-ZA", support: "stub", sample: "" },
  { code: "ss", label: "siSwati", native: "siSwati", bcp: "ss-ZA", support: "stub", sample: "" },
  { code: "ve", label: "Tshivenda", native: "Tshivenḓa", bcp: "ve-ZA", support: "stub", sample: "" },
  { code: "ts", label: "Xitsonga", native: "Xitsonga", bcp: "ts-ZA", support: "stub", sample: "" },
];

const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l])) as Record<Lang, LanguageInfo>;

export function languageByCode(code: Lang): LanguageInfo {
  return byCode[code];
}

export function isLang(value: string | null | undefined): value is Lang {
  return !!value && (SA_LANGS as readonly string[]).includes(value);
}
