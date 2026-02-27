"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  quantity: number;
  price: number;
  label: string;
  colorClass?: string;
}

export function PurchasePackButton({ quantity, price, label, colorClass }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleBuy() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, priceEuros: price }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-auto pt-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1 mb-2">{error}</p>
      )}
      <button
        onClick={handleBuy}
        disabled={loading}
        className={cn(
          "w-full py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60",
          colorClass ?? "bg-rose-600 hover:bg-rose-500 text-white"
        )}
      >
        {loading ? "En cours…" : label}
      </button>
    </div>
  );
}
