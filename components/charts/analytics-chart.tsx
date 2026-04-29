"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"

interface AnalyticsChartProps {
  data: { date: string; revenue: number }[]
  currency?: string
}

export function AnalyticsChart({ data, currency = "SLE" }: AnalyticsChartProps) {
  const sym = currency === "USD" ? "$" : "Le"

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#51bdce" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#51bdce" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value, name) =>
            name === "revenue"
              ? [`${sym}${Number(value).toLocaleString()}`, "Revenue"]
              : [value, "Orders"]
          }
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#51bdce"
          strokeWidth={2}
          fill="url(#analyticsGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface OrdersChartProps {
  data: { date: string; completed: number; pending: number; failed: number }[]
}

export function OrdersChart({ data }: OrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="completed" fill="#51bdce" stackId="a" radius={[0, 0, 0, 0]} />
        <Bar dataKey="pending" fill="#f59e0b" stackId="a" />
        <Bar dataKey="failed" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
