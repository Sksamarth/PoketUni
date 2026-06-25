export interface SpendProfile {
  weights: number[];
  avgByDay: number[];
  hasHistory: boolean;
}

const DAYS = 7;
const DEFAULT_WEIGHTS = Array(DAYS).fill(1 / DAYS);
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildSpendProfile(expenses: { amount: number; date: string }[]): SpendProfile {
  const totals = Array(DAYS).fill(0);
  const counts = Array(DAYS).fill(0);

  for (const e of expenses) {
    const d = new Date(e.date).getDay();
    totals[d] += e.amount;
    counts[d]++;
  }

  const avgByDay = totals.map((t, i) => (counts[i] > 0 ? t / counts[i] : 0));
  const totalAvg = avgByDay.reduce((s, v) => s + v, 0);

  if (totalAvg === 0) return { weights: DEFAULT_WEIGHTS, avgByDay, hasHistory: false };

  const weights = avgByDay.map(v => v / totalAvg);
  return { weights, avgByDay, hasHistory: true };
}

function getPeriod(budget: any): { periodStart: Date; periodEnd: Date } {
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth();
  const y = today.getFullYear();
  const s = budget.periodStartDay as number;
  const e = budget.periodEndDay as number;

  let periodStart: Date;
  let periodEnd: Date;

  if (s <= e) {
    // same-month period e.g. 1→28
    if (d >= s) {
      periodStart = new Date(y, m, s);
      periodEnd   = new Date(y, m, e, 23, 59, 59, 999);
    } else {
      periodStart = new Date(y, m - 1, s);
      periodEnd   = new Date(y, m - 1, e, 23, 59, 59, 999);
    }
  } else {
    // cross-month period e.g. 18→17
    if (d >= s) {
      periodStart = new Date(y, m, s);
      periodEnd   = new Date(y, m + 1, e, 23, 59, 59, 999);
    } else {
      periodStart = new Date(y, m - 1, s);
      periodEnd   = new Date(y, m, e, 23, 59, 59, 999);
    }
  }

  return { periodStart, periodEnd };
}

export function getDynamicSafeSpend(): {
  safeSpend: number;
  todayWeight: number;
  hasHistory: boolean;
  profile: SpendProfile;
} {
  const empty = { safeSpend: 0, todayWeight: 1 / 7, hasHistory: false, profile: { weights: DEFAULT_WEIGHTS, avgByDay: Array(DAYS).fill(0), hasHistory: false } };

  try {
    const budget = JSON.parse(localStorage.getItem("budgetData") || "null");
    if (!budget) return empty;

    const expenses: { amount: number; date: string }[] =
      JSON.parse(localStorage.getItem("expenses") || "[]");

    const available = (budget.totalIncome || 0) - (budget.savingGoal || 0) - (budget.totalFixed || 0);
    const { periodStart, periodEnd } = getPeriod(budget);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // All spending this period including today
    const totalSpentThisPeriod = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= periodStart && d <= periodEnd;
      })
      .reduce((s, e) => s + e.amount, 0);

    // Money remaining after ALL spending so far
    const moneyLeft = available - totalSpentThisPeriod;

    // Remaining days = today + future days until period end
    const remainingDays: Date[] = [];
    const cursor = new Date(today);
    while (cursor <= periodEnd) {
      remainingDays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    if (remainingDays.length === 0) return { ...empty, safeSpend: 0 };

    // Build profile from history
    const profile = buildSpendProfile(expenses);

    const todayDow = today.getDay();
    const dows = remainingDays.map(d => d.getDay());
    const totalWeight = dows.reduce((s, dow) => s + profile.weights[dow], 0);

    const todayWeight = totalWeight > 0
      ? profile.weights[todayDow] / totalWeight
      : 1 / remainingDays.length;

    // Today's allocation from remaining money
    const safeSpend = Math.max(0, Math.floor(moneyLeft * todayWeight));

    return { safeSpend, todayWeight, hasHistory: profile.hasHistory, profile };
  } catch {
    return empty;
  }
}
