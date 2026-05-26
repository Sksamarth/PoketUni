import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { getDynamicSafeSpend, DAY_NAMES } from "../components/safeSpendEngine";

// Free API from https://build.nvidia.com — no billing required, just sign up
const NVIDIA_API_KEY = "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";
const NVIDIA_URL = "/api/nvidia/chat/completions"; // Proxied via Vite → integrate.api.nvidia.com (avoids CORS)
const MODEL = "meta/llama-3.3-70b-instruct";

interface Message {
  role: "user" | "assistant";
  text: string;
}

function getBudgetContext(): string {
  try {
    const budget = JSON.parse(localStorage.getItem("budgetData") || "null");
    const expenses: { amount: number; date: string; description: string }[] =
      JSON.parse(localStorage.getItem("expenses") || "[]");
    const noExpenseDays: string[] = JSON.parse(localStorage.getItem("noExpenseDays") || "[]");
    const { safeSpend, hasHistory, profile } = getDynamicSafeSpend();

    if (!budget) return "No budget data set yet by the user.";

    const available = budget.totalIncome - (budget.savingGoal || 0) - (budget.totalFixed || 0);
    const today = new Date();
    const currentDay = today.getDate();
    const startDay = budget.periodStartDay;
    const endDay = budget.periodEndDay;

    let periodStart: Date, periodEnd: Date;
    if (startDay <= endDay) {
      periodStart = new Date(today.getFullYear(), today.getMonth(), startDay);
      periodEnd = new Date(today.getFullYear(), today.getMonth(), endDay);
    } else {
      if (currentDay >= startDay) {
        periodStart = new Date(today.getFullYear(), today.getMonth(), startDay);
        periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, endDay);
      } else {
        periodStart = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
        periodEnd = new Date(today.getFullYear(), today.getMonth(), endDay);
      }
    }

    const periodExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= periodStart && d <= periodEnd;
    });
    const totalSpent = periodExpenses.reduce((s, e) => s + e.amount, 0);
    const moneyLeft = available - totalSpent;
    const daysRemaining = Math.max(1, Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const last7 = expenses
      .filter(e => (today.getTime() - new Date(e.date).getTime()) / 86400000 <= 7)
      .map(e => `${new Date(e.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}: ₹${e.amount} (${e.description})`)
      .join(" | ") || "None";

    const allExpenses = periodExpenses
      .map(e => `${new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ₹${e.amount} (${e.description})`)
      .join(" | ") || "None";

    const pattern = hasHistory
      ? DAY_NAMES.map((d, i) => `${d}=₹${Math.round(profile.avgByDay[i])}`).join(", ")
      : "Not enough history";

    const incomeSources = budget.incomeSources
      ?.map((s: any) => `${s.label}: ₹${s.amount}`).join(", ") || "Not set";

    const fixedCosts = budget.fixedCosts
      ?.map((c: any) => `${c.label}: ₹${c.amount}`).join(", ") || "None";

    return `=== POCKETUNI BUDGET DATA ===
User: ${localStorage.getItem("loggedInUser") || "student"}
Today: ${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

INCOME:
- Sources: ${incomeSources}
- Total Monthly Income: ₹${budget.totalIncome}

GOALS & FIXED:
- Monthly Saving Goal: ₹${budget.savingGoal}
- Fixed Costs: ${fixedCosts}
- Total Fixed: ₹${budget.totalFixed}

BUDGET PERIOD (${startDay}th to ${endDay}th):
- Available for Variable Spending: ₹${available}
- Total Spent This Period: ₹${totalSpent}
- Money Left: ₹${moneyLeft}
- Days Remaining: ${daysRemaining}
- No-Expense Days: ${noExpenseDays.length}

SMART SPEND ENGINE:
- Dynamic Safe Spend Today: ₹${safeSpend}
- Day-of-Week Pattern: ${pattern}

EXPENSES THIS PERIOD:
${allExpenses}

LAST 7 DAYS:
${last7}
=== END OF DATA ===`;
  } catch {
    return "Could not load budget data.";
  }
}

const SYSTEM_PROMPT = `You are BudgetBot, a smart AI financial assistant inside PocketUni — a student budgeting app.
You have full access to the user's real budget data shown below. Use it to give specific, personalized advice.
Rules:
- Always use ₹ for Indian Rupees
- Be friendly, concise, and practical
- Use bullet points for lists
- Reference actual numbers from the user's data
- Keep responses under 150 words unless asked for detail
- If no budget data exists, ask the user to set up their budget in Settings`;

