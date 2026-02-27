import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/professionals/[id] – update own profile
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== params.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, specialty, organizationName, phone, address } = body;

  const updated = await prisma.professional.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(specialty !== undefined && { specialty }),
      ...(organizationName !== undefined && { organizationName }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
    },
    select: { id: true, name: true, email: true, specialty: true, organizationName: true },
  });

  return NextResponse.json(updated);
}
