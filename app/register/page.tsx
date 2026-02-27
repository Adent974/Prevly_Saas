"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SPECIALTIES = [
  "Médecine générale",
  "Gynécologie",
  "Oncologie",
  "Radiologie",
  "Sage-femme",
  "Hôpital / Clinique",
  "Autre",
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    specialty: "",
    phone: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        organizationName: form.organizationName || undefined,
        specialty: form.specialty || undefined,
        phone: form.phone || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de la création du compte.");
      return;
    }

    router.push("/login?registered=1");
  }

  const Field = ({
    label,
    field,
    type = "text",
    placeholder,
    required = false,
  }: {
    label: string;
    field: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={(e) => update(field, e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500 mb-3">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte professionnel</h1>
          <p className="text-sm text-gray-500 mt-1">Rejoignez Prevly et gérez vos patientes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom complet" field="name" required placeholder="Dr. Sophie Martin" />
          <Field label="Email professionnel" field="email" type="email" required placeholder="dr.martin@cabinet.fr" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spécialité
            </label>
            <select
              value={form.specialty}
              onChange={(e) => update("specialty", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            >
              <option value="">Sélectionner…</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <Field label="Cabinet / Établissement" field="organizationName" placeholder="Cabinet médical du Parc" />
          <Field label="Téléphone" field="phone" type="tel" placeholder="+33 6 12 34 56 78" />
          <Field label="Mot de passe" field="password" type="password" required placeholder="Minimum 8 caractères" />
          <Field label="Confirmer le mot de passe" field="confirmPassword" type="password" required placeholder="••••••••" />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
          >
            {loading ? "Création du compte…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-rose-500 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
