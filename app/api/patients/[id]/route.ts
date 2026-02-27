import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/patients/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, professionalId: session.user.id },
    include: {
      license: true,
      selfCheckRecords: { orderBy: { date: "desc" }, take: 20 },
      anomalyReports: { orderBy: { reportedAt: "desc" }, take: 20 },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 20 },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(patient);
}

// PATCH /api/patients/[id] – update patient info or revoke access
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ...data } = body;

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, professionalId: session.user.id },
    include: { license: true },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Revoke access
  if (action === "revoke") {
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.patient.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      if (patient.licenseId) {
        await tx.license.update({
          where: { id: patient.licenseId },
          data: { status: "REVOKED", revokedAt: new Date() },
        });
        await tx.licensePack.update({
          where: { id: patient.license!.packId },
          data: { usedCount: { decrement: 1 } },
        });
      }
      return p;
    });
    return NextResponse.json(updated);
  }

  // Restore access
  if (action === "restore") {
    const updated = await prisma.patient.update({
      where: { id: params.id },
      data: { isActive: true },
    });
    return NextResponse.json(updated);
  }

  // Generic field update
  const updated = await prisma.patient.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}
