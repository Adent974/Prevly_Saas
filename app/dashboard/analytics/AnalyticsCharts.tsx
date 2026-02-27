"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui";

const RESULT_COLORS: Record<string, string> = {
  NORMAL:  "#22c55e",
  ANOMALY: "#ef4444",
  UNSURE:  "#f59e0b",
};

const RESULT_LABELS: Record<string, string> = {
  NORMAL:  "Normal",
  ANOMALY: "Anomalie",
  UNSURE:  "Incertain",
};

const ANXIETY_COLORS: Record<string, string> = {
  LOW:    "#86efac",
  MEDIUM: "#fcd34d",
  HIGH:   "#f87171",
};

const ANXIETY_LABELS: Record<string, string> = {
  LOW:    "Faible",
  MEDIUM: "Moyen",
  HIGH:   "Élevé",
};

interface AnalyticsData {
  selfChecksByMonth:   { month: string; count: number }[];
  checkResultBreakdown:{ result: string; count: number }[];
  anxietyBreakdown:    { level: string; count: number }[];
  ageRangeBreakdown:   { range: string; count: number }[];
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const resultPieData = data.checkResultBreakdown.map((r) => ({
    name:  RESULT_LABELS[r.result] ?? r.result,
    value: r.count,
    color: RESULT_COLORS[r.result] ?? "#94a3b8",
  }));

  const anxietyPieData = data.anxietyBreakdown.map((r) => ({
    name:  ANXIETY_LABELS[r.level] ?? r.level,
    value: r.count,
    color: ANXIETY_COLORS[r.level] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* Self-checks per month */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Auto-examens par mois (6 derniers mois)</h3>
        {data.selfChecksByMonth.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Pas encore de données.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.selfChecksByMonth} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="count" name="Auto-examens" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Results breakdown */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Résultats des auto-examens</h3>
          {resultPieData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Pas de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={resultPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {resultPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Anxiety levels */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Niveaux d'anxiété</h3>
          {anxietyPieData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Pas de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={anxietyPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {anxietyPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Age range */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Tranche d'âge</h3>
          {data.ageRangeBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Pas de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.ageRangeBreakdown}
                layout="vertical"
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="count" name="Patientes" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
