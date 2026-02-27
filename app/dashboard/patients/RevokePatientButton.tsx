"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  patientId: string;
  isActive: boolean;
  patientName: string;
}

export function RevokePatientButton({ patientId, isActive, patientName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const action = isActive ? "revoke" : "restore";
    const confirmMsg = isActive
      ? `Révoquer l'accès de ${patientName} ? Elle ne pourra plus utiliser l'application Prevly.`
      : `Restaurer l'accès de ${patientName} ?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-xs font-medium hover:underline disabled:opacity-50 ${
        isActive ? "text-red-500" : "text-green-600"
      }`}
    >
      {loading ? "…" : isActive ? "Révoquer" : "Restaurer"}
    </button>
  );
}
