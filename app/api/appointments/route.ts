import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  const appointments = await prisma.appointment.findMany({
    where: {
      professionalId: session.user.id,
      ...(patientId ? { patientId } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(appointments);
}

// POST /api/appointments – create an appointment for a patient
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { patientId, title, doctorName, specialty, scheduledAt, type, status, notes } = body;

  // Verify the patient belongs to this professional
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId: session.user.id },
  });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      professionalId: session.user.id,
      title,
      doctorName,
      specialty,
      scheduledAt: new Date(scheduledAt),
      type: type ?? "VOLUNTARY",
      status: status ?? "SCHEDULED",
      notes,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
