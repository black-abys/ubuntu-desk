import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyseAccount, formatRand } from "./billing.ts";
import type { Account } from "./types.ts";

const demoAccount: Account = {
  accountNo: "JHB-4471-0093",
  holder: "N. Dlamini",
  ward: "Ward 112, Soweto",
  meterType: "conventional",
  tariffCode: "RES-STD-2026",
  source: "simulated",
  readings: [
    { period: "2026-07", kwh: 410, billed: 1248.5, estimated: false },
    { period: "2026-08", kwh: 395, billed: 1203.4, estimated: false },
    { period: "2026-09", kwh: 1020, billed: 3107, estimated: true },
  ],
};

describe("analyseAccount", () => {
  it("reports a potential overcharge of R1,633.85 on the demo account", () => {
    const analysis = analyseAccount({ account: demoAccount, citations: [] });
    assert.equal(analysis.isPotentialError, true);
    assert.equal(analysis.finding, "potential billing error");
    assert.equal(analysis.overcharge, 1633.85);
    assert.equal(formatRand(analysis.overcharge), "R1,633.85");
  });
});
