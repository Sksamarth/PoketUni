// Dynamic Safe Spend Engine
// Learns from user's historical spending patterns per day of week
// and allocates remaining budget proportionally instead of equally

export interface SpendProfile {
  weights: number[];        // 7 values (Sun=0..Sat=6), sum = 1.0
  avgByDay: number[];       // average spend per day of week
  hasHistory: boolean;
}

const DAYS = 7;
const DEFAULT_WEIGHTS = Array(DAYS).fill(1 / DAYS); // equal by default

// Build a spend profile from expense history
export function buildSpendProfile(expenses: { amount: number; date: string }[]): SpendProfile {
  const totals = Array(DAYS).fill(0);   // total spent per day-of-week
  const counts = Array(DAYS).fill(0);   // how many times each day appears

  for (const e of expenses) {
    const d = new Date(e.date).getDay(); // 0=Sun, 6=Sat
    totals[d] += e.amount;
    counts[d]++;
  }

  const avgByDay = totals.map((t, i) => (counts[i] > 0 ? t / counts[i] : 0));
  const totalAvg = avgByDay.reduce((s, v) => s + v, 0);

  if (totalAvg === 0) {
    return { weights: DEFAULT_WEIGHTS, avgByDay, hasHistory: false };
  }

  // Normalize to weights that sum to 1
  const weights = avgByDay.map(v => v / totalAvg);

  return { weights, avgByDay, hasHistory: true };
}

// Calculate today's dynamic safe spend
export function getDynamicSafeSpend(): {
  safeSpend: number;
  todayWeight: number;
  hasHistory: boolean;
  profile: SpendProfile;
} {
  try {
    const budget = JSON.parse(localStorage.getItem("budgetData") || "null");
    const expenses: { amount: number; date: string }[] =
      JSON.parse(localStorage.getItem("expenses") || "[]");

    if (!budget) return { safeSpend: 0, todayWeight: 1 / 7, hasHistory: false, profile: { weights: DEFAULT_WEIGHTS, avgByDay: Array(DAYS).fill(0), hasHistory: false } };

    const available = budget.totalIncome - (budget.savingGoal || 0) - (budget.totalFixed || 0);

    // Get current period
    const today = new Date();
    const currentDay = today.getDate();
    const startDay = budget.periodStartDay;
    const endDay = budget.periodEndDay;

    let startMonth = today.getMonth();
    let startYear = today.getFullYear();
    
    if (currentDay < startDay) {
      startMonth -= 1;
      if (startMonth < 0) { startMonth = 11; startYear -= 1; }
    }
    
    let endMonth = startMonth;
    let endYear = startYear;
    
    if (endDay <= startDay || (endDay - startDay < 20)) {
      endMonth += 1;
      if (endMonth > 11) { endMonth = 0; endYear += 1; }
    }
    
    const periodStart = new Date(startYear, startMonth, startDay);
    const periodEnd = new Date(endYear, endMonth, endDay, 23, 59, 59, 999);

    // Total spent this period (excluding today)
    const todayStr = today.toDateString();
    const periodExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= periodStart && d <= periodEnd;
    });
    const spentExcludingToday = periodExpenses
      .filter(e => new Date(e.date).toDateString() !== todayStr)
      .reduce((s, e) => s + e.amount, 0);
    const spentToday = periodExpenses
      .filter(e => new Date(e.date).toDateString() === todayStr)
      .reduce((s, e) => s + e.amount, 0);

    const moneyLeft = available - spentExcludingToday;

    // Build remaining days list from tomorrow to period end
    const remainingDays: Date[] = [];
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1); // start from tomorrow
    while (cursor <= periodEnd) {
      remainingDays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    // Build spend profile from ALL historical expenses
    const profile = buildSpendProfile(expenses);

    // Sum of weights for remaining days + today
    const todayDow = today.getDay();
    const remainingDows = remainingDays.map(d => d.getDay());
    const allDows = [todayDow, ...remainingDows];

    const totalWeight = allDows.reduce((s, dow) => s + profile.weights[dow], 0);

    // Today's share of remaining budget
    const todayWeight = totalWeight > 0 ? profile.weights[todayDow] / totalWeight : 1 / (allDows.length || 1);
    const todayBudget = moneyLeft * todayWeight;

    // Safe spend = today's budget allocation minus what's already spent today
    const safeSpend = Math.max(0, Math.floor(todayBudget - spentToday));

    return { safeSpend, todayWeight, hasHistory: profile.hasHistory, profile };
  } catch {
    return { safeSpend: 0, todayWeight: 1 / 7, hasHistory: false, profile: { weights: DEFAULT_WEIGHTS, avgByDay: Array(DAYS).fill(0), hasHistory: false } };
  }
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
