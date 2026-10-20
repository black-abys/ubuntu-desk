import type { Account, BillAnalysis, BillContext, CalcStep, Citation } from "@/lib/types";

/** Blended residential rate used only by the demo tariff table. */
export const DEMO_RATE_RAND_PER_KWH = 3.05;
const CAP_RATIO = 1.2;

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatRand(n: number): string {
  const negative = n < 0;
  const [whole, cents] = Math.abs(n).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}R${grouped}.${cents}`;
}

const CAUTION =
  "This is a potential finding from simulated records and a demo tariff. It stays a potential billing error until the municipal account, a verified reading, and the cited by-law text agree. Nothing here writes off a balance or suspends collection.";

/**
 * Transparent bill check. Figures come from the simulated account and, when
 * present, a scanned bill. The result is never described as confirmed.
 */
export function analyseAccount(input: {
  account: Account;
  bill?: BillContext | null;
  citations: Citation[];
}): BillAnalysis {
  const { account, bill } = input;
  const readings = account.readings;
  const matched = bill?.period ? readings.find((r) => r.period === bill.period) : undefined;
  const subject = matched ?? readings[readings.length - 1];
  const period = bill?.period || subject?.period || "unknown";
  const kwh = bill?.kwh ?? subject?.kwh ?? 0;
  const estimated = bill?.estimated ?? subject?.estimated ?? false;
  const billed = roundMoney(bill?.total ?? subject?.billed ?? 0);
  const usedBill = Boolean(bill && (bill.period || bill.kwh != null || bill.total != null));
  const ocrSimulated = usedBill ? bill?.simulated !== false : false;
  const billSource = usedBill ? "Bill document · simulated OCR" : "Simulated account reading";

  const actuals = readings.filter((r) => !r.estimated && r.period !== period);
  const avg = actuals.length ? actuals.reduce((sum, r) => sum + r.kwh, 0) / actuals.length : 0;
  const capKwh = avg * CAP_RATIO;
  const expected = roundMoney(capKwh * DEMO_RATE_RAND_PER_KWH);
  const overcharge = roundMoney(Math.max(0, billed - expected));
  const accountMismatch = Boolean(bill?.accountNo && bill.accountNo !== account.accountNo);
  const aboveCap = Boolean(subject && estimated && actuals.length > 0 && kwh > capKwh);
  const isPotentialError = aboveCap && !accountMismatch;

  const finding = accountMismatch
    ? "needs reconciliation"
    : isPotentialError
      ? "potential billing error"
      : "no potential error in these figures";

  const steps: CalcStep[] = [
    {
      id: "account",
      label: "Account on file",
      detail: `${account.accountNo} · ${account.holder} · ${account.tariffCode}`,
      source: account.source === "openedge" ? "OpenEdge adapter" : "Simulated OpenEdge adapter",
    },
    {
      id: "bill-account",
      label: "Account on the bill",
      detail: bill?.accountNo ?? "No bill attached",
      source: usedBill ? "Simulated OCR" : "Not scanned",
    },
    {
      id: "period",
      label: "Billing period",
      detail: period,
      source: billSource,
    },
    {
      id: "units",
      label: "Units checked",
      detail: `${kwh.toLocaleString("en-ZA")} kWh${estimated ? " · marked estimated" : " · not marked estimated"}`,
      source: billSource,
    },
    {
      id: "actuals",
      label: "Actual readings in the average",
      detail: actuals.length
        ? `${actuals.map((r) => `${r.period} ${r.kwh} kWh`).join("; ")} (${actuals.length} available; §14.3 refers to the preceding three)`
        : "No actual readings on the simulated account.",
      source: "Simulated account history",
      cite: "§14.3",
    },
    {
      id: "average",
      label: "Average of those actual readings",
      detail: actuals.length ? `${avg.toFixed(1)} kWh` : "—",
      source: "Calculated in this demo",
    },
    {
      id: "cap",
      label: "Cap",
      detail: actuals.length ? `${avg.toFixed(1)} kWh average, plus 20% = ${capKwh.toFixed(1)} kWh` : "—",
      source: "City Electricity Tariff & Credit Control By-law 2026/27",
      cite: "§14.3 Estimated consumption",
    },
    {
      id: "tariff",
      label: "Tariff rate used",
      detail: `${account.tariffCode} at ${formatRand(DEMO_RATE_RAND_PER_KWH)} per kWh, blended`,
      source: "Demo tariff table — not a live tariff service",
    },
    {
      id: "expected",
      label: "Maximum charge at the cap",
      detail: actuals.length ? `${capKwh.toFixed(1)} × ${DEMO_RATE_RAND_PER_KWH.toFixed(2)} = ${formatRand(expected)}` : "—",
      source: "Calculated in this demo",
    },
    {
      id: "billed",
      label: "Amount billed",
      detail: formatRand(billed),
      source: billSource,
    },
    {
      id: "difference",
      label: "Difference",
      detail: isPotentialError ? `${formatRand(billed)} − ${formatRand(expected)} = ${formatRand(overcharge)}` : formatRand(0),
      source: "Calculated in this demo",
    },
  ];

  if (accountMismatch) {
    steps.push({
      id: "reconcile",
      label: "Reconciliation",
      detail: `The bill account ${bill?.accountNo} does not match the account looked up (${account.accountNo}). The figures are not treated as a billing error on this account.`,
      source: "Compared in this demo",
    });
  }

  const cited = input.citations.map((c) => c.clause).join(" · ");
  steps.push({
    id: "result",
    label: "Result",
    detail: resultDetail(finding, overcharge),
    source: cited ? `Clauses shown with this check: ${cited}` : "No clauses returned",
    cite: isPotentialError ? "§14.3" : undefined,
  });

  return {
    simulatedRecords: true,
    ocrSimulated,
    usedBill,
    finding,
    caution: CAUTION,
    steps,
    expected,
    billed,
    overcharge: isPotentialError ? overcharge : 0,
    isPotentialError,
    period,
    accountNo: account.accountNo,
    billAccountNo: bill?.accountNo ?? null,
    accountMismatch,
  };
}

function resultDetail(finding: BillAnalysis["finding"], overcharge: number): string {
  if (finding === "needs reconciliation") {
    return "Needs reconciliation before any dispute. This is not a confirmed billing error.";
  }
  if (finding === "potential billing error") {
    return `Potential billing error of ${formatRand(overcharge)}. The estimated units are above the cited cap. Municipal records have not confirmed it.`;
  }
  return "No potential error in these figures. The check used simulated records and is not a municipal determination.";
}
