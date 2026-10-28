import { DEMO_ACCOUNT_NO } from "@/lib/demo";
import { languageByCode } from "@/lib/languages";
import type { Lang } from "@/lib/types";

/**
 * Rule-based check: is this message plausibly about a municipal bill or account?
 * English, isiZulu, and Sesotho demo lines are covered, plus stems for the other
 * official languages. This is not a translation and not a language model.
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

type ReplyMode = "demo-script" | "coming-soon";

function fallback(lang: Lang, english: string): { reply: string; replyMode: ReplyMode } {
  const name = languageByCode(lang).label;
  return {
    replyMode: "coming-soon",
    reply: `Coming soon for ${name}. ${english} This is an English note, not a ${name} translation.`,
  };
}

/** Friendly off-topic reply. isiZulu and Sesotho lines are demo scripts, not certified translations. */
export function helpReply(lang: Lang): { reply: string; replyMode: ReplyMode } {
  if (lang === "en") {
    return {
      replyMode: "demo-script",
      reply:
        "Hi! I can help with municipal billing questions and account disputes, such as a high electricity bill, an estimated reading, or a charge that looks wrong. Tell me about the bill or the account.",
    };
  }
  if (lang === "zu") {
    return {
      replyMode: "demo-script",
      reply:
        "Sawubona! Ngingakusiza ngemibuzo yamabhili kamasipala nangezikhalazo ze-akhawunti, njengebhili kagesi ephakeme noma ukufundwa okuqagelwe. Ngitshele ngebhili noma nge-akhawunti.",
    };
  }
  if (lang === "st") {
    return {
      replyMode: "demo-script",
      reply:
        "Dumela! Nka o thusa ka dipotso tsa bili ya masepala le ditletlebo tsa akhaonto, jwalo ka bili e phahameng ya motlakase kapa palo e hakantsoeng. Mpolelle ka bili kapa ka akhaonto.",
    };
  }
  return fallback(
    lang,
    "Ubuntu Desk can help with municipal billing questions and account disputes, such as a high electricity bill, an estimated reading, or a charge on an account. Tell me about the bill or the account.",
  );
}

export function missingAccountReply(lang: Lang, accountNo: string): { reply: string; replyMode: ReplyMode } {
  if (lang === "en") {
    return {
      replyMode: "demo-script",
      reply: `I could not find account ${accountNo} on the simulated records. Check the number. The demo account is ${DEMO_ACCOUNT_NO}. No billing finding was made.`,
    };
  }
  if (lang === "zu") {
    return {
      replyMode: "demo-script",
      reply: `Angiyitholanga i-akhawunti ${accountNo} kumarekhodi ale demo. Hlola inombolo. I-akhawunti yedemo ngu-${DEMO_ACCOUNT_NO}. Akukho mphumela webhili.`,
    };
  }
  if (lang === "st") {
    return {
      replyMode: "demo-script",
      reply: `Ha ke fumane akhaonto ${accountNo} direkotong tsa demo. Hlahloba nomoro. Akhaonto ya demo ke ${DEMO_ACCOUNT_NO}. Ha ho phumantsho ya bili.`,
    };
  }
  return fallback(
    lang,
    `Account ${accountNo} was not found on the simulated records. The demo account is ${DEMO_ACCOUNT_NO}. No billing finding was made.`,
  );
}
