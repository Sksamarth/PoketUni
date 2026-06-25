import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { MapPin, DollarSign, Clock, Navigation } from "lucide-react";
import { getVendors } from "../../../utils/supabase/vendors";
import { getDynamicSafeSpend } from "../components/safeSpendEngine";

interface Vendor {
  id: string; name: string; category: string; avgPrice: number;
  location: string; locationUrl?: string; lat?: number | null;
  lng?: number | null; distance: string; description: string; imageUrl: string;
}

type Category = "All" | "Food/Mess" | "Stationery/Xerox" | "Medical" | "Other";

function categoryEmoji(cat: string) {
  if (cat === "Food/Mess") return "🍽️";
  if (cat === "Medical") return "💊";
  return "📚";
}

function VendorImage({ url, name, category }: { url: string; name: string; category: string }) {
  const [failed, setFailed] = useState(!url);

  if (failed || !url) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
        background: "linear-gradient(135deg,rgba(52,211,153,0.1),rgba(5,150,105,0.15))",
      }}>
        <span style={{ fontSize: 48 }}>{categoryEmoji(category)}</span>
        <span style={{ fontSize: 12, color: "rgba(148,163,184,0.6)" }}>{name}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      onError={() => setFailed(true)}
    />
  );
}

function toEmbedUrl(url: string): string {
  if (url.includes("/maps/embed")) return url;
  const coordMatch = url.match(/[/@](-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${coordMatch[1]},${coordMatch[2]}&zoom=16`;
  const qMatch = url.match(/[?&]q=([^&]+)/);
  if (qMatch) return `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${qMatch[1]}&zoom=16`;
  const placeMatch = url.match(/\/place\/([^/]+)/);
  if (placeMatch) return `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${placeMatch[1]}&zoom=16`;
  return url;
}

export function CampusRecommender() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [selectedVendor, setSelectedVendor]     = useState<Vendor | null>(null);
  const [allVendors, setAllVendors]             = useState<Vendor[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");

  const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
  const { safeSpend } = getDynamicSafeSpend(expenses);

  const loadVendors = async () => {
    setLoading(true); setError("");
    try { setAllVendors(await getVendors()); }
    catch { setError("Failed to load vendors. Check connection."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadVendors(); }, [location.pathname]);

  const categories: Category[] = ["All", ...Array.from(new Set(allVendors.map(v => v.category))) as Category[]];
  const filteredVendors = selectedCategory === "All" ? allVendors : allVendors.filter(v => v.category === selectedCategory);

  const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
  };

  return (
    <div style={{ minHeight: "100%", position: "relative", zIndex: 1, paddingBottom: 90 }}>

      {/* Sticky Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "16px 20px 14px",
      }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Campus Recommender</h1>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(148,163,184,0.6)" }}>
          Budget-friendly spots near you
          {safeSpend > 0 && <span style={{ marginLeft: 8, color: "#34d399", fontWeight: 500 }}>· Safe to spend: ₹{safeSpend}/day</span>}
        </p>
      </div>

      {/* Category chips */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                flexShrink: 0, padding: "7px 16px", borderRadius: 20,
                fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                border: selectedCategory === cat ? "1px solid rgba(52,211,153,0.45)" : "1px solid rgba(255,255,255,0.1)",
                background: selectedCategory === cat ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                color: selectedCategory === cat ? "#34d399" : "rgba(148,163,184,0.65)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                boxShadow: selectedCategory === cat ? "0 0 12px rgba(52,211,153,0.15)" : "none",
                transition: "all .2s",
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Vendor list or Map view */}
      {!selectedVendor ? (
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(148,163,184,0.45)", fontSize: 14 }}>
              Loading vendors…
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ color: "#f87171", fontSize: 14, marginBottom: 12 }}>{error}</p>
              <button onClick={loadVendors} style={{ padding: "9px 20px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#e2e8f0", cursor: "pointer", fontSize: 13 }}>Retry</button>
            </div>
          ) : allVendors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(148,163,184,0.45)", fontSize: 14 }}>No vendors added yet</div>
          ) : filteredVendors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(148,163,184,0.45)", fontSize: 14 }}>No vendors in this category</div>
          ) : filteredVendors.map(vendor => {
            const fits = safeSpend > 0 && vendor.avgPrice <= safeSpend;
            return (
              <button
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                style={{
                  ...glassCard,
                  borderRadius: 20, overflow: "hidden",
                  width: "100%", textAlign: "left", cursor: "pointer",
                  transition: "all .22s",
                  border: fits ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.09)",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.015)"; e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = fits ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.09)"; }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                  <VendorImage url={vendor.imageUrl} name={vendor.name} category={vendor.category} />
                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,9,26,0.7) 0%, transparent 50%)" }} />
                  <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 20, fontSize: 12, color: "#e2e8f0" }}>
                    Avg: ₹{vendor.avgPrice}
                  </div>
                  {fits && (
                    <div style={{ position: "absolute", top: 10, left: 10, background: "linear-gradient(135deg,#34d399,#059669)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "#fff", boxShadow: "0 0 12px rgba(52,211,153,0.4)" }}>
                      ✦ Fits Your Budget
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#e2e8f0" }}>{vendor.name}</h3>
                    {fits && safeSpend > 0 && <span style={{ fontSize: 11, color: "#34d399" }}>within ₹{safeSpend}/day</span>}
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(148,163,184,0.6)" }}>{vendor.description}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(148,163,184,0.5)" }}>
                      <MapPin size={14} />{vendor.distance}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(148,163,184,0.5)" }}>
                      <Navigation size={14} />{vendor.location}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Detail view */
        <div style={{ position: "relative", height: "calc(100dvh - 140px)", overflowY: "auto" }}>
          {/* Top image instead of broken map */}
          <div style={{ position: "relative", height: 240, overflow: "hidden", flexShrink: 0 }}>
            <VendorImage url={selectedVendor.imageUrl} name={selectedVendor.name} category={selectedVendor.category} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,9,26,0.85) 0%, transparent 60%)" }} />
            <button
              onClick={() => setSelectedVendor(null)}
              style={{
                position: "absolute", top: 14, left: 14,
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                color: "#e2e8f0", cursor: "pointer", padding: "6px 14px", fontSize: 13,
              }}
            >← Back</button>
            {safeSpend > 0 && selectedVendor.avgPrice <= safeSpend && (
              <div style={{ position: "absolute", top: 14, right: 14, background: "linear-gradient(135deg,#34d399,#059669)", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "#fff", boxShadow: "0 0 12px rgba(52,211,153,0.4)" }}>
                ✦ Fits Budget
              </div>
            )}
          </div>

          {/* Vendor info */}
          <div style={{ padding: "20px 20px 28px", background: "rgba(13,27,46,0.95)" }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>{selectedVendor.name}</h3>
              <p style={{ margin: "0 0 10px", fontSize: 14, color: "rgba(148,163,184,0.7)" }}>{selectedVendor.description}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399", fontSize: 14 }}>
                <DollarSign size={15} /> Avg: ₹{selectedVendor.avgPrice}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, padding: "14px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                <MapPin size={16} color="#34d399" />{selectedVendor.location}
              </div>
              {selectedVendor.distance && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(148,163,184,0.7)" }}>
                  <Clock size={16} color="#34d399" />{selectedVendor.distance} walking
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const url = selectedVendor.locationUrl ||
                  (selectedVendor.lat && selectedVendor.lng
                    ? `https://www.google.com/maps/dir/?api=1&destination=${selectedVendor.lat},${selectedVendor.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVendor.location)}`);
                window.open(url, "_blank");
              }}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 0 24px rgba(52,211,153,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Navigation size={18} /> Get Directions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
