import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { Users, Search } from "lucide-react";
import Link from "next/link";
import { formatDate, anxietyLabel } from "@/lib/utils";
import { RevokePatientButton } from "./RevokePatientButton";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  const query = searchParams.q ?? "";
  const statusFilter = searchParams.status;

  const patients = await prisma.patient.findMany({
    where: {
      professionalId: session!.user.id,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(statusFilter === "active"
        ? { isActive: true }
        : statusFilter === "revoked"
        ? { isActive: false }
        : {}),
    },
    include: {
      license: { select: { status: true, licenseKey: true } },
      _count: { select: { selfCheckRecords: true, anomalyReports: true, appointments: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {patients.length} patiente{patients.length !== 1 ? "s" : ""} enregistrée{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Ajouter une patiente
        </Link>
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Rechercher par nom ou email…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
          >
            <option value="">Toutes</option>
            <option value="active">Actives</option>
            <option value="revoked">Révoquées</option>
          </select>
          <button
            type="submit"
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Filtrer
          </button>
        </form>
      </Card>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        {patients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune patiente trouvée.</p>
            <Link
              href="/dashboard/patients/new"
              className="inline-block mt-3 text-sm text-rose-500 hover:underline"
            >
              Ajouter la première patiente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Patiente</th>
                  <th className="px-5 py-3 text-left">Âge</th>
                  <th className="px-5 py-3 text-left">Anxiété</th>
                  <th className="px-5 py-3 text-left">Auto-examens</th>
                  <th className="px-5 py-3 text-left">Signalements</th>
                  <th className="px-5 py-3 text-left">RDV</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-left">Inscrite</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/patients/${p.id}`} className="flex items-center gap-3 hover:text-rose-600">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-semibold text-sm">
                          {p.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.name ?? "Anonyme"}</p>
                          <p className="text-xs text-gray-400">{p.email ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{p.ageRange ? `${p.ageRange} ans` : "—"}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          p.anxietyLevel === "HIGH" ? "red" : p.anxietyLevel === "MEDIUM" ? "amber" : "green"
                        }
                      >
                        {anxietyLabel(p.anxietyLevel)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-medium">{p._count.selfCheckRecords}</td>
                    <td className="px-5 py-3.5">
                      {p._count.anomalyReports > 0 ? (
                        <Badge variant="amber">{p._count.anomalyReports}</Badge>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{p._count.appointments}</td>
                    <td className="px-5 py-3.5">
                      {p.isActive ? (
                        <Badge variant="green">Active</Badge>
                      ) : (
                        <Badge variant="red">Révoquée</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(p.joinedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/patients/${p.id}`}
                          className="text-xs font-medium text-rose-500 hover:underline"
                        >
                          Voir
                        </Link>
                        <RevokePatientButton
                          patientId={p.id}
                          isActive={p.isActive}
                          patientName={p.name ?? "cette patiente"}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
