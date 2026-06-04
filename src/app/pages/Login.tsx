import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, IndianRupee, Lock, User } from "lucide-react";

const DEFAULT_USER = "student";
const DEFAULT_PASS = "budget123";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const storedUsers = (): Record<string, string> => {
    return JSON.parse(localStorage.getItem("users") || "null") ?? { [DEFAULT_USER]: DEFAULT_PASS };
  };

  const handleLogin = () => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password.trim()) { setError("Please fill in all fields"); return; }
    const users = storedUsers();
    if (users[cleanUser] === password) {
      localStorage.setItem("loggedInUser", cleanUser);
      // Check if this specific user has completed onboarding
      const userSetupKey = `onboardingComplete_${cleanUser}`;
      navigate(localStorage.getItem(userSetupKey) ? "/" : "/onboarding");
    } else {
      setError("Incorrect username or password");
    }
  };

  const handleSignup = () => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser || !password.trim()) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    const users = storedUsers();
    if (users[cleanUser]) { setError("Username already taken"); return; }
    users[cleanUser] = password;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("loggedInUser", cleanUser);
    navigate("/onboarding");
  };

  const G: React.CSSProperties = {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    position: "relative",
    zIndex: 1,
  };

  return (
    <div style={G}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
        <div style={{
          width: 58, height: 58, borderRadius: 18,
          background: "linear-gradient(135deg,#34d399,#059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 32px rgba(52,211,153,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>
          <IndianRupee size={30} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#e2e8f0" }}>PocketUni</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(148,163,184,0.65)" }}>Smart spending for students</p>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 360,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24,
        padding: "32px 28px",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, color: "#e2e8f0" }}>
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(148,163,184,0.65)" }}>
          {isSignup ? "Sign up to start tracking" : "Sign in to your account"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Username */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(148,163,184,0.8)", display: "block", marginBottom: 8 }}>Username</label>
            <div style={{ position: "relative" }}>
              <User size={15} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && (isSignup ? handleSignup() : handleLogin())}
                placeholder="e.g. student"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12, padding: "11px 14px 11px 36px",
                  fontSize: 14, color: "#e2e8f0",
                  outline: "none", transition: "border-color .2s, box-shadow .2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "rgba(148,163,184,0.8)", display: "block", marginBottom: 8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={15} color="rgba(148,163,184,0.5)" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && (isSignup ? handleSignup() : handleLogin())}
                placeholder="••••••••"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12, padding: "11px 40px 11px 36px",
                  fontSize: 14, color: "#e2e8f0",
                  outline: "none", transition: "border-color .2s, box-shadow .2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.08)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(148,163,184,0.5)", padding: 0 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{error}</p>}

          <button
            onClick={isSignup ? handleSignup : handleLogin}
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg,#34d399,#059669)",
              border: "none", borderRadius: 13,
              fontSize: 15, fontWeight: 600, color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 24px rgba(52,211,153,0.35)",
              transition: "all .22s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 36px rgba(52,211,153,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 24px rgba(52,211,153,0.35)"; e.currentTarget.style.transform = "none"; }}
          >
            {isSignup ? "Create Account" : "Sign In"}
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(148,163,184,0.55)" }}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button
            onClick={() => { setIsSignup(!isSignup); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#34d399", fontWeight: 500 }}
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {!isSignup && (
          <p style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: "rgba(148,163,184,0.3)" }}>
            Default: student / budget123
          </p>
        )}
      </div>
    </div>
  );
}
