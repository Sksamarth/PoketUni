import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, IndianRupee, Calendar as CalendarIcon, Bell, BellOff, LogOut, User } from "lucide-react";
import { requestNotificationPermission, scheduleDailyCheck } from "../components/useNotifications";

interface IncomeSource { id: string; label: string; amount: string; }
interface FixedCost    { id: string; label: string; amount: string; }

/* shared helpers */
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 18,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
  padding: "20px 20px",
  ...extra,
});

const inputS = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "12px 14px",
  fontSize: 14, color: "#e2e8f0",
  outline: "none", transition: "border-color .2s, box-shadow .2s",
  fontFamily: "inherit",
  ...extra,
});

const focusIn  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; };
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";  e.currentTarget.style.boxShadow = "none"; };

const sectionLabel = (icon: React.ReactNode, text: string) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
    {icon}
    <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>{text}</span>
  </div>
);

export function Onboarding() {
  const navigate     = useNavigate();
  const loggedInUser = localStorage.getItem("loggedInUser") || "student";

  const handleLogout = () => { localStorage.removeItem("loggedInUser"); navigate("/login"); };

  const existingBudget = JSON.parse(localStorage.getItem("budgetData") || "null");

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(existingBudget?.incomeSources || [{ id: "1", label: "Monthly Allowance", amount: "" }]);
  const [savingGoal,    setSavingGoal]    = useState(existingBudget?.savingGoal?.toString() || "5000");
  const [fixedCosts,    setFixedCosts]    = useState<FixedCost[]>(existingBudget?.fixedCosts || []);

  const savedNotif   = JSON.parse(localStorage.getItem("notificationSettings") || "null");
  const [notifEnabled, setNotifEnabled] = useState<boolean>(savedNotif?.enabled ?? false);
  const [notifTime,    setNotifTime]    = useState<string>(savedNotif?.time ?? "20:00");
  const [notifDenied,  setNotifDenied]  = useState(typeof Notification !== "undefined" && Notification.permission === "denied");

  const [periodStartDay, setPeriodStartDay] = useState(existingBudget?.periodStartDay?.toString() || "18");
  const [periodEndDay,   setPeriodEndDay]   = useState(existingBudget?.periodEndDay?.toString() || "17");

  /* income helpers */
  const addIncomeSource    = () => setIncomeSources([...incomeSources, { id: Date.now().toString(), label: "", amount: "" }]);
  const removeIncomeSource = (id: string) => setIncomeSources(incomeSources.filter(s => s.id !== id));
  const updateIncomeSource = (id: string, field: "label"|"amount", val: string) =>
    setIncomeSources(incomeSources.map(s => s.id === id ? { ...s, [field]: val } : s));

  /* fixed cost helpers */
  const addFixedCost    = () => setFixedCosts([...fixedCosts, { id: Date.now().toString(), label: "", amount: "" }]);
  const removeFixedCost = (id: string) => setFixedCosts(fixedCosts.filter(c => c.id !== id));
  const updateFixedCost = (id: string, field: "label"|"amount", val: string) =>
    setFixedCosts(fixedCosts.map(c => c.id === id ? { ...c, [field]: val } : c));

  const handleSubmit = () => {
    const totalIncome = incomeSources.reduce((s, src) => s + (parseFloat(src.amount) || 0), 0);
    const totalFixed  = fixedCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    localStorage.setItem("budgetData", JSON.stringify({
      incomeSources, savingGoal: parseFloat(savingGoal) || 0,
      fixedCosts, totalIncome, totalFixed,
      remainingBudget: totalIncome - totalFixed - (parseFloat(savingGoal) || 0),
      periodStartDay: parseInt(periodStartDay),
      periodEndDay:   parseInt(periodEndDay),
    }));
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("notificationSettings", JSON.stringify({ enabled: notifEnabled, time: notifTime }));
    if (notifEnabled) scheduleDailyCheck();
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100%", position: "relative", zIndex: 1, padding: "20px 18px 100px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* User card */}
        <div style={{ ...card({ borderRadius: 16, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={18} color="#34d399" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e2e8f0", textTransform: "capitalize" }}>{loggedInUser}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(148,163,184,0.55)" }}>Logged in</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "7px 12px", cursor: "pointer", fontSize: 13, color: "#f87171", fontWeight: 500 }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 700, color: "#e2e8f0" }}>Set Your Budget</h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(148,163,184,0.6)" }}>Let's get your finances organized. Fill in your monthly details.</p>
        </div>

        {/* ── Billing Period ── */}
        <div style={{ marginBottom: 24 }}>
          {sectionLabel(<CalendarIcon size={18} color="#34d399" />, "Billing Period")}
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(148,163,184,0.5)" }}>Set when your monthly budget period starts and ends</p>
          <div style={card()}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "startDay", label: "Start Day", val: periodStartDay, set: setPeriodStartDay },
                { id: "endDay",   label: "End Day",   val: periodEndDay,   set: setPeriodEndDay   },
              ].map(f => (
                <div key={f.id}>
                  <label htmlFor={f.id} style={{ fontSize: 12, color: "rgba(148,163,184,0.6)", display: "block", marginBottom: 8, fontWeight: 500 }}>{f.label}</label>
                  <input
                    id={f.id} type="number" min={1} max={28}
                    value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ ...inputS(), textAlign: "center", fontSize: 24, fontWeight: 700, padding: "14px" }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </div>
              ))}
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 11, color: "rgba(148,163,184,0.4)", textAlign: "center" }}>
              Example: 18th to 17th = budget runs from the 18th of one month to the 17th of the next
            </p>
          </div>
        </div>

        {/* ── Income Sources ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Income Sources</span>
            <button
              onClick={addIncomeSource}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#34d399", fontWeight: 500 }}
            ><Plus size={14} /> Add Source</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {incomeSources.map(src => (
              <div key={src.id} style={{ ...card({ padding: "16px" }), display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    placeholder="Source name (e.g., Monthly Allowance)"
                    value={src.label}
                    onChange={e => updateIncomeSource(src.id, "label", e.target.value)}
                    style={inputS()}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                  <div style={{ position: "relative" }}>
                    <IndianRupee size={15} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="number" placeholder="Amount"
                      value={src.amount}
                      onChange={e => updateIncomeSource(src.id, "amount", e.target.value)}
                      style={inputS({ paddingLeft: 32 })}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                  </div>
                </div>
                {incomeSources.length > 1 && (
                  <button onClick={() => removeIncomeSource(src.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "6px", marginTop: 4, display: "flex" }}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Saving Goal ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Monthly Saving Goal</span>
          </div>
          <div style={card()}>
            <div style={{ position: "relative" }}>
              <IndianRupee size={16} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="number" placeholder="0"
                value={savingGoal}
                onChange={e => setSavingGoal(e.target.value)}
                style={inputS({ paddingLeft: 34, fontSize: 18, fontWeight: 600 })}
                onFocus={focusIn} onBlur={focusOut}
              />
            </div>
          </div>
        </div>

        {/* ── Fixed Costs ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Fixed Monthly Costs</span>
            <button
              onClick={addFixedCost}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#34d399", fontWeight: 500 }}
            ><Plus size={14} /> Add Cost</button>
          </div>
          {fixedCosts.length === 0 ? (
            <div style={{ ...card(), textAlign: "center", color: "rgba(148,163,184,0.45)", fontSize: 13 }}>
              No fixed costs yet. Add recurring bills like rent, PG fees, or Wi-Fi.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fixedCosts.map(cost => (
                <div key={cost.id} style={{ ...card({ padding: "16px" }), display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      placeholder="Cost name (e.g., PG Rent)"
                      value={cost.label}
                      onChange={e => updateFixedCost(cost.id, "label", e.target.value)}
                      style={inputS()}
                      onFocus={focusIn} onBlur={focusOut}
                    />
                    <div style={{ position: "relative" }}>
                      <IndianRupee size={15} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="number" placeholder="Amount"
                        value={cost.amount}
                        onChange={e => updateFixedCost(cost.id, "amount", e.target.value)}
                        style={inputS({ paddingLeft: 32 })}
                        onFocus={focusIn} onBlur={focusOut}
                      />
                    </div>
                  </div>
                  <button onClick={() => removeFixedCost(cost.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "6px", marginTop: 4, display: "flex" }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Daily Expense Reminder</span>
          </div>
          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: notifEnabled ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {notifEnabled
                  ? <Bell size={20} color="#34d399" />
                  : <BellOff size={20} color="rgba(148,163,184,0.4)" />}
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>Daily Reminder</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(148,163,184,0.5)" }}>Remind me to log expenses</p>
                </div>
              </div>
              {/* Toggle switch */}
              <button
                onClick={async () => {
                  if (!notifEnabled) {
                    const result = await Notification.requestPermission();
                    if (result === "granted") { setNotifEnabled(true); setNotifDenied(false); }
                    else if (result === "denied") setNotifDenied(true);
                  } else {
                    setNotifEnabled(false);
                  }
                }}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                  background: notifEnabled ? "linear-gradient(135deg,#34d399,#059669)" : "rgba(255,255,255,0.1)",
                  position: "relative", transition: "background .3s",
                  boxShadow: notifEnabled ? "0 0 12px rgba(52,211,153,0.35)" : "none",
                }}
              >
                <span style={{
                  position: "absolute", top: 3,
                  left: notifEnabled ? 25 : 3,
                  width: 20, height: 20,
                  borderRadius: "50%", background: "#fff",
                  transition: "left .25s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }} />
              </button>
            </div>

            {notifDenied && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#f87171" }}>
                Notifications blocked. Please enable them in your browser settings for this site.
              </p>
            )}

            {notifEnabled && (
              <div>
                <label style={{ fontSize: 12, color: "rgba(148,163,184,0.6)", display: "block", marginBottom: 8, fontWeight: 500 }}>Reminder Time</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={e => setNotifTime(e.target.value)}
                  style={inputS()}
                  onFocus={focusIn} onBlur={focusOut}
                />
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(148,163,184,0.4)" }}>
                  A follow-up reminder will be sent 2 hours later if still not logged.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "16px",
            background: "linear-gradient(135deg,#34d399,#059669)",
            border: "none", borderRadius: 16,
            fontSize: 16, fontWeight: 700, color: "#fff",
            cursor: "pointer",
            boxShadow: "0 0 28px rgba(52,211,153,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            transition: "all .22s",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 40px rgba(52,211,153,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 28px rgba(52,211,153,0.4)"; e.currentTarget.style.transform = "none"; }}
        >
          Set My Budget
        </button>

      </div>
    </div>
  );
}