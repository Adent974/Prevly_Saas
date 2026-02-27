import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard, Card, Badge } from "@/components/ui";
import { Users, Key, Calendar, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatDate, anxietyLabel } from "@/lib/utils";

async function getDashboardData(professionalId: string) {
  const [
    totalPatients,
    activePatients,
    totalLicenses,
    usedLicenses,
    upcomingAppointments,
    recentAnomalies,
    recentPatients,
    recentSelfChecks,
  ] = await Promise.all([
    prisma.patient.count({ where: { professionalId } }),
    prisma.patient.count({ where: { professionalId, isActive: true } }),
    prisma.license.count({ where: { pack: { professionalId } } }),
    prisma.license.count({ where: { pack: { professionalId }, status: "ACTIVE" } }),
    prisma.appointment.count({
      where: {
        professionalId,
        status: "SCHEDULED",
        scheduledAt: { gte: new Date() },
      },
    }),
    prisma.anomalyReport.findMany({
      where: { patient: { professionalId } },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { reportedAt: "desc" },
      take: 5,
    }),
    prisma.patient.findMany({
      where: { professionalId },
      include: { license: { select: { status: true } } },
      orderBy: { joinedAt: "desc" },
      take: 5,
    }),
    prisma.selfCheckRecord.count({
      where: { patient: { professionalId } },
    }),
  ]);

  return {
    totalPatients,
    activePatients,
    totalLicenses,
    usedLicenses,
    availableLicenses: totalLicenses - usedLicenses,
    upcomingAppointments,
    recentAnomalies,
    recentPatients,
    recentSelfChecks,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData(session!.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {session!.user.name.split(" ").slice(-1)[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Voici un résumé de votre activité Prevly</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Patientes actives"
          value={data.activePatients}
          sub={`sur ${data.totalPatients} au total`}
          icon={<Users size={20} />}
          color="rose"
        />
        <StatCard
          label="Licences disponibles"
          value={data.availableLicenses}
          sub={`${data.usedLicenses} utilisées`}
          icon={<Key size={20} />}
          color="blue"
        />
        <StatCard
          label="RDV à venir"
          value={data.upcomingAppointments}
          sub="dans les 30 prochains jours"
          icon={<Calendar size={20} />}
          color="green"
        />
        <StatCard
          label="Auto-examens réalisés"
          value={data.recentSelfChecks}
          sub="par toutes vos patientes"
          icon={<TrendingUp size={20} />}
          color="purple"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent patients */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dernières patientes</h2>
            <Link
              href="/dashboard/patients"
              className="text-xs text-rose-500 hover:underline font-medium"
            >
              Voir tout
            </Link>
          </div>

          {data.recentPatients.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Aucune patiente enregistrée.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentPatients.map((p) => (
                <li key={p.id} className="py-3">
                  <Link
                    href={`/dashboard/patients/${p.id}`}
                    className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-semibold text-sm">
                        {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name ?? "Anonyme"}</p>
                        <p className="text-xs text-gray-500">
                          {p.ageRange ? `${p.ageRange} ans` : "—"} · {anxietyLabel(p.anxietyLevel)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <Badge variant="green">Active</Badge>
                      ) : (
                        <Badge variant="red">Révoquée</Badge>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(p.joinedAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent anomaly reports */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-semibold text-gray-900">Signalements récents</h2>
            </div>
            <Link
              href="/dashboard/patients"
              className="text-xs text-rose-500 hover:underline font-medium"
            >
              Voir tout
            </Link>
          </div>

          {data.recentAnomalies.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun signalement récent. </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentAnomalies.map((a) => (
                <li key={a.id} className="py-3">
                  <Link
                    href={`/dashboard/patients/${a.patientId}`}
                    className="flex items-start justify-between hover:bg-gray-50 -mx-2 px-2 rounded-lg transition gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-sm flex-shrink-0">
                        {a.patient.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {a.patient.name ?? "Anonyme"}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {a.types.join(", ") || "Anomalie signalée"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(a.reportedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="!p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Actions rapides</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/licenses"
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Key size={16} /> Gérer les licences
          </Link>
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Users size={16} /> Voir les patientes
          </Link>
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Calendar size={16} /> Rendez-vous
          </Link>
        </div>
      </Card>
    </div>
  );
}
