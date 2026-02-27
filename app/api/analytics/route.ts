import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/analytics – aggregated stats for the professional dashboard
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const professionalId = session.user.id;

  const [
    totalPatients,
    activePatients,
    totalLicenses,
    usedLicenses,
    totalSelfChecks,
    anomalyCount,
    upcomingAppointments,
    recentAnomalies,
    selfChecksByMonth,
    checkResultBreakdown,
  ] = await Promise.all([
    // Total patients
    prisma.patient.count({ where: { professionalId } }),

    // Active patients
    prisma.patient.count({ where: { professionalId, isActive: true } }),

    // Total licenses across all packs
    prisma.license.count({ where: { pack: { professionalId } } }),

    // Used (active) licenses
    prisma.license.count({ where: { pack: { professionalId }, status: "ACTIVE" } }),

    // Total self-checks
    prisma.selfCheckRecord.count({ where: { patient: { professionalId } } }),

    // Anomaly reports
    prisma.anomalyReport.count({ where: { patient: { professionalId } } }),

    // Upcoming appointments (next 30 days)
    prisma.appointment.count({
      where: {
        professionalId,
        status: "SCHEDULED",
        scheduledAt: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),

    // Recent anomaly reports (last 5)
    prisma.anomalyReport.findMany({
      where: { patient: { professionalId } },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { reportedAt: "desc" },
      take: 5,
    }),

    // Self-checks grouped by month (last 6 months) – raw query
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date, 'YYYY-MM') as month, COUNT(*) as count
      FROM "SelfCheckRecord"
      WHERE "patientId" IN (
        SELECT id FROM "Patient" WHERE "professionalId" = ${professionalId}
      )
      AND date >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `,

    // Self-check results breakdown
    prisma.selfCheckRecord.groupBy({
      by: ["result"],
      where: { patient: { professionalId } },
      _count: { result: true },
    }),
  ]);

  return NextResponse.json({
    totalPatients,
    activePatients,
    totalLicenses,
    usedLicenses,
    availableLicenses: totalLicenses - usedLicenses,
    totalSelfChecks,
    anomalyCount,
    upcomingAppointments,
    recentAnomalies,
    selfChecksByMonth: selfChecksByMonth.map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
    checkResultBreakdown: checkResultBreakdown.map((r) => ({
      result: r.result,
      count: r._count.result,
    })),
  });
}
