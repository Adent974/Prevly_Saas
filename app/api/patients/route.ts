import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/patients – list all patients for the authenticated professional
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patients = await prisma.patient.findMany({
    where: { professionalId: session.user.id },
    include: {
      license: true,
      _count: { select: { selfCheckRecords: true, anomalyReports: true, appointments: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(patients);
}

// POST /api/patients – assign an existing license to a new patient
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, ageRange, familyHistory, anxietyLevel, licenseKey } = body;

  // Find the license key belonging to this professional
  const license = await prisma.license.findFirst({
    where: {
      licenseKey,
      status: "AVAILABLE",
      pack: { professionalId: session.user.id },
    },
    include: { pack: true },
  });

  if (!license) {
    return NextResponse.json({ error: "License key invalid or already used" }, { status: 400 });
  }

  const patient = await prisma.$transaction(async (tx) => {
    const p = await tx.patient.create({
      data: {
        name,
        email,
        ageRange,
        familyHistory: familyHistory ?? false,
        anxietyLevel: anxietyLevel ?? "LOW",
        professionalId: session.user.id,
        licenseId: license.id,
      },
    });
    await tx.license.update({
      where: { id: license.id },
      data: { status: "ACTIVE", assignedAt: new Date(), patient: undefined },
    });
    await tx.licensePack.update({
      where: { id: license.packId },
      data: { usedCount: { increment: 1 } },
    });
    return p;
  });

  return NextResponse.json(patient, { status: 201 });
}
