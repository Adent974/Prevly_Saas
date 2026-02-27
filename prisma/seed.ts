/**
 * prisma/seed.ts
 * Creates a demo professional account + sample data for testing.
 * Run with: npx prisma db seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database…");

  // ── Clean up existing demo data so re-runs are idempotent ──────────────────
  const existing = await prisma.professional.findUnique({ where: { email: "demo@prevly.fr" } });
  if (existing) {
    // Delete in dependency order
    await prisma.appointment.deleteMany({ where: { professionalId: existing.id } });
    await prisma.anomalyReport.deleteMany({ where: { patient: { professionalId: existing.id } } });
    await prisma.selfCheckRecord.deleteMany({ where: { patient: { professionalId: existing.id } } });
    await prisma.patient.deleteMany({ where: { professionalId: existing.id } });
    await prisma.license.deleteMany({ where: { pack: { professionalId: existing.id } } });
    await prisma.licensePack.deleteMany({ where: { professionalId: existing.id } });
  }

  // ── Demo professional ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Prevly2024!", 12);

  const professional = await prisma.professional.upsert({
    where: { email: "demo@prevly.fr" },
    update: {},
    create: {
      email: "demo@prevly.fr",
      passwordHash,
      name: "Dr. Sophie Martin",
      specialty: "Gynécologie",
      organizationName: "Cabinet Santé Femme",
      phone: "+33 1 23 45 67 89",
    },
  });

  console.log(`✅ Professional: ${professional.email}`);

  // ── Pack 2 : 150 licences à 420 € (offre cabinet type) ──────────────────────
  // 1 licence = 1 patiente. Le pack de démarrage inclut 150 licences.
  const PACK_QUANTITY = 150;
  const PACK_PRICE    = 420;

  const pack = await prisma.licensePack.create({
    data: {
      professionalId: professional.id,
      quantity: PACK_QUANTITY,
      priceEuros: PACK_PRICE,
    },
  });

  // Create all 150 license rows
  const licenses = await Promise.all(
    Array.from({ length: PACK_QUANTITY }).map(() =>
      prisma.license.create({ data: { packId: pack.id } })
    )
  );

  console.log(`✅ Pack 2 : ${licenses.length} licences créées (420 €)`);

  // ── 2 patients – consume the first 2 licences ───────────────────────────────
  const patients = await Promise.all(
    [
      {
        name: "Marie Dupont",
        email: "marie@example.com",
        ageRange: "23-26",
        familyHistory: false,
        anxietyLevel: "LOW" as const,
        licenseId: licenses[0].id,
      },
      {
        name: "Léa Bernard",
        email: "lea@example.com",
        ageRange: "18-22",
        familyHistory: true,
        anxietyLevel: "HIGH" as const,
        licenseId: licenses[1].id,
      },
    ].map((p) =>
      prisma.patient.create({
        data: {
          ...p,
          professionalId: professional.id,
        },
      })
    )
  );

  // Update license statuses
  await Promise.all(
    [licenses[0].id, licenses[1].id].map((id) =>
      prisma.license.update({
        where: { id },
        data: { status: "ACTIVE", assignedAt: new Date() },
      })
    )
  );

  await prisma.licensePack.update({
    where: { id: pack.id },
    data: { usedCount: 2 }, // 2 licences actives sur 150
  });

  console.log(`✅ ${patients.length} patients created`);

  // Add self-check records for Marie
  const checkDates = [
    new Date("2025-09-15"),
    new Date("2025-10-14"),
    new Date("2025-11-12"),
    new Date("2025-12-10"),
    new Date("2026-01-11"),
    new Date("2026-02-15"),
  ];

  await prisma.selfCheckRecord.createMany({
    data: checkDates.map((date, i) => ({
      patientId: patients[0].id,
      date,
      result: i === 3 ? "ANOMALY" : "NORMAL",
    })),
  });

  // Add an anomaly report for Marie
  await prisma.anomalyReport.create({
    data: {
      patientId: patients[0].id,
      types: ["LUMP", "PAIN"],
      duration: "Depuis environ 2 semaines",
      generatedSummary:
        "Patiente signale la découverte d'une zone sensible et d'un léger épaississement dans le quadrant supéro-externe droit. Consultation médicale recommandée.",
    },
  });

  // Add appointment
  await prisma.appointment.create({
    data: {
      patientId: patients[0].id,
      professionalId: professional.id,
      title: "Consultation gynécologique de suivi",
      doctorName: "Dr. Sophie Martin",
      specialty: "Gynécologie",
      scheduledAt: new Date("2026-03-10T14:00:00"),
      type: "SUGGESTED",
      status: "SCHEDULED",
      notes: "Suite au signalement d'anomalie du 10 décembre.",
    },
  });

  console.log("✅ Sample data created");
  console.log("");
  console.log("🔐 Demo login:");
  console.log("   Email:    demo@prevly.fr");
  console.log("   Password: Prevly2024!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
