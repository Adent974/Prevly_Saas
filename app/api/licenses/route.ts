import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/licenses – list all license packs with their licenses
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packs = await prisma.licensePack.findMany({
    where: { professionalId: session.user.id },
    include: {
      licenses: {
        include: { patient: { select: { id: true, name: true, email: true, isActive: true } } },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  return NextResponse.json(packs);
}

// POST /api/licenses – create a new license pack (simulate a purchase)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { quantity, priceEuros, expiresAt } = body;

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "quantity must be >= 1" }, { status: 400 });
  }

  const pack = await prisma.$transaction(async (tx) => {
    const p = await tx.licensePack.create({
      data: {
        professionalId: session.user.id,
        quantity,
        priceEuros: priceEuros ?? 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    // Create individual license entries
    await tx.license.createMany({
      data: Array.from({ length: quantity }).map(() => ({
        packId: p.id,
      })),
    });
    return p;
  });

  const packWithLicenses = await prisma.licensePack.findUnique({
    where: { id: pack.id },
    include: { licenses: true },
  });

  return NextResponse.json(packWithLicenses, { status: 201 });
}
