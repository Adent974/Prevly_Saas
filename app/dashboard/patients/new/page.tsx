"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    ageRange: "",
    familyHistory: false,
    anxietyLevel: "LOW",
    licenseKey: "",
  });

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de l'ajout.");
      return;
    }

    const patient = await res.json();
    router.push(`/dashboard/patients/${patient.id}`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/patients"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3"
        >
          <ArrowLeft size={14} /> Retour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Ajouter une patiente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Associez une licence à votre patiente pour lui donner accès à Prevly.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clé de licence <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.licenseKey}
              onChange={(e) => update("licenseKey", e.target.value)}
              required
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Copiez une clé disponible depuis la page{" "}
              <Link href="/dashboard/licenses" className="text-rose-500 hover:underline">
                Licences
              </Link>
              .
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom / Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Marie Dupont"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="marie@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tranche d'âge</label>
            <select
              value={form.ageRange}
              onChange={(e) => update("ageRange", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="">Sélectionner…</option>
              <option value="18-22">18 – 22 ans</option>
              <option value="23-26">23 – 26 ans</option>
              <option value="27-30">27 – 30 ans</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'anxiété</label>
            <select
              value={form.anxietyLevel}
              onChange={(e) => update("anxietyLevel", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="LOW">Faible</option>
              <option value="MEDIUM">Moyen</option>
              <option value="HIGH">Élevé</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="familyHistory"
              checked={form.familyHistory}
              onChange={(e) => update("familyHistory", e.target.checked)}
              className="h-4 w-4 accent-rose-500"
            />
            <label htmlFor="familyHistory" className="text-sm text-gray-700">
              Antécédents familiaux de cancer du sein
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/patients"
              className="flex-1 text-center border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Ajout en cours…" : "Ajouter la patiente"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
