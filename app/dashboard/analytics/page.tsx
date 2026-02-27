import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui";
import { Users, Key, TrendingUp, AlertTriangle } from "lucide-react";
import { AnalyticsCharts } from "./AnalyticsCharts";

async function getAnalytics(professionalId: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const [
    totalPatients,
    activePatients,
    totalLicenses,
    usedLicenses,
    totalSelfChecks,
    anomalyCount,
    checkResultBreakdown,
    selfCheckRecordsByMonth,
    anxietyBreakdown,
    ageRangeBreakdown,
  ] = await Promise.all([
    prisma.patient.count({ where: { professionalId } }),
    prisma.patient.count({ where: { professionalId, isActive: true } }),
    prisma.license.count({ where: { pack: { professionalId } } }),
    prisma.license.count({ where: { pack: { professionalId }, status: "ACTIVE" } }),
    prisma.selfCheckRecord.count({ where: { patient: { professionalId } } }),
    prisma.anomalyReport.count({ where: { patient: { professionalId } } }),

    // Check results breakdown
    prisma.selfCheckRecord.groupBy({
      by: ["result"],
      where: { patient: { professionalId } },
      _count: { result: true },
    }),

    // Self-checks per month (last 6 months)
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(s.date, 'YYYY-MM') as month, COUNT(*) as count
      FROM "SelfCheckRecord" s
      INNER JOIN "Patient" p ON p.id = s."patientId"
      WHERE p."professionalId" = ${professionalId}
        AND s.date >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `,

    // Anxiety level distribution
    prisma.patient.groupBy({
      by: ["anxietyLevel"],
      where: { professionalId },
      _count: { anxietyLevel: true },
    }),

    // Age range distribution
    prisma.patient.groupBy({
      by: ["ageRange"],
      where: { professionalId },
      _count: { ageRange: true },
    }),
  ]);

  return {
    totalPatients,
    activePatients,
    totalLicenses,
    usedLicenses,
    totalSelfChecks,
    anomalyCount,
    checkResultBreakdown: checkResultBreakdown.map((r) => ({
      result: r.result,
      count: r._count.result,
    })),
    selfChecksByMonth: (selfCheckRecordsByMonth as any[]).map((r) => ({
      month: r.month as string,
      count: Number(r.count),
    })),
    anxietyBreakdown: anxietyBreakdown.map((r) => ({
      level: r.anxietyLevel,
      count: r._count.anxietyLevel,
    })),
    ageRangeBreakdown: ageRangeBreakdown.map((r) => ({
      range: r.ageRange ?? "Inconnu",
      count: r._count.ageRange,
    })),
  };
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const data = await getAnalytics(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
        <p className="text-sm text-gray-500 mt-1">Aperçu de l'engagement et de la santé de vos patientes</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Patientes actives"
          value={data.activePatients}
          sub={`sur ${data.totalPatients}`}
          icon={<Users size={20} />}
          color="rose"
        />
        <StatCard
          label="Licences utilisées"
          value={`${data.usedLicenses}/${data.totalLicenses}`}
          sub={`${data.totalLicenses - data.usedLicenses} disponibles`}
          icon={<Key size={20} />}
          color="blue"
        />
        <StatCard
          label="Auto-examens réalisés"
          value={data.totalSelfChecks}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          label="Signalements d'anomalies"
          value={data.anomalyCount}
          icon={<AlertTriangle size={20} />}
          color="amber"
        />
      </div>

      {/* Charts – client component */}
      <AnalyticsCharts data={data} />
    </div>
  );
}
