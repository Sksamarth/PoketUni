import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Calendar, MapPin, Settings, MessageCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

/* ── Global 3-D orb canvas (renders once for the whole app) ── */
function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    });

    type Orb = { x:number; y:number; vx:number; vy:number; r:number; hue:number; alpha:number };
    const orbs: Orb[] = Array.from({ length: 22 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      vx:    (Math.random() - 0.5) * 0.45,
      vy:    (Math.random() - 0.5) * 0.45,
      r:     55 + Math.random() * 95,
      hue:   145 + Math.random() * 130,
      alpha: 0.06 + Math.random() * 0.11,
    }));

    let raf: number;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      orbs.forEach(o => {
        const dx = o.x - mouse.current.x;
        const dy = o.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          o.vx += (dx / dist) * 0.1;
          o.vy += (dy / dist) * 0.1;
        }
        o.vx *= 0.993; o.vy *= 0.993;
        o.x += o.vx;   o.y += o.vy;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W+o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H+o.r) o.y = -o.r;

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue},72%,60%,${o.alpha})`);
        g.addColorStop(1, `hsla(${o.hue},72%,60%,0)`);
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
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

export function Root() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedInUser");
    if (!loggedIn) { navigate("/login"); return; }
    const onboardingComplete = localStorage.getItem("onboardingComplete");
    if (!onboardingComplete && location.pathname !== "/onboarding") {
      navigate("/onboarding");
    } else {
      setHasSeenOnboarding(true);
    }
  }, [navigate, location.pathname]);

  const isAdmin = location.pathname === "/admin";

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg,#07091a 0%,#0d1b2e 50%,#09180f 100%)",
      color: "#e2e8f0",
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      position: "relative",
    }}>
      {/* Global animated orb background */}
      <OrbCanvas />

      {/* Page content */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, position: "relative", zIndex: 1 }}>
        <Outlet />
      </div>

      {/* Bottom Nav */}
      {hasSeenOnboarding && !isAdmin && (
        <nav style={{
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.09)",
          padding: `12px 16px max(12px, env(safe-area-inset-bottom))`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", maxWidth: 480, margin: "0 auto" }}>
            <NavButton icon={<Home size={22} />}          label="Home"     active={location.pathname === "/"}            onClick={() => navigate("/")} />
            <NavButton icon={<Calendar size={22} />}      label="Calendar" active={location.pathname === "/calendar"}    onClick={() => navigate("/calendar")} />
            <NavButton icon={<MapPin size={22} />}        label="Campus"   active={location.pathname === "/campus"}      onClick={() => navigate("/campus")} />
            <NavButton icon={<MessageCircle size={22} />} label="AI Chat"  active={location.pathname === "/chat"}        onClick={() => navigate("/chat")} />
            <NavButton icon={<Settings size={22} />}      label="Settings" active={location.pathname === "/onboarding"}  onClick={() => navigate("/onboarding")} />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "6px 12px",
        borderRadius: 12,
        border: "none",
        background: active ? "rgba(52,211,153,0.12)" : "transparent",
        color: active ? "#34d399" : "rgba(148,163,184,0.55)",
        cursor: "pointer",
        transition: "all .2s",
        minWidth: 52,
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  );
}
