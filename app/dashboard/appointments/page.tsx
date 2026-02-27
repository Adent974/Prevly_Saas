import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { Calendar, Clock } from "lucide-react";
import { formatDateTime, appointmentStatusLabel } from "@/lib/utils";
import Link from "next/link";

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        professionalId: session!.user.id,
        scheduledAt: { gte: new Date() },
        status: "SCHEDULED",
      },
      include: { patient: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        professionalId: session!.user.id,
        OR: [
          { scheduledAt: { lt: new Date() } },
          { status: { in: ["COMPLETED", "CANCELLED"] } },
        ],
      },
      include: { patient: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 30,
    }),
  ]);

  function AppointmentRow({ a }: { a: (typeof upcoming)[0] }) {
    return (
      <div className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">{a.title}</p>
            <p className="text-xs text-gray-500">
              <Link href={`/dashboard/patients/${a.patient.id}`} className="hover:text-rose-500">
                {a.patient.name ?? a.patient.email ?? "Anonyme"}
              </Link>
              {a.doctorName && ` · ${a.doctorName}`}
              {a.specialty && ` · ${a.specialty}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{formatDateTime(a.scheduledAt)}</span>
          <Badge
            variant={
              a.status === "COMPLETED"
                ? "green"
                : a.status === "CANCELLED"
                ? "red"
                : "blue"
            }
          >
            {appointmentStatusLabel(a.status)}
          </Badge>
          {a.type === "SUGGESTED" && (
            <Badge variant="rose">Suggéré</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
        <p className="text-sm text-gray-500 mt-1">
          {upcoming.length} rendez-vous à venir
        </p>
      </div>

      {/* Upcoming */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900">À venir</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {upcoming.length}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Aucun rendez-vous à venir.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcoming.map((a) => (
              <AppointmentRow key={a.id} a={a} />
            ))}
          </div>
        )}
      </Card>

      {/* Past */}
      {past.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Historique</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {past.map((a) => (
              <AppointmentRow key={a.id} a={a} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
