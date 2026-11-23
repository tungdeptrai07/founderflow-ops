# FounderFlow Ops — Venture-Grade SaaS Financial & Monte Carlo Cockpit

> Built for **Silicon Valley Buildathon 2026** | Live Interactive App: **[tungdeptrai07.github.io/founderflow-ops](https://tungdeptrai07.github.io/founderflow-ops/)**

**FounderFlow Ops** is a zero-dependency financial operating system for seed and Series A founders to stress-test runway, cohort unit economics, and investor readiness directly in the browser—with full data privacy and instant reproducible exports.

## Key Capabilities
- **Multi-Horizon SaaS Operating Engine (`sim.mjs`):** Models monthly new MRR, expansion MRR, logo churn, gross margin, S&M scaling, and variable operating costs across 3–36 months.
- **Venture Unit Economics Suite:** Real-time **LTV:CAC**, **CAC Payback (months)**, **Annualized Net Dollar Retention (NDR)**, **Rule of 40**, **Burn Multiple**, and **Investor Readiness Score (0–100)**.
- **Bear / Base / Bull Sensitivity Matrix:** Side-by-side comparison of downside, base, and upside growth/churn regimes with interactive dual SVG charts.
- **1,000-Trial Reproducible Monte Carlo Simulator:** Uses seeded Mulberry32 + Box-Muller Gaussian sampling to compute **Zero Cash-Out Survival Probability**, **Profitability Probability**, and **P10 / P50 / P90 ARR distributions**.
- **One-Click Investor Exports:** Export a formatted **Investor Operating Memo (`.md`)** and full monthly **Operating Ledger (`.csv`)**.

## Quick Verification (Automated Unit Tests)
```bash
node --test sim.test.mjs
```

## Architecture
- `sim.mjs` — Pure ES module financial, scenario, Monte Carlo, and Markdown memo engine.
- `index.html` — Responsive single-page cockpit with interactive SVG visualizations and 3 startup presets (`B2B SaaS`, `AI Infra`, `PLG DevTool`).
- `sim.test.mjs` — Node.js built-in test runner covering unit economics, cash-out detection, scenario monotonicity, deterministic Monte Carlo, and memo generation.
