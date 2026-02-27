import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/mobile/sync
 * Called by the Prevly Android app to sync patient data to the SaaS backend.
 * Authenticated using the patient's license key (sent as Bearer token).
 *
 * Body: {
 *   selfCheckRecords?: { date: string, result: "NORMAL"|"ANOMALY"|"UNSURE" }[]
 *   anomalyReports?:   { types: string[], duration?: string, generatedSummary?: string }[]
 *   appointments?:     { title: string, doctorName?: string, specialty?: string, scheduledAt: string, type?: string, status?: string, notes?: string }[]
 *   profile?:          { name?: string, ageRange?: string, familyHistory?: boolean, anxietyLevel?: string }
 * }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const licenseKey = authHeader?.replace("Bearer ", "").trim();

  if (!licenseKey) {
    return NextResponse.json({ error: "Missing license key" }, { status: 401 });
  }

  // Find the license and associated patient
  const license = await prisma.license.findUnique({
    where: { licenseKey },
    include: { patient: true },
  });

  if (!license || license.status !== "ACTIVE" || !license.patient) {
    return NextResponse.json({ error: "Invalid or inactive license" }, { status: 403 });
  }

  const patientId = license.patient.id;
  const body = await req.json();

  await prisma.$transaction(async (tx) => {
    // Update last seen
    await tx.patient.update({
      where: { id: patientId },
      data: { lastSeenAt: new Date() },
    });

    // Sync profile data
    if (body.profile) {
      const { name, ageRange, familyHistory, anxietyLevel } = body.profile;
      await tx.patient.update({
        where: { id: patientId },
        data: {
          ...(name !== undefined && { name }),
          ...(ageRange !== undefined && { ageRange }),
          ...(familyHistory !== undefined && { familyHistory }),
          ...(anxietyLevel !== undefined && { anxietyLevel }),
        },
      });
    }

    // Sync self-check records
    if (body.selfCheckRecords?.length) {
      await tx.selfCheckRecord.createMany({
        data: body.selfCheckRecords.map((r: any) => ({
          patientId,
          date: new Date(r.date),
          result: r.result ?? "NORMAL",
        })),
        skipDuplicates: true,
      });
    }

    // Sync anomaly reports
    if (body.anomalyReports?.length) {
      await tx.anomalyReport.createMany({
        data: body.anomalyReports.map((r: any) => ({
          patientId,
          types: r.types ?? [],
          duration: r.duration,
          generatedSummary: r.generatedSummary,
        })),
      });
    }

    // Sync appointments
    if (body.appointments?.length) {
      await tx.appointment.createMany({
        data: body.appointments.map((a: any) => ({
          patientId,
          professionalId: license.patient!.professionalId,
          title: a.title,
          doctorName: a.doctorName,
          specialty: a.specialty,
          scheduledAt: new Date(a.scheduledAt),
          type: a.type ?? "VOLUNTARY",
          status: a.status ?? "SCHEDULED",
          notes: a.notes,
        })),
      });
    }
  });

  return NextResponse.json({ success: true, patientId });
}
