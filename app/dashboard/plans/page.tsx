import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, Key, ShoppingCart, Sparkles, RefreshCw } from "lucide-react";
import { PurchasePackButton } from "./UpgradePlanButton";
import { cn } from "@/lib/utils";

// ─── Pricing catalogue ────────────────────────────────────────────────────────

const INITIAL_PACKS = [
  { quantity: 50,   price: 150,  perUnit: 3.00, badge: "" },
  { quantity: 150,  price: 420,  perUnit: 2.80, badge: "Populaire" },
  { quantity: 300,  price: 750,  perUnit: 2.50, badge: "Meilleur rapport" },
  { quantity: 1000, price: 2200, perUnit: 2.20, badge: "" },
] as const;

const RECHARGE_PACKS = [
  { quantity: 50,   price: 140,  perUnit: 2.80 },
  { quantity: 100,  price: 270,  perUnit: 2.70 },
  { quantity: 250,  price: 600,  perUnit: 2.40 },
  { quantity: 1000, price: 2000, perUnit: 2.00 },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const professionalId = session.user.id;

  const [activePatients, totalLicenses] = await Promise.all([
    prisma.patient.count({ where: { professionalId, isActive: true } }),
    prisma.license.count({ where: { pack: { professionalId } } }),
  ]);

  const available = totalLicenses - activePatients;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Licences & Tarifs</h1>
        <p className="text-gray-500 mt-1">
          1 licence = 1 patiente. Achetez un pack de démarrage ou rechargez votre solde.
        </p>
      </div>

      {/* Current usage */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Votre solde actuel</p>
        <div className="flex flex-wrap gap-8">
          <Stat icon={<Key size={18} />}          label="Licences achetées"   value={String(totalLicenses)} />
          <Stat icon={<Users size={18} />}         label="Patientes actives"   value={String(activePatients)} />
          <Stat icon={<ShoppingCart size={18} />}  label="Licences disponibles" value={String(available)} color={available === 0 ? "text-red-600" : "text-gray-900"} />
        </div>
      </div>

      {/* ── Initial packs ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={17} className="text-rose-500" />
          <h2 className="text-base font-bold text-gray-900">Packs de démarrage</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          À utiliser lors de l&apos;ouverture de votre compte ou pour un grand renouvellement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INITIAL_PACKS.map((pack) => (
            <div
              key={pack.quantity}
              className={cn(
                "relative bg-white border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow",
                pack.badge ? "border-rose-200" : "border-gray-200"
              )}
            >
              {pack.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow">
                  {pack.badge}
                </span>
              )}

              <p className="text-3xl font-extrabold text-gray-900 mb-1">{pack.quantity}</p>
              <p className="text-sm text-gray-500 mb-4">licences</p>

              <div className="mb-1">
                <span className="text-xl font-bold text-rose-600">{pack.price} €</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{pack.perUnit.toFixed(2)} € / licence</p>

              <PurchasePackButton
                quantity={pack.quantity}
                price={pack.price}
                label={`Acheter — ${pack.price} €`}
                colorClass={pack.badge ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-gray-900 hover:bg-gray-700 text-white"}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Recharge packs ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={16} className="text-blue-500" />
          <h2 className="text-base font-bold text-gray-900">Recharges</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Vous manquez de licences ? Rechargez votre solde sans repartir de zéro.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RECHARGE_PACKS.map((pack) => (
            <div
              key={pack.quantity}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-semibold text-blue-600 mb-1">+{pack.quantity} licences</p>
              <div className="mb-1">
                <span className="text-xl font-bold text-gray-900">{pack.price} €</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{pack.perUnit.toFixed(2)} € / licence</p>

              <PurchasePackButton
                quantity={pack.quantity}
                price={pack.price}
                label={`Recharger — ${pack.price} €`}
                colorClass="bg-blue-600 hover:bg-blue-500 text-white"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center pb-4">
        * Intégration Stripe à venir. Les licences sont créées immédiatement dans votre tableau de bord.
      </p>
    </div>
  );
}

function Stat({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className={cn("text-xl font-bold leading-none", color ?? "text-gray-900")}>{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

