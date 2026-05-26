import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, IndianRupee, MapPin, ShieldCheck, Eye, EyeOff, Pencil, X } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { getVendors, saveVendors } from "../../../utils/supabase/vendors";

const ADMIN_PASSWORD = "admin123";
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

interface Vendor {
  id: string;
  name: string;
  category: string;
  avgPrice: number;
  location: string;
  locationUrl?: string;
  lat: number | null;
  lng: number | null;
  distance: string;
  description: string;
  imageUrl: string;
}

const CATEGORIES = ["Food/Mess", "Stationery/Xerox", "Medical", "Other"];

const emptyVendor = (): Omit<Vendor, "id"> => ({
  name: "",
  category: "Food/Mess",
  avgPrice: 0,
  location: "",
  locationUrl: "",
  lat: null,
  lng: null,
  distance: "",
  description: "",
  imageUrl: "",
});

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

function loadGoogleMapsScript(apiKey: string, onLoad: () => void) {
  if (document.getElementById("google-maps-script")) {
    if (window.google?.maps?.places) onLoad();
    return;
  }
  window.initGoogleMaps = onLoad;
  const script = document.createElement("script");
  script.id = "google-maps-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function LocationInput({
  value,
  onChange,
  onPlaceSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelect: (location: string, lat: number, lng: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY, () => setMapsReady(true));
  }, []);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || autocompleteRef.current) return;
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
    });
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      const address = place.formatted_address || place.name || "";
      const lat = place.geometry?.location?.lat() ?? null;
      const lng = place.geometry?.location?.lng() ?? null;
      if (lat !== null && lng !== null) {
        onPlaceSelect(address, lat, lng);
      } else {
        onChange(address);
      }
    });
  }, [mapsReady, onChange, onPlaceSelect]);

  return (
    <div className="relative">
      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={mapsReady ? "Search location..." : "Loading Maps..."}
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 h-12 rounded-md pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 h-48 mt-2">
      <iframe
        title="Location Preview"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=16`}
      />
    </div>
  );
}

export function AdminPanel() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState("");

  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    getVendors().then((data) => setVendors(data));
  }, []);

  const [form, setForm] = useState(emptyVendor());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vendors" | "list">("vendors");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const save = useCallback(async (updated: Vendor[]) => {
    setVendors(updated);
    setSaveError("");
    try {
      await saveVendors(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveError(e.message || "Save failed");
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.location) return;
    const updated = editingId
      ? vendors.map((v) => (v.id === editingId ? { ...form, id: editingId } : v))
      : [...vendors, { ...form, id: Date.now().toString() }];
    await save(updated);
    setEditingId(null);
    setForm(emptyVendor());
    setActiveTab("list");
  };

  const handleEdit = (vendor: Vendor) => {
    setForm({ ...vendor });
    setEditingId(vendor.id);
    setActiveTab("vendors");
  };

  const handleDelete = async (id: string) => {
    await save(vendors.filter((v) => v.id !== id));
  };

  const handlePlaceSelect = (location: string, lat: number, lng: number) => {
    setForm((f) => ({ ...f, location, lat, lng }));
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={28} className="text-emerald-400" />
            <h1 className="text-2xl">Admin Login</h1>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Password</Label>
              <div className="relative mt-2">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="bg-zinc-800 border-zinc-700 text-white pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {authError && <p className="text-red-400 text-sm mt-1">{authError}</p>}
            </div>
            <Button onClick={handleLogin} className="w-full bg-emerald-500 hover:bg-emerald-600">
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-emerald-400" />
          <h1 className="text-xl">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/campus")} className="text-emerald-400 text-sm">
            View Campus
          </button>
          <button onClick={() => setAuthed(false)} className="text-zinc-400 hover:text-white text-sm">
            Logout
          </button>
        </div>
      </div>
      {saved && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2 text-emerald-400 text-sm text-center">
          ✓ Saved to cloud successfully
        </div>
      )}
      {saveError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-2 text-red-400 text-sm text-center">
          ✗ {saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(["vendors", "list"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm capitalize transition-colors ${
              activeTab === tab
                ? "text-emerald-400 border-b-2 border-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "vendors" ? (editingId ? "Edit Vendor" : "Add Vendor") : `All Vendors (${vendors.length})`}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 pb-32">
        {activeTab === "vendors" && (
          <div className="space-y-5 max-w-lg mx-auto">
            {editingId && (
              <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-2 text-sm">
                <span className="text-zinc-400">Editing: <span className="text-white">{form.name}</span></span>
                <button onClick={() => { setEditingId(null); setForm(emptyVendor()); }} className="text-zinc-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            )}

            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Campus Canteen"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      form.category === cat
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Average Price (₹)</Label>
              <div className="relative mt-2">
                <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="number"
                  value={form.avgPrice || ""}
                  onChange={(e) => setForm({ ...form, avgPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700 text-white pl-10 mt-0"
                />
              </div>
            </div>

            <div>
              <Label>Location *</Label>
              <div className="mt-2">
                <LocationInput
                  value={form.location}
                  onChange={(v) => setForm({ ...form, location: v, lat: null, lng: null })}
                  onPlaceSelect={handlePlaceSelect}
                />
              </div>
              {form.lat && form.lng && <MapPreview lat={form.lat} lng={form.lng} />}
            </div>

            <div>
              <Label>Google Maps URL <span className="text-zinc-500 text-xs">(paste share link for directions)</span></Label>
              <Input
                value={form.locationUrl || ""}
                onChange={(e) => setForm({ ...form, locationUrl: e.target.value })}
                placeholder="https://maps.app.goo.gl/... or google.com/maps/..."
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label>Walking Distance</Label>
              <Input
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
                placeholder="e.g., 5 min walk"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.location}
              className="w-full bg-emerald-500 hover:bg-emerald-600 h-12"
            >
              {editingId ? "Update Vendor" : <><Plus size={18} className="mr-2" /> Add Vendor</>}
            </Button>
          </div>
        )}

        {activeTab === "list" && (
          <div className="space-y-3 max-w-lg mx-auto">
            {vendors.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">No vendors added yet</div>
            ) : (
              vendors.map((vendor) => (
                <div key={vendor.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{vendor.name}</p>
                      <p className="text-zinc-400 text-sm">{vendor.category} · ₹{vendor.avgPrice}</p>
                      <p className="text-zinc-500 text-xs mt-1 truncate">{vendor.location}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {vendor.lat && vendor.lng && (
                    <MapPreview lat={vendor.lat} lng={vendor.lng} />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
