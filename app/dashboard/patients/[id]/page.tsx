import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import {
  User, Key, Calendar, Activity, AlertTriangle, CheckCircle, ArrowLeft, Clock,
} from "lucide-react";
import Link from "next/link";
import {
  formatDate, formatDateTime, checkResultLabel, anxietyLabel, appointmentStatusLabel, licenseStatusLabel,
} from "@/lib/utils";
import { RevokePatientButton } from "../RevokePatientButton";

const ANOMALY_LABELS: Record<string, string> = {
  LUMP: "Boule / épaississement",
  PAIN: "Douleur / sensibilité",
  SKIN_CHANGE: "Modification cutanée",
  DISCHARGE: "Écoulement du mamelon",
};

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, professionalId: session!.user.id },
    include: {
      license: true,
      selfCheckRecords: { orderBy: { date: "desc" }, take: 12 },
      anomalyReports: { orderBy: { reportedAt: "desc" }, take: 10 },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 10 },
    },
  });

  if (!patient) notFound();

  const lastCheck = patient.selfCheckRecords[0];
  const hasAnomaly = patient.anomalyReports.length > 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/patients"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3"
          >
            <ArrowLeft size={14} /> Retour aux patientes
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-2xl">
              {patient.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name ?? "Anonyme"}</h1>
              <p className="text-gray-500 text-sm">{patient.email ?? "—"}</p>
            </div>
          </div>
        </div>
        <RevokePatientButton
          patientId={patient.id}
          isActive={patient.isActive}
          patientName={patient.name ?? "cette patiente"}
        />
      </div>

      {/* Patient info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-rose-500" />
            <h3 className="font-semibold text-sm text-gray-900">Profil</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Tranche d'âge</dt>
              <dd className="font-medium">{patient.ageRange ? `${patient.ageRange} ans` : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Antécédents familiaux</dt>
              <dd>
                <Badge variant={patient.familyHistory ? "amber" : "green"}>
                  {patient.familyHistory ? "Oui" : "Non"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Niveau d'anxiété</dt>
              <dd>
                <Badge variant={patient.anxietyLevel === "HIGH" ? "red" : patient.anxietyLevel === "MEDIUM" ? "amber" : "green"}>
                  {anxietyLabel(patient.anxietyLevel)}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Inscrite</dt>
              <dd className="text-gray-700">{formatDate(patient.joinedAt)}</dd>
            </div>
            {patient.lastSeenAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Dernière activité</dt>
                <dd className="text-gray-700">{formatDate(patient.lastSeenAt)}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* License */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-blue-500" />
            <h3 className="font-semibold text-sm text-gray-900">Licence</h3>
          </div>
          {patient.license ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Statut</dt>
                <dd>
                  <Badge variant={patient.license.status === "ACTIVE" ? "green" : patient.license.status === "REVOKED" ? "red" : "amber"}>
                    {licenseStatusLabel(patient.license.status)}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Accès</dt>
                <dd>
                  <Badge variant={patient.isActive ? "green" : "red"}>
                    {patient.isActive ? "Actif" : "Révoqué"}
                  </Badge>
                </dd>
              </div>
              {patient.license.assignedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Attribuée</dt>
                  <dd>{formatDate(patient.license.assignedAt)}</dd>
                </div>
              )}
              {patient.license.expiresAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Expire</dt>
                  <dd>{formatDate(patient.license.expiresAt)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Aucune licence attribuée.</p>
          )}
        </Card>

        {/* Health summary */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-green-500" />
            <h3 className="font-semibold text-sm text-gray-900">Santé</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Auto-examens</dt>
              <dd className="font-bold text-gray-900">{patient.selfCheckRecords.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Signalements</dt>
              <dd>
                {hasAnomaly ? (
                  <Badge variant="amber">{patient.anomalyReports.length}</Badge>
                ) : (
                  <Badge variant="green">0</Badge>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Dernier examen</dt>
              <dd>{lastCheck ? formatDate(lastCheck.date) : "—"}</dd>
            </div>
            {lastCheck && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Résultat</dt>
                <dd>
                  <Badge variant={lastCheck.result === "NORMAL" ? "green" : lastCheck.result === "ANOMALY" ? "red" : "amber"}>
                    {checkResultLabel(lastCheck.result)}
                  </Badge>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Anomaly reports */}
      {patient.anomalyReports.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900">Rapports d'anomalies</h3>
          </div>
          <div className="space-y-3">
            {patient.anomalyReports.map((r) => (
              <div key={r.id} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {r.types.map((t) => (
                      <Badge key={t} variant="amber">{ANOMALY_LABELS[t] ?? t}</Badge>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{formatDate(r.reportedAt)}</span>
                </div>
                {r.duration && <p className="text-sm text-gray-600">Durée : {r.duration}</p>}
                {r.generatedSummary && (
                  <p className="text-sm text-gray-700 mt-2 italic border-l-2 border-amber-300 pl-3">
                    {r.generatedSummary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Self-check history */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} className="text-green-500" />
          <h3 className="font-semibold text-gray-900">Historique des auto-examens</h3>
        </div>
        {patient.selfCheckRecords.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun auto-examen enregistré.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {patient.selfCheckRecords.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl px-3 py-2 text-center text-sm border ${
                  r.result === "NORMAL"
                    ? "bg-green-50 border-green-100 text-green-700"
                    : r.result === "ANOMALY"
                    ? "bg-red-50 border-red-100 text-red-700"
                    : "bg-amber-50 border-amber-100 text-amber-700"
                }`}
              >
                <p className="font-medium">{checkResultLabel(r.result)}</p>
                <p className="text-xs opacity-75 mt-0.5">{formatDate(r.date)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Appointments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <h3 className="font-semibold text-gray-900">Rendez-vous</h3>
          </div>
        </div>
        {patient.appointments.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun rendez-vous enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {patient.appointments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Clock size={15} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500">
                      {a.doctorName ? `${a.doctorName} · ` : ""}
                      {formatDateTime(a.scheduledAt)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    a.status === "COMPLETED"
                      ? "green"
                      : a.status === "CANCELLED"
                      ? "red"
                      : "blue"
                  }
                >
                  {appointmentStatusLabel(a.status)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
