/**
 * Rule-based check: is this message plausibly about a municipal bill or account?
 * Demo lines in all 11 official languages are covered. A greeting on its own is not.
 * This is not a translation and not a language model.
 */
const STEMS = [
  "electric",
  "kwh",
  "kilowatt",
  "overcharge",
  "invoice",
  "statement",
  "arrears",
  "municipal",
  "tariff",
  "ibhili",
  "ibhil",
  "kagesi",
  "ugesi",
  "akhawunti",
  "isikhalazo",
  "ukufundwa",
  "ukukhokha",
  "ngikhokha",
  "motlakase",
  "akhaonto",
  "tletlebo",
  "rekening",
  "elektrisiteit",
  "kragrekening",
  "munisip",
  "dispuut",
  "meterlesing",
  "umbane",
  "ityala",
  "tuelo",
  "kganetso",
  "meetse",
  "ligesi",
  "sikhalo",
  "emanti",
  "libhili",
  "mudagasi",
  "akhanthe",
  "mbadelo",
  "ibhilidi",
  "faktuur",
];

const WORDS = [
  "bill",
  "bills",
  "billing",
  "account",
  "accounts",
  "meter",
  "meters",
  "dispute",
  "disputes",
  "bili",
  "gezi",
  "geshi",
  "tefo",
  "krag",
  "mati",
  "utility",
  "utilities",
];

export function isBillingQuery(text: string): boolean {
  const raw = text.trim().toLowerCase();
  if (!raw) return false;
  if (/\b[a-z]{3}-\d{4}-\d{4}\b/.test(raw)) return true;
  if (STEMS.some((stem) => raw.includes(stem))) return true;
  return WORDS.some((word) => new RegExp(`(?:^|[^a-z0-9])${word}(?:[^a-z0-9]|$)`).test(raw));
}
