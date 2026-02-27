"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Zap, RefreshCw } from "lucide-react";

const INITIAL_PACKS = [
  { quantity: 50,    price: 150,  perUnit: 3.00,  label: "Pack 50 licences",     badge: "" },
  { quantity: 150,   price: 420,  perUnit: 2.80,  label: "Pack 150 licences",    badge: "Populaire" },
  { quantity: 300,   price: 750,  perUnit: 2.50,  label: "Pack 300 licences",    badge: "Meilleur rapport" },
  { quantity: 1000,  price: 2200, perUnit: 2.20,  label: "Pack 1 000 licences",  badge: "" },
];

const RECHARGE_PACKS = [
  { quantity: 50,   price: 140,  perUnit: 2.80, label: "Recharge +50 licences" },
  { quantity: 100,  price: 270,  perUnit: 2.70, label: "Recharge +100 licences" },
  { quantity: 250,  price: 600,  perUnit: 2.40, label: "Recharge +250 licences" },
  { quantity: 1000, price: 2000, perUnit: 2.00, label: "Recharge +1 000 licences" },
];

type Tab = "initial" | "recharge";

export function BuyLicensesButton() {
  const router   = useRouter();
  const [open, setOpen]         = useState(false);
  const [tab, setTab]           = useState<Tab>("recharge");
  const [selected, setSelected] = useState<{ quantity: number; price: number; label: string } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const packs = tab === "initial" ? INITIAL_PACKS : RECHARGE_PACKS;

  function openModal(defaultTab: Tab = "recharge") {
    setTab(defaultTab);
    setSelected(null);
    setError("");
    setOpen(true);
  }

  async function handleBuy() {
    if (!selected) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: selected.quantity, priceEuros: selected.price }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erreur");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => openModal()}
        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        <ShoppingCart size={16} /> Acheter des licences
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-900">Acheter des licences</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
              <button
                onClick={() => { setTab("recharge"); setSelected(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === "recharge" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <RefreshCw size={14} /> Recharge
              </button>
              <button
                onClick={() => { setTab("initial"); setSelected(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === "initial" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Zap size={14} /> Pack de démarrage
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {packs.map((pack) => {
                const isSelected = selected?.quantity === pack.quantity && selected?.price === pack.price;
                const badge = "badge" in pack ? (pack as { badge: string }).badge : "";
                return (
                  <label
                    key={`${pack.quantity}-${pack.price}`}
                    className={`relative flex items-center justify-between p-3 border rounded-xl cursor-pointer transition ${
                      isSelected ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {badge && (
                      <span className="absolute -top-2.5 right-3 bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelected(pack)}
                        className="accent-rose-500"
                      />
                      <div>
                        <span className="font-medium text-sm text-gray-900">{pack.label}</span>
                        <span className="ml-2 text-xs text-gray-400">{pack.perUnit.toFixed(2)} € / lic.</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-rose-600">{pack.price} €</span>
                  </label>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <p className="text-xs text-gray-400 mb-4">
              * Intégration Stripe à venir. Les licences sont créées immédiatement.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBuy}
                disabled={loading || !selected}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "En cours…" : selected ? `Confirmer — ${selected.price} €` : "Sélectionnez un pack"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
