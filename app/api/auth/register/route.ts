import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/auth/register – professional self-registration
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, organizationName, specialty, phone } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.professional.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const professional = await prisma.professional.create({
    data: {
      name,
      email,
      passwordHash,
      organizationName,
      specialty,
      phone,
    },
    select: { id: true, name: true, email: true, specialty: true, createdAt: true },
  });

  return NextResponse.json(professional, { status: 201 });
}
