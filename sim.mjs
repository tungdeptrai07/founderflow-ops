export function simulateGrowth({ users = 200, monthlyGrowthPct = 18, arpu = 15, months = 6 }) {
  let u = users;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    u = Math.round(u * (1 + monthlyGrowthPct / 100));
    rows.push({ month: m, users: u, mrrUsd: u * arpu });
  }
  return rows;
}