const QUICK_PROMPTS = [
  "How am I doing this month?",
  "Am I on track?",
  "Where am I overspending?",
  "How can I save more?",
  "Give me a budget plan",
  "Analyze my spending pattern",
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: "Hi! I'm BudgetBot 🤖 powered by Llama 3.3 70B. I have full access to your budget data. What would you like to know?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const keyMissing = NVIDIA_API_KEY === "nvapi-YOUR_KEY_HERE";

  // scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 3-D orb canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const container = canvas.parentElement;
    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    container?.addEventListener("mousemove", onMouseMove as EventListener);

    type Orb = { x: number; y: number; vx: number; vy: number; r: number; hue: number; alpha: number };
    const orbs: Orb[] = Array.from({ length: 20 }, () => ({
      x: Math.random() * 500,
      y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 50 + Math.random() * 90,
      hue: 150 + Math.random() * 130,
      alpha: 0.07 + Math.random() * 0.13,
    }));

    let raf: number;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      orbs.forEach(o => {
        const dx = o.x - mouse.current.x;
        const dy = o.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          o.vx += (dx / dist) * 0.12;
          o.vy += (dy / dist) * 0.12;
        }
        o.vx *= 0.993;
        o.vy *= 0.993;
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue},75%,62%,${o.alpha})`);
        g.addColorStop(1, `hsla(${o.hue},75%,62%,0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      container?.removeEventListener("mousemove", onMouseMove as EventListener);
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    if (keyMissing) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          text: "⚠️ NVIDIA API key not set.\n\n1. Go to https://build.nvidia.com\n2. Sign up free\n3. Click any model → Get API Key\n4. Paste it in AiChat.tsx replacing 'nvapi-YOUR_KEY_HERE'",
        }]);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const budgetContext = getBudgetContext();
      const chatMessages = [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${budgetContext}` },
        ...messages.map(m => ({ role: m.role, content: m.text })),
        { role: "user", content: text },
      ];

      const res = await fetch(NVIDIA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: chatMessages,
          temperature: 0.6,
          max_tokens: 400,
          stream: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.message || err?.detail || `HTTP ${res.status}`;
        if (res.status === 401) throw new Error("Invalid API key. Check your NVIDIA API key.");
        if (res.status === 429) throw new Error("Rate limit hit. Please wait a moment and try again.");
        throw new Error(msg);
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) throw new Error("Empty response from model.");
      setMessages(prev => [...prev, { role: "assistant", text: reply.trim() }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `❌ ${e.message || "Something went wrong. Please try again."}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg,#07091a 0%,#0d1b2e 50%,#09180f 100%)",
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}
    >
      {/* Animated 3-D orb canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Glass shell */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* ── Header ── */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,rgba(52,211,153,0.22),rgba(99,102,241,0.18))",
              border: "1px solid rgba(52,211,153,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(52,211,153,0.22), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>
              <Sparkles size={17} color="#34d399" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e2e8f0", letterSpacing: "0.01em" }}>BudgetBot</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(148,163,184,0.65)" }}>Llama 3.3 70B · NVIDIA</p>
            </div>
          </div>
          <button
            onClick={() => setMessages([{ role: "assistant", text: "Chat cleared! Ask me anything about your budget." }])}
            title="Clear chat"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "7px",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "#94a3b8";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* ── Messages ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minHeight: 0,
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-end",
              }}
            >
              {/* Avatar */}
              <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: msg.role === "assistant"
                  ? "linear-gradient(135deg,rgba(52,211,153,0.2),rgba(99,102,241,0.15))"
                  : "linear-gradient(135deg,rgba(139,92,246,0.3),rgba(59,130,246,0.2))",
                border: msg.role === "assistant"
                  ? "1px solid rgba(52,211,153,0.35)"
                  : "1px solid rgba(139,92,246,0.45)",
                boxShadow: msg.role === "assistant"
                  ? "0 0 10px rgba(52,211,153,0.18)"
                  : "0 0 10px rgba(139,92,246,0.22)",
              }}>
                {msg.role === "assistant"
                  ? <Bot size={14} color="#34d399" />
                  : <User size={14} color="#a78bfa" />}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: "78%",
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                borderRadius: msg.role === "assistant" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                background: msg.role === "assistant"
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg,rgba(139,92,246,0.42),rgba(59,130,246,0.35))",
                border: msg.role === "assistant"
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(139,92,246,0.35)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                color: msg.role === "assistant" ? "#e2e8f0" : "#fff",
                boxShadow: msg.role === "assistant"
                  ? "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "0 4px 20px rgba(139,92,246,0.28)",
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg,rgba(52,211,153,0.2),rgba(99,102,241,0.15))",
                border: "1px solid rgba(52,211,153,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 10px rgba(52,211,153,0.18)",
              }}>
                <Bot size={14} color="#34d399" />
              </div>
              <div style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px 16px 16px 4px",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 160, 320].map(delay => (
                    <span
                      key={delay}
                      style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "linear-gradient(135deg,#34d399,#818cf8)",
                        display: "inline-block",
                        animation: "budgetbot-bounce 1.1s ease-in-out infinite",
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick prompts ── */}
        {messages.length <= 1 && (
          <div style={{ flexShrink: 0, padding: "0 14px 10px" }}>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    flexShrink: 0,
                    padding: "7px 14px",
                    fontSize: 11,
                    fontWeight: 500,
                    borderRadius: 20,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "#94a3b8",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(52,211,153,0.14)";
                    e.currentTarget.style.borderColor = "rgba(52,211,153,0.45)";
                    e.currentTarget.style.color = "#34d399";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input bar ── */}
        <div style={{
          flexShrink: 0,
          padding: "10px 14px 16px",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              placeholder="Ask about your budget..."
              rows={1}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "11px 16px",
                fontSize: 13,
                color: "#e2e8f0",
                resize: "none",
                outline: "none",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                maxHeight: 100,
                overflowY: "auto",
                fontFamily: "inherit",
                transition: "border-color .2s, box-shadow .2s",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                background: input.trim() && !loading
                  ? "linear-gradient(135deg,#34d399,#6366f1)"
                  : "rgba(255,255,255,0.07)",
                color: "#fff",
                boxShadow: input.trim() && !loading
                  ? "0 0 22px rgba(52,211,153,0.38), inset 0 1px 0 rgba(255,255,255,0.15)"
                  : "none",
                transition: "all .25s",
              }}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe injection */}
      <style>{`
        @keyframes budgetbot-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
