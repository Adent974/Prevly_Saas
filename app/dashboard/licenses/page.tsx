import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { Key, Copy } from "lucide-react";
import { formatDate, licenseStatusLabel } from "@/lib/utils";
import { BuyLicensesButton } from "./BuyLicensesButton";
import { CopyButton } from "./CopyButton";

export default async function LicensesPage() {
  const session = await getServerSession(authOptions);

  const packs = await prisma.licensePack.findMany({
    where: { professionalId: session!.user.id },
    include: {
      licenses: {
        include: {
          patient: { select: { id: true, name: true, email: true, isActive: true } },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  // Count from actual License rows — same source of truth as dashboard & plans pages
  const totalLicenses = packs.reduce((s, p) => s + p.licenses.length, 0);
  const usedLicenses  = packs.reduce((s, p) => s + p.licenses.filter((l) => l.status === "ACTIVE").length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licences</h1>
          <p className="text-sm text-gray-500 mt-1">
            {usedLicenses}/{totalLicenses} licences utilisées
          </p>
        </div>
        <BuyLicensesButton />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{totalLicenses}</p>
          <p className="text-sm text-gray-500 mt-1">Total licences</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{usedLicenses}</p>
          <p className="text-sm text-gray-500 mt-1">Actives</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">{totalLicenses - usedLicenses}</p>
          <p className="text-sm text-gray-500 mt-1">Disponibles</p>
        </Card>
      </div>

      {/* Packs */}
      {packs.length === 0 ? (
        <Card className="text-center py-16">
          <Key size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Vous n'avez pas encore de licences.</p>
          <p className="text-sm text-gray-400 mt-1">Achetez un pack pour commencer à distribuer Prevly.</p>
        </Card>
      ) : (
        packs.map((pack) => {
          const packTotal  = pack.licenses.length;
          const packActive = pack.licenses.filter((l) => l.status === "ACTIVE").length;
          return (
          <Card key={pack.id}>
            {/* Pack header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">
                  Pack de {packTotal} licence{packTotal > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Acheté {formatDate(pack.purchasedAt)} · {pack.priceEuros.toFixed(2)} €
                  {pack.expiresAt && ` · Expire ${formatDate(pack.expiresAt)}`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700">
                  {packActive}/{packTotal} utilisées
                </span>
                <div className="w-32 bg-gray-100 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-rose-400 h-1.5 rounded-full"
                    style={{ width: packTotal > 0 ? `${(packActive / packTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>

            {/* Licenses table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <tr>
                    <th className="py-2 pr-4 text-left">Clé de licence</th>
                    <th className="py-2 pr-4 text-left">Statut</th>
                    <th className="py-2 pr-4 text-left">Patiente</th>
                    <th className="py-2 pr-4 text-left">Attribuée</th>
                    <th className="py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pack.licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">
                            {lic.licenseKey}
                          </code>
                          <CopyButton value={lic.licenseKey} />
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant={
                            lic.status === "ACTIVE"
                              ? "green"
                              : lic.status === "REVOKED"
                              ? "red"
                              : lic.status === "EXPIRED"
                              ? "amber"
                              : "blue"
                          }
                        >
                          {licenseStatusLabel(lic.status)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        {lic.patient ? (
                          <span className="text-gray-700">
                            {lic.patient.name ?? lic.patient.email ?? "—"}
                          </span>
                        ) : (
                          <span className="text-gray-400">Non attribuée</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">
                        {lic.assignedAt ? formatDate(lic.assignedAt) : "—"}
                      </td>
                      <td className="py-2.5">
                        {lic.status === "AVAILABLE" && (
                          <span className="text-xs text-blue-500">Prête à distribuer</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          );
        })
      )}
    </div>
  );
}
