import test from "node:test";
import assert from "node:assert/strict";
import {
  STARTUP_PRESETS,
  simulateGrowth,
  runScenarioMatrix,
  runMonteCarlo,
  buildInvestorMemo
} from "./sim.mjs";

test("simulateGrowth produces accurate horizon length and positive unit economics", () => {
  const res = simulateGrowth(STARTUP_PRESETS.b2b_saas);
  assert.equal(res.months.length, 18);
  assert.ok(res.summary.endingArr > res.summary.startingArr, "ARR should grow on positive net growth");
  assert.ok(res.summary.ltvCacRatio > 3, "B2B SaaS preset should have healthy LTV:CAC");
  assert.ok(res.summary.annualNdrPct > 100, "Expansion > churn should produce >100% NDR");
  assert.ok(res.summary.readinessScore >= 50 && res.summary.readinessScore <= 99);
});

test("simulateGrowth detects cash-out month under extreme burn", () => {
  const res = simulateGrowth({
    startingMrr: 5000,
    monthlyGrowthPct: 2,
    monthlyLogoChurnPct: 8,
    expansionPct: 0,
    grossMarginPct: 70,
    startingCash: 100000,
    monthlyFixedBurn: 50000,
    horizonMonths: 12
  });
  assert.ok(res.summary.cashOutMonth !== null && res.summary.cashOutMonth <= 4);
  assert.equal(res.summary.readinessGrade, "High Runway Risk");
});

test("runScenarioMatrix preserves monotonic Bear < Base < Bull ARR", () => {
  const m = runScenarioMatrix(STARTUP_PRESETS.ai_infra);
  assert.ok(m.bear.summary.endingArr < m.base.summary.endingArr);
  assert.ok(m.base.summary.endingArr < m.bull.summary.endingArr);
});

test("runMonteCarlo is deterministic with seed and ordered P10 <= P50 <= P90", () => {
  const mc1 = runMonteCarlo(STARTUP_PRESETS.plg_devtool, 500, 12345);
  const mc2 = runMonteCarlo(STARTUP_PRESETS.plg_devtool, 500, 12345);
  assert.deepEqual(mc1, mc2);
  assert.ok(mc1.arrP10 <= mc1.arrP50 && mc1.arrP50 <= mc1.arrP90);
  assert.ok(mc1.survivalRatePct >= 0 && mc1.survivalRatePct <= 100);
});

test("buildInvestorMemo formats key metrics and scenario table", () => {
  const base = simulateGrowth(STARTUP_PRESETS.b2b_saas);
  const scenarios = runScenarioMatrix(STARTUP_PRESETS.b2b_saas);
  const mc = runMonteCarlo(STARTUP_PRESETS.b2b_saas, 200);
  const memo = buildInvestorMemo(base, scenarios, mc);
  assert.match(memo, /Venture Operating Plan/);
  assert.match(memo, /Monte Carlo Stress Test/);
  assert.match(memo, /LTV:CAC/);
});
