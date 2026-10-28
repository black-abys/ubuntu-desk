import { isBillingQuery } from "./billing-query";
import { DEMO_ACCOUNT_NO } from "./demo";
import { helpText, missingText } from "./scripts";
import type { Lang } from "./types";

export { isBillingQuery };

type ReplyMode = "demo-script" | "coming-soon";

/** Friendly off-topic reply. isiZulu and Sesotho lines are reviewed demo scripts. The other eight are machine translations. */
export function helpReply(lang: Lang): { reply: string; replyMode: ReplyMode } {
  return { replyMode: "demo-script", reply: helpText(lang) };
}

export function missingAccountReply(lang: Lang, accountNo: string): { reply: string; replyMode: ReplyMode } {
  return { replyMode: "demo-script", reply: missingText(lang, accountNo, DEMO_ACCOUNT_NO) };
}
