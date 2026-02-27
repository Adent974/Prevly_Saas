import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function licenseStatusLabel(status: string) {
  const map: Record<string, string> = {
    AVAILABLE: "Disponible",
    ACTIVE: "Active",
    REVOKED: "Révoquée",
    EXPIRED: "Expirée",
  };
  return map[status] ?? status;
}

export function checkResultLabel(result: string) {
  const map: Record<string, string> = {
    NORMAL: "Normal",
    ANOMALY: "Anomalie",
    UNSURE: "Incertain",
  };
  return map[result] ?? result;
}

export function anxietyLabel(level: string) {
  const map: Record<string, string> = {
    LOW: "Faible",
    MEDIUM: "Moyen",
    HIGH: "Élevé",
  };
  return map[level] ?? level;
}

export function appointmentStatusLabel(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: "Planifié",
    COMPLETED: "Effectué",
    CANCELLED: "Annulé",
  };
  return map[status] ?? status;
}
