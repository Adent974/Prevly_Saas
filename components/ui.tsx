import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: "rose" | "blue" | "green" | "amber" | "purple";
  className?: string;
}

const colorMap = {
  rose:   { bg: "bg-rose-50",   icon: "text-rose-500",  value: "text-rose-600" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-500",  value: "text-blue-600" },
  green:  { bg: "bg-green-50",  icon: "text-green-500", value: "text-green-600" },
  amber:  { bg: "bg-amber-50",  icon: "text-amber-500", value: "text-amber-600" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500",value: "text-purple-600" },
};

export function StatCard({ label, value, sub, icon, color = "rose", className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4", className)}>
      {icon && (
        <div className={cn("p-3 rounded-xl", c.bg)}>
          <span className={c.icon}>{icon}</span>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={cn("text-3xl font-bold mt-1", c.value)}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-5", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "gray" | "green" | "red" | "amber" | "rose" | "blue";
}) {
  const variants = {
    gray:  "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    red:   "bg-red-100  text-red-700",
    amber: "bg-amber-100 text-amber-700",
    rose:  "bg-rose-100 text-rose-700",
    blue:  "bg-blue-100 text-blue-700",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant])}>
      {children}
    </span>
  );
}
