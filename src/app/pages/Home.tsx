import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Settings, IndianRupee, Calendar as CalendarIcon, TrendingDown, BellOff, CheckCircle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { useNotifications } from "../components/useNotifications";
import { getDynamicSafeSpend, DAY_NAMES } from "../components/safeSpendEngine";

interface Expense { id: string; description: string; amount: number; date: string; }
interface BudgetData { totalIncome: number; savingGoal: number; totalFixed: number; remainingBudget: number; periodStartDay: number; periodEndDay: number; }

/* shared inline style helpers */
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 20,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
  ...extra,
});

export function Home() {
  const navigate = useNavigate();
  useNotifications();
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });

  const todayKey = new Date().toDateString();
  const [noExpenseDays, setNoExpenseDays] = useState<string[]>(
    () => JSON.parse(localStorage.getItem("noExpenseDays") || "[]")
  );
  const isNoExpenseDay = noExpenseDays.includes(todayKey);

  useEffect(() => {
    const b = localStorage.getItem("budgetData"); if (b) setBudgetData(JSON.parse(b));
    const e = localStorage.getItem("expenses");   if (e) setExpenses(JSON.parse(e));
  }, []);

  const getCurrentPeriod = () => {
    if (!budgetData) return { start: new Date(), end: new Date() };
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth();
    const y = today.getFullYear();
    const s = budgetData.periodStartDay;
    const e = budgetData.periodEndDay;
    if (s <= e) {
      if (d >= s) return { start: new Date(y, m, s), end: new Date(y, m, e, 23, 59, 59, 999) };
      return { start: new Date(y, m - 1, s), end: new Date(y, m - 1, e, 23, 59, 59, 999) };
    } else {
      if (d >= s) return { start: new Date(y, m, s), end: new Date(y, m + 1, e, 23, 59, 59, 999) };
      return { start: new Date(y, m - 1, s), end: new Date(y, m, e, 23, 59, 59, 999) };
    }
  };

  const getTodaysExpenses   = () => expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString());
  const getTotalSpentThisPeriod = () => {
    const { start, end } = getCurrentPeriod();
    return expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; }).reduce((s, e) => s + e.amount, 0);
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    const expense: Expense = { id: Date.now().toString(), description: newExpense.description, amount: parseFloat(newExpense.amount), date: new Date().toISOString() };
    const updated = [...expenses, expense];
    setExpenses(updated);
    localStorage.setItem("expenses", JSON.stringify(updated));
    const updatedNED = noExpenseDays.filter(d => d !== todayKey);
    localStorage.setItem("noExpenseDays", JSON.stringify(updatedNED));
    setNewExpense({ description: "", amount: "" });
    setIsAddDialogOpen(false);
  };

  const handleNoExpenseDay = () => {
    const updated = noExpenseDays.includes(todayKey) ? noExpenseDays.filter(d => d !== todayKey) : [...noExpenseDays, todayKey];
    localStorage.setItem("noExpenseDays", JSON.stringify(updated));
    setNoExpenseDays(updated);
  };

  const totalIncome          = budgetData?.totalIncome || 0;
  const savingGoal           = budgetData?.savingGoal  || 0;
  const fixedCosts           = budgetData?.totalFixed  || 0;
  const availableForSpending = totalIncome - savingGoal - fixedCosts;
  const totalSpent           = getTotalSpentThisPeriod();
  const moneyLeft            = availableForSpending - totalSpent;
  const { start, end }       = getCurrentPeriod();
  const totalDaysInPeriod    = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
  const daysRemaining        = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  const daysPassed           = totalDaysInPeriod - daysRemaining;
  const { safeSpend, todayWeight, hasHistory } = getDynamicSafeSpend(expenses);
  const todayDow             = new Date().getDay();
  const isHeavyDay           = todayWeight > 1 / 7 + 0.05;
  const isLightDay           = todayWeight < 1 / 7 - 0.05;
  const expectedSpending     = daysPassed > 0 ? (availableForSpending / totalDaysInPeriod) * daysPassed : 0;
  const isOnTrack            = totalSpent <= expectedSpending;
  const todaysExpenses       = getTodaysExpenses();
  const todaysTotal          = todaysExpenses.reduce((s, e) => s + e.amount, 0);
  const pct                  = availableForSpending ? (moneyLeft / availableForSpending) * 100 : 100;
  const moneyColor           = pct > 50 ? "#34d399" : pct > 20 ? "#fb923c" : "#f87171";

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, padding: "11px 14px",
    fontSize: 14, color: "#e2e8f0", outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  };

  return (
    <div style={{ minHeight: "100%", position: "relative", zIndex: 1, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 20px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg,#34d399,#059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(52,211,153,0.35)",
          }}>
            <IndianRupee size={18} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>PocketUni</h1>
        </div>
        <button
          onClick={() => navigate("/onboarding")}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 8, cursor: "pointer", color: "rgba(148,163,184,0.6)", display: "flex" }}
        >
          <Settings size={20} />
        </button>
      </div>

      <div style={{ padding: "20px 18px" }}>

        {/* Banners */}
        {isNoExpenseDay && (
          <div style={{ ...glass({ borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.08)" }), display: "flex", alignItems: "center", gap: 12 }}>
            <CheckCircle size={20} color="#34d399" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#34d399" }}>No Expense Day ✓</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(148,163,184,0.6)" }}>You marked today as a no-spend day</p>
            </div>
            <button onClick={handleNoExpenseDay} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "rgba(148,163,184,0.5)" }}>Undo</button>
          </div>
        )}
        {!isNoExpenseDay && todaysExpenses.length === 0 && (
          <div style={{ ...glass({ borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(251,146,60,0.25)", background: "rgba(251,146,60,0.08)" }), display: "flex", alignItems: "center", gap: 12 }}>
            <BellOff size={20} color="#fb923c" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fb923c" }}>No expenses logged today</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(148,163,184,0.6)" }}>Add expenses or mark as a no-spend day</p>
            </div>
          </div>
        )}

        {/* Master Card */}
        <div style={{ ...glass({ borderRadius: 24, padding: "28px 24px", marginBottom: 20 }) }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(148,163,184,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Money Left to Spend</p>
            <h2 style={{ margin: "0 0 12px", fontSize: 52, fontWeight: 700, color: moneyColor, lineHeight: 1 }}>
              ₹{moneyLeft.toLocaleString()}
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "rgba(148,163,184,0.55)", marginBottom: 10 }}>
              <CalendarIcon size={14} />
              <span style={{ fontSize: 13 }}>{daysRemaining} days remaining</span>
            </div>
            {!isOnTrack && moneyLeft > 0 && <p style={{ margin: 0, fontSize: 13, color: "#fb923c" }}>⚠️ Spending faster than planned</p>}
            {isOnTrack  && moneyLeft > 0 && <p style={{ margin: 0, fontSize: 13, color: "#34d399" }}>✓ On track with budget</p>}
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: `linear-gradient(90deg,${moneyColor},#059669)`, borderRadius: 3, transition: "width .5s ease" }} />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 12, color: "rgba(148,163,184,0.55)" }}>Today's Safe Spend</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: todaysTotal > safeSpend ? "#f87171" : "#34d399" }}>
                  ₹{safeSpend}
                </p>
                {todaysTotal > safeSpend ? (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
                    ⚠️ Spent ₹{todaysTotal} · Over by ₹{(todaysTotal - safeSpend).toLocaleString()}
                  </p>
                ) : hasHistory && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(148,163,184,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={11} color="#facc15" />
                    {isHeavyDay ? `${DAY_NAMES[todayDow]}s you spend more — adjusted`
                      : isLightDay ? `${DAY_NAMES[todayDow]}s you spend less — adjusted`
                      : "Based on spending pattern"}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", fontSize: 12, color: "rgba(148,163,184,0.55)" }}>Spent This Period</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#fb923c" }}>₹{totalSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total Income",     val: `₹${totalIncome.toLocaleString()}`,        color: "#e2e8f0" },
                { label: "Saving Goal",      val: `-₹${savingGoal.toLocaleString()}`,         color: "#34d399" },
                { label: "Fixed Costs",      val: `-₹${fixedCosts.toLocaleString()}`,         color: "#fb923c" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "rgba(148,163,184,0.6)" }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: row.color, fontWeight: 500 }}>{row.val}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Available Budget</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>₹{availableForSpending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingDown size={18} color="#fb923c" /> Today's Expenses
            </h3>
            {todaysTotal > 0 && <span style={{ fontSize: 14, color: "#fb923c", fontWeight: 600 }}>-₹{todaysTotal}</span>}
          </div>

          {todaysExpenses.length === 0 && !isNoExpenseDay ? (
            <div style={{ ...glass({ borderRadius: 16, padding: "24px 20px", textAlign: "center" }) }}>
              <p style={{ margin: "0 0 4px", color: "rgba(148,163,184,0.55)", fontSize: 14 }}>No expenses logged today</p>
              <p style={{ margin: "0 0 16px", color: "rgba(148,163,184,0.35)", fontSize: 12 }}>Tap the + button to add one</p>
              <button
                onClick={handleNoExpenseDay}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#34d399" }}
              >
                <CheckCircle size={15} /> Mark as No Expense Day
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todaysExpenses.map(exp => (
                <div key={exp.id} style={{ ...glass({ borderRadius: 14, padding: "14px 16px" }), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "#e2e8f0" }}>{exp.description}</span>
                  <span style={{ fontSize: 14, color: "#fb923c", fontWeight: 600 }}>-₹{exp.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <button style={{
            position: "fixed", bottom: 90, right: 22,
            width: 60, height: 60, borderRadius: "50%",
            background: "linear-gradient(135deg,#34d399,#059669)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px rgba(52,211,153,0.5)",
            transition: "transform .2s",
            zIndex: 20,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Plus size={28} color="#fff" />
          </button>
        </DialogTrigger>
        <DialogContent className="text-white border-white/10" style={{ background: "rgba(30,41,59,0.7)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", borderRadius: 24, boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", display: "block", marginBottom: 8, fontWeight: 500 }}>Description</label>
              <input
                placeholder="e.g., Canteen lunch"
                value={newExpense.description}
                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", display: "block", marginBottom: 8, fontWeight: 500 }}>Amount (₹)</label>
              <div style={{ position: "relative" }}>
                <IndianRupee size={16} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="number" placeholder="0"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                  style={{ ...inputStyle, paddingLeft: 34 }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>
            <button
              onClick={handleAddExpense}
              disabled={!newExpense.description || !newExpense.amount}
              style={{
                padding: "13px", borderRadius: 13, border: "none", fontSize: 15, fontWeight: 600, cursor: newExpense.description && newExpense.amount ? "pointer" : "not-allowed",
                background: newExpense.description && newExpense.amount ? "linear-gradient(135deg,#34d399,#059669)" : "rgba(255,255,255,0.08)",
                color: "#fff", boxShadow: newExpense.description && newExpense.amount ? "0 0 20px rgba(52,211,153,0.3)" : "none",
                transition: "all .2s",
              }}
            >
              Add Expense
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}