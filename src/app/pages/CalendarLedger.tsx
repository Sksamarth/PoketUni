import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, IndianRupee } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

interface Expense { id: string; description: string; amount: number; date: string; }
interface BudgetData { remainingBudget: number; periodStartDay: number; periodEndDay: number; totalIncome: number; savingGoal: number; totalFixed: number; }

const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  ...extra,
});

export function CalendarLedger() {
  const [currentDate, setCurrentDate]     = useState(new Date());
  const [expenses, setExpenses]           = useState<Expense[]>([]);
  const [budgetData, setBudgetData]       = useState<BudgetData | null>(null);
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [isSheetOpen, setIsSheetOpen]     = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExpense, setNewExpense]       = useState({ description: "", amount: "" });

  useEffect(() => {
    const e = localStorage.getItem("expenses");   if (e) setExpenses(JSON.parse(e));
    const b = localStorage.getItem("budgetData"); if (b) setBudgetData(JSON.parse(b));
  }, []);

  const getCurrentPeriod = () => {
    if (!budgetData) return { start: new Date(), end: new Date() };
    const refDate = currentDate;
    const currentDay = refDate.getDate();
    const startDay   = budgetData.periodStartDay;
    const endDay     = budgetData.periodEndDay;
    
    let startMonth = refDate.getMonth();
    let startYear = refDate.getFullYear();
    
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
    
    return { 
      start: new Date(startYear, startMonth, startDay), 
      end: new Date(endYear, endMonth, endDay, 23, 59, 59, 999) 
    };
  };

  const getDaysInMonth    = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const getExpensesForDate = (date: Date) =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });

  const getTotalForDate = (date: Date) => getExpensesForDate(date).reduce((s, e) => s + e.amount, 0);

  const getTotalSpent = () => {
    const { start, end } = getCurrentPeriod();
    return expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; }).reduce((s, e) => s + e.amount, 0);
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setIsSheetOpen(true);
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !selectedDate) return;
    const expense: Expense = { id: Date.now().toString(), description: newExpense.description, amount: parseFloat(newExpense.amount), date: selectedDate.toISOString() };
    const updated = [...expenses, expense];
    setExpenses(updated);
    localStorage.setItem("expenses", JSON.stringify(updated));
    setNewExpense({ description: "", amount: "" });
    setIsAddDialogOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem("expenses", JSON.stringify(updated));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay    = getFirstDayOfMonth(currentDate);
  const totalIncome          = budgetData?.totalIncome || 0;
  const savingGoal           = budgetData?.savingGoal  || 0;
  const fixedCosts           = budgetData?.totalFixed  || 0;
  const availableForSpending = totalIncome - savingGoal - fixedCosts;
  const totalSpent           = getTotalSpent();
  const moneyLeft            = availableForSpending - totalSpent;
  const { start: periodStart, end: periodEnd } = getCurrentPeriod();
  const totalDaysInPeriod    = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1;
  const avgDailyBudget       = availableForSpending / totalDaysInPeriod;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const selectedDateExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];
  const selectedDateTotal    = selectedDate ? getTotalForDate(selectedDate) : 0;
  const isInCurrentPeriod    = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return d >= periodStart && d <= periodEnd;
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, padding: "11px 14px", fontSize: 14, color: "#e2e8f0",
    outline: "none", transition: "border-color .2s, box-shadow .2s",
  };
  const focusIn  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div style={{ minHeight: "100%", position: "relative", zIndex: 1, paddingBottom: 90 }}>

      {/* Sticky Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        ...glass({ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none" }),
        padding: "16px 20px 12px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Calendar Ledger</h2>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(148,163,184,0.55)" }}>
              Period: {periodStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(148,163,184,0.55)" }}>Remaining</p>
            <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700, color: moneyLeft > 0 ? "#34d399" : "#f87171" }}>
              ₹{moneyLeft.toLocaleString()}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(148,163,184,0.4)" }}>of ₹{availableForSpending.toLocaleString()}</p>
          </div>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#94a3b8", display: "flex" }}
          ><ChevronLeft size={20} /></button>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#94a3b8", display: "flex" }}
          ><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ padding: "16px 14px" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, color: "rgba(148,163,184,0.45)", padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day   = idx + 1;
            const date  = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const total = getTotalForDate(date);
            const hasExp = total > 0;
            const isToday = date.toDateString() === new Date().toDateString();
            const underBudget = total <= avgDailyBudget;
            const inPeriod = isInCurrentPeriod(day);

            let bg     = "rgba(255,255,255,0.04)";
            let border = "rgba(255,255,255,0.08)";
            if (isToday)            { bg = "rgba(52,211,153,0.12)";  border = "rgba(52,211,153,0.45)"; }
            else if (hasExp && underBudget) { bg = "rgba(52,211,153,0.07)"; border = "rgba(52,211,153,0.22)"; }
            else if (hasExp)        { bg = "rgba(251,146,60,0.07)";  border = "rgba(251,146,60,0.22)"; }

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                  aspectRatio: "1", borderRadius: 12,
                  background: bg, border: `1px solid ${border}`,
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  cursor: "pointer", position: "relative",
                  opacity: inPeriod ? 1 : 0.35,
                  transition: "all .18s",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? "#34d399" : "#e2e8f0" }}>{day}</span>
                {hasExp && <span style={{ fontSize: 9, color: "#fb923c", lineHeight: 1 }}>-₹{total}</span>}
                {inPeriod && <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="text-white rounded-t-[32px] h-[75vh]" style={{ background: "rgba(13,27,46,0.85)", borderTop: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 -8px 40px rgba(0,0,0,0.4)" }}>
          <SheetHeader>
            <SheetTitle className="text-white">
              {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </SheetTitle>
          </SheetHeader>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "rgba(148,163,184,0.65)" }}>Total Spent</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fb923c" }}>₹{selectedDateTotal.toLocaleString()}</span>
            </div>
            <div style={{ maxHeight: "35vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedDateExpenses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(148,163,184,0.45)", fontSize: 14 }}>No expenses for this day</div>
              ) : selectedDateExpenses.map(exp => (
                <div key={exp.id} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0" }}>{exp.description}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#fb923c" }}>₹{exp.amount}</p>
                  </div>
                  <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 6, display: "flex" }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              style={{ padding: "13px", borderRadius: 13, border: "none", fontSize: 15, fontWeight: 600, color: "#fff", cursor: "pointer", background: "linear-gradient(135deg,#34d399,#059669)", boxShadow: "0 0 20px rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Plus size={18} /> Add Expense
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="text-white border-white/10" style={{ background: "rgba(30,41,59,0.7)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", borderRadius: 24, boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", display: "block", marginBottom: 8, fontWeight: 500 }}>Description</label>
              <input placeholder="e.g., Canteen lunch" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(148,163,184,0.8)", display: "block", marginBottom: 8, fontWeight: 500 }}>Amount (₹)</label>
              <div style={{ position: "relative" }}>
                <IndianRupee size={16} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input type="number" placeholder="0" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} style={{ ...inputStyle, paddingLeft: 34 }} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
            <button
              onClick={handleAddExpense}
              disabled={!newExpense.description || !newExpense.amount}
              style={{ padding: "13px", borderRadius: 13, border: "none", fontSize: 15, fontWeight: 600, color: "#fff", cursor: newExpense.description && newExpense.amount ? "pointer" : "not-allowed", background: newExpense.description && newExpense.amount ? "linear-gradient(135deg,#34d399,#059669)" : "rgba(255,255,255,0.08)", boxShadow: newExpense.description && newExpense.amount ? "0 0 20px rgba(52,211,153,0.3)" : "none", transition: "all .2s" }}
            >Add Expense</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}