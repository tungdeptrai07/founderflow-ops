/**
 * FounderFlow Ops — Venture-Grade SaaS Financial, Cohort & Monte Carlo Engine
 * Zero-dependency ES Module powering deterministic 24-month projections,
 * unit economics (LTV:CAC, Payback, Rule of 40, Magic Number, Burn Multiple),
 * scenario comparison (Bear / Base / Bull), and 1,000-trial Monte Carlo runway stress-testing.
 */

export const STARTUP_PRESETS = {
  b2b_saas: {
    name: "B2B Workflow SaaS (Seed)",
    startingMrr: 28000,
    monthlyGrowthPct: 14,
    monthlyLogoChurnPct: 3.2,
    expansionPct: 4.5,
    grossMarginPct: 82,
    startingCash: 750000,
    monthlyFixedBurn: 62000,
    salesMarketingPct: 32,
    cac: 1850,
    arpa: 420,
    horizonMonths: 18
  },
  ai_infra: {
    name: "AI Developer Infra (Pre-Seed)",
    startingMrr: 12000,
    monthlyGrowthPct: 22,
    monthlyLogoChurnPct: 4.8,
    expansionPct: 7.5,
    grossMarginPct: 68,
    startingCash: 480000,
    monthlyFixedBurn: 54000,
    salesMarketingPct: 24,
    cac: 980,
    arpa: 290,
    horizonMonths: 18
  },
  plg_devtool: {
    name: "PLG Self-Serve DevTool",
    startingMrr: 45000,
    monthlyGrowthPct: 11,
    monthlyLogoChurnPct: 2.4,
    expansionPct: 3.8,
    grossMarginPct: 87,
    startingCash: 1100000,
    monthlyFixedBurn: 78000,
    salesMarketingPct: 28,
    cac: 620,
    arpa: 165,
    horizonMonths: 18
  }
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

/**
 * Deterministic PRNG (Mulberry32) so Monte Carlo stress tests are 100% reproducible.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  const u1 = Math.max(1e-9, rand());
  const u2 = rand();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Core SaaS Trajectory & Unit Economics Engine
 */
export function simulateGrowth(input) {
  const cfg = {
    startingMrr: Math.max(0, Number(input.startingMrr ?? 25000)),
    monthlyGrowthPct: clamp(Number(input.monthlyGrowthPct ?? 14), -30, 80),
    monthlyLogoChurnPct: clamp(Number(input.monthlyLogoChurnPct ?? 3.2), 0, 50),
    expansionPct: clamp(Number(input.expansionPct ?? 4.5), 0, 40),
    grossMarginPct: clamp(Number(input.grossMarginPct ?? 80), 10, 98),
    startingCash: Math.max(0, Number(input.startingCash ?? 750000)),
    monthlyFixedBurn: Math.max(0, Number(input.monthlyFixedBurn ?? 60000)),
    salesMarketingPct: clamp(Number(input.salesMarketingPct ?? 30), 0, 120),
    cac: Math.max(1, Number(input.cac ?? 1500)),
    arpa: Math.max(1, Number(input.arpa ?? 350)),
    horizonMonths: clamp(Math.round(Number(input.horizonMonths ?? 18)), 3, 36)
  };

  let mrr = cfg.startingMrr;
  let cash = cfg.startingCash;
  let cashOutMonth = null;
  let profitabilityMonth = null;
  let peakCashNeed = 0;

  const months = [];
  const gRate = cfg.monthlyGrowthPct / 100;
  const cRate = cfg.monthlyLogoChurnPct / 100;
  const eRate = cfg.expansionPct / 100;
  const gmRate = cfg.grossMarginPct / 100;
  const smRate = cfg.salesMarketingPct / 100;

  for (let m = 1; m <= cfg.horizonMonths; m++) {
    const startMrr = mrr;
    const newMrr = startMrr * gRate;
    const expansionMrr = startMrr * eRate;
    const churnedMrr = startMrr * cRate;
    const endMrr = Math.max(0, startMrr + newMrr + expansionMrr - churnedMrr);

    const grossProfit = endMrr * gmRate;
    const salesMarketingSpend = Math.max(cfg.monthlyFixedBurn * 0.15, endMrr * smRate);
    // Operating expenses scale moderately with headcount/infra as ARR grows
    const variableOps = endMrr * 0.08;
    const totalBurn = cfg.monthlyFixedBurn + salesMarketingSpend + variableOps;
    const netCashFlow = grossProfit - totalBurn;

    cash += netCashFlow;
    if (cash <= 0 && cashOutMonth === null) {
      cashOutMonth = m;
    }
    if (netCashFlow >= 0 && profitabilityMonth === null) {
      profitabilityMonth = m;
    }
    peakCashNeed = Math.max(peakCashNeed, cfg.startingCash - cash);

    months.push({
      month: m,
      startMrr: round2(startMrr),
      newMrr: round2(newMrr),
      expansionMrr: round2(expansionMrr),
      churnedMrr: round2(churnedMrr),
      endMrr: round2(endMrr),
      arr: round2(endMrr * 12),
      grossProfit: round2(grossProfit),
      totalBurn: round2(totalBurn),
      netCashFlow: round2(netCashFlow),
      endingCash: round2(cash)
    });

    mrr = endMrr;
  }

  const last = months[months.length - 1];
  const first = months[0];

  // SaaS Venture Metrics
  const annualNdrPct = round2(Math.pow(1 + eRate - cRate, 12) * 100);
  const effectiveMonthlyChurn = Math.max(0.005, cRate);
  const ltv = round2((cfg.arpa * gmRate) / effectiveMonthlyChurn);
  const ltvCacRatio = round2(ltv / cfg.cac);
  const cacPaybackMonths = round2(cfg.cac / Math.max(1, cfg.arpa * gmRate));

  const annualizedGrowthPct = round2(
    cfg.startingMrr > 0
      ? (Math.pow(last.endMrr / cfg.startingMrr, 12 / cfg.horizonMonths) - 1) * 100
      : 0
  );
  const ebitdaMarginPct = round2(last.endMrr > 0 ? (last.netCashFlow / last.endMrr) * 100 : -100);
  const ruleOf40 = round2(annualizedGrowthPct + ebitdaMarginPct);

  const netNewArrLastMonth = (last.endMrr - last.startMrr) * 12;
  const lastNetBurn = Math.max(0, -last.netCashFlow);
  const burnMultiple = lastNetBurn === 0
    ? 0
    : netNewArrLastMonth > 0
      ? round2(lastNetBurn / (netNewArrLastMonth / 12))
      : 99.9;

  const avgNetBurn = months.reduce((s, r) => s + Math.max(0, -r.netCashFlow), 0) / months.length;
  const runwayMonths = cashOutMonth !== null
    ? cashOutMonth
    : last.netCashFlow >= 0
      ? 999
      : round2(cfg.horizonMonths + Math.max(0, last.endingCash) / Math.max(1, avgNetBurn));

  // Investor Readiness Grade
  let score = 50;
  if (ltvCacRatio >= 3) score += 15;
  else if (ltvCacRatio >= 2) score += 7;
  if (cacPaybackMonths <= 12) score += 10;
  else if (cacPaybackMonths <= 18) score += 5;
  if (annualNdrPct >= 110) score += 12;
  else if (annualNdrPct >= 100) score += 6;
  if (ruleOf40 >= 40) score += 13;
  else if (ruleOf40 >= 20) score += 6;
  if (cashOutMonth !== null && cashOutMonth < 12) score -= 22;
  if (burnMultiple > 3 && burnMultiple < 99) score -= 10;
  score = clamp(Math.round(score), 10, 99);

  const grade = score >= 85 ? "Series A Ready" : score >= 70 ? "Strong Seed" : score >= 52 ? "Needs Optimization" : "High Runway Risk";

  return {
    config: cfg,
    months,
    summary: {
      startingArr: round2(cfg.startingMrr * 12),
      endingMrr: last.endMrr,
      endingArr: last.arr,
      endingCash: last.endingCash,
      cashOutMonth,
      profitabilityMonth,
      runwayMonths,
      peakCashNeed: round2(peakCashNeed),
      annualNdrPct,
      ltv,
      ltvCacRatio,
      cacPaybackMonths,
      ruleOf40,
      burnMultiple,
      annualizedGrowthPct,
      ebitdaMarginPct,
      readinessScore: score,
      readinessGrade: grade,
      netMrrAddedMonth1: round2(first.endMrr - first.startMrr)
    }
  };
}

/**
 * Generates Bear / Base / Bull sensitivity matrix around a base plan.
 */
export function runScenarioMatrix(baseInput) {
  const bear = simulateGrowth({
    ...baseInput,
    monthlyGrowthPct: Number(baseInput.monthlyGrowthPct) * 0.65,
    monthlyLogoChurnPct: Number(baseInput.monthlyLogoChurnPct) * 1.35,
    expansionPct: Number(baseInput.expansionPct) * 0.7
  });
  const base = simulateGrowth(baseInput);
  const bull = simulateGrowth({
    ...baseInput,
    monthlyGrowthPct: Number(baseInput.monthlyGrowthPct) * 1.3,
    monthlyLogoChurnPct: Math.max(0.5, Number(baseInput.monthlyLogoChurnPct) * 0.75),
    expansionPct: Number(baseInput.expansionPct) * 1.25
  });
  return { bear, base, bull };
}

/**
 * Reproducible Monte Carlo Stress Test (default 1,000 trials)
 * Perturbs monthly growth & churn stochastically to estimate survival probability & P10/P50/P90 ARR/Cash.
 */
export function runMonteCarlo(baseInput, trials = 1000, seed = 20261123) {
  const rand = mulberry32(seed);
  const endingArrs = [];
  const endingCashes = [];
  let survivedCount = 0;
  let profitableCount = 0;

  const baseG = Number(baseInput.monthlyGrowthPct ?? 14);
  const baseC = Number(baseInput.monthlyLogoChurnPct ?? 3.2);
  const baseE = Number(baseInput.expansionPct ?? 4.5);

  for (let t = 0; t < trials; t++) {
    const gNoise = gaussian(rand) * Math.max(2.0, baseG * 0.25);
    const cNoise = gaussian(rand) * Math.max(0.6, baseC * 0.25);
    const eNoise = gaussian(rand) * Math.max(0.5, baseE * 0.2);

    const res = simulateGrowth({
      ...baseInput,
      monthlyGrowthPct: clamp(baseG + gNoise, -10, 60),
      monthlyLogoChurnPct: clamp(baseC + cNoise, 0.2, 25),
      expansionPct: clamp(baseE + eNoise, 0, 25)
    });

    endingArrs.push(res.summary.endingArr);
    endingCashes.push(res.summary.endingCash);
    if (res.summary.cashOutMonth === null) survivedCount++;
    if (res.summary.profitabilityMonth !== null) profitableCount++;
  }

  endingArrs.sort((a, b) => a - b);
  endingCashes.sort((a, b) => a - b);
  const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];

  return {
    trials,
    survivalRatePct: round2((survivedCount / trials) * 100),
    profitabilityRatePct: round2((profitableCount / trials) * 100),
    arrP10: round2(pct(endingArrs, 0.1)),
    arrP50: round2(pct(endingArrs, 0.5)),
    arrP90: round2(pct(endingArrs, 0.9)),
    cashP10: round2(pct(endingCashes, 0.1)),
    cashP50: round2(pct(endingCashes, 0.5)),
    cashP90: round2(pct(endingCashes, 0.9))
  };
}

/**
 * Generates an investor-ready Markdown memo summarizing the model & stress test.
 */
export function buildInvestorMemo(baseResult, scenarios, mc) {
  const s = baseResult.summary;
  const c = baseResult.config;
  const fmt = (n) => "$" + Math.round(n).toLocaleString("en-US");
  return [
    `# FounderFlow Ops — Venture Operating Plan & Stress Test`,
    ``,
    `## Executive Summary (${c.horizonMonths}-Month Horizon)`,
    `- **Readiness Score:** ${s.readinessScore}/100 (${s.readinessGrade})`,
    `- **Starting ARR -> Ending ARR:** ${fmt(s.startingArr)} -> **${fmt(s.endingArr)}**`,
    `- **Ending Cash / Runway:** ${fmt(s.endingCash)} (${s.cashOutMonth ? `Cash-out Month ${s.cashOutMonth}` : s.profitabilityMonth ? `Default Alive (Profitable Month ${s.profitabilityMonth})` : `${s.runwayMonths} months`})`,
    `- **Unit Economics:** LTV:CAC **${s.ltvCacRatio}x** | CAC Payback **${s.cacPaybackMonths} mo** | Annual NDR **${s.annualNdrPct}%**`,
    `- **Efficiency:** Rule of 40 **${s.ruleOf40}** | Burn Multiple **${s.burnMultiple}x**`,
    ``,
    `## Scenario Sensitivity`,
    `| Scenario | Ending ARR | Ending Cash | Readiness |`,
    `|---|---:|---:|---|`,
    `| Bear | ${fmt(scenarios.bear.summary.endingArr)} | ${fmt(scenarios.bear.summary.endingCash)} | ${scenarios.bear.summary.readinessScore}/100 |`,
    `| Base | ${fmt(scenarios.base.summary.endingArr)} | ${fmt(scenarios.base.summary.endingCash)} | ${scenarios.base.summary.readinessScore}/100 |`,
    `| Bull | ${fmt(scenarios.bull.summary.endingArr)} | ${fmt(scenarios.bull.summary.endingCash)} | ${scenarios.bull.summary.readinessScore}/100 |`,
    ``,
    `## Monte Carlo Stress Test (${mc.trials.toLocaleString()} Trials)`,
    `- **Survival Probability (Zero Cash-Out):** **${mc.survivalRatePct}%**`,
    `- **Probability of Reaching Cash-Flow Positive:** **${mc.profitabilityRatePct}%**`,
    `- **Ending ARR Distribution:** P10 ${fmt(mc.arrP10)} | Median (P50) ${fmt(mc.arrP50)} | P90 ${fmt(mc.arrP90)}`
  ].join("\n");
}
