import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { UpdateProfileForm } from "./UpdateProfileForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  const professional = await prisma.professional.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true, name: true, email: true, specialty: true,
      organizationName: true, phone: true, address: true,
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez votre profil professionnel</p>
      </div>

      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Informations du compte</h2>
        <UpdateProfileForm professional={professional!} />
      </Card>

      {/* API Integration section */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-2">Intégration mobile</h2>
        <p className="text-sm text-gray-500 mb-4">
          Le SDK mobile Prevly utilise votre <strong>clé de licence</strong> comme token
          d'authentification pour synchroniser les données des patientes vers ce dashboard.
          Aucune configuration supplémentaire n'est nécessaire.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm font-mono text-gray-700 border border-gray-200">
          <span className="text-gray-400">POST </span>
          <span className="text-rose-600">https://votre-domaine.com/api/mobile/sync</span>
          <br />
          <span className="text-gray-400">Authorization: </span>
          <span className="text-blue-600">Bearer {"<clé-de-licence>"}</span>
        </div>
      </Card>
    </div>
  );
}
