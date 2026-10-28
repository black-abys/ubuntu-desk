import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBillingQuery } from "./billing-query.ts";
import { DEMO_ACCOUNT_NO } from "./demo.ts";
import { GREETINGS, SAMPLES, draftReason, findingReply, helpText, missingText } from "./scripts.ts";
import { SA_LANGS, type Lang } from "./types.ts";

const AMOUNT = "R1,633.85";
const REVIEWED = new Set<Lang>(["en", "zu", "st"]);

describe("language scripts", () => {
  it("covers every official language", () => {
    assert.equal(SA_LANGS.length, 11);
    for (const code of SA_LANGS) {
      assert.equal(typeof SAMPLES[code], "string");
    }
  });

  for (const code of SA_LANGS) {
    it(`${code} has a sample, finding, help, not-found, and dispute draft`, () => {
      const sample = SAMPLES[code];
      assert.ok(sample.includes("R3,107"));
      assert.ok(sample.includes("R1,200"));
      assert.equal(isBillingQuery(sample), true, sample);
      assert.equal(isBillingQuery(GREETINGS[code]), false, GREETINGS[code]);

      const finding = findingReply(code, AMOUNT);
      assert.ok(finding.includes(AMOUNT), finding);
      assert.equal(finding.includes("Coming soon"), false);
      assert.ok(helpText(code).length > 40);
      assert.equal(helpText(code).includes("Coming soon"), false);

      const missing = missingText(code, "ZZZ-0000-0000", DEMO_ACCOUNT_NO);
      assert.ok(missing.includes("ZZZ-0000-0000"));
      assert.ok(missing.includes(DEMO_ACCOUNT_NO));
      assert.equal(missing.includes("Coming soon"), false);

      const reason = draftReason(code, "2026-09");
      assert.ok(reason.includes("§14.3"), reason);
      assert.ok(reason.includes("2026-09"), reason);
      if (REVIEWED.has(code)) {
        assert.equal(reason, "Estimated reading appears to exceed the 20% cap (§14.3) for 2026-09");
      }
    });
  }

  it("keeps the isiZulu and Sesotho finding scripts", () => {
    assert.equal(
      findingReply("zu", AMOUNT),
      "Sawubona! Ngibona iphutha elingaba khona: ukufundwa kukaSeptemba bekuqagelwa futhi kudlula umkhawulo ka-20%. Umehluko kule demo ngu-R1,633.85. Lokhu akuqinisekisiwe — qinisekisa ngezansi ukuze uthumele isikhalazo.",
    );
    assert.equal(
      findingReply("st", AMOUNT),
      "Dumela! Ke bona phoso e ka bang teng: palo ya Loetse e ne e hakanngwa mme e feta moedi wa 20%. Phapang demo ena ke R1,633.85. Ha e so netefatsoe — netefatsa ka tlase pele o romela tletlebo.",
    );
  });
});
