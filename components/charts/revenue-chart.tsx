"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface RevenueChartProps {
  data: { date: string; amount: number }[]
  currency?: string
  label?: string
}

export function RevenueChart({ data, currency = "SLE", label }: RevenueChartProps) {
  const isCurrency = !label
  const currencySymbol = currency === "USD" ? "$" : "Le"

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#51bdce" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#51bdce" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#888" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            isCurrency ? `${currencySymbol}${(v / 1000).toFixed(0)}k` : `${v}`
          }
        />
        <Tooltip
          formatter={(value) =>
            isCurrency
              ? [`${currencySymbol}${Number(value).toLocaleString()}`, "Revenue"]
              : [Number(value).toLocaleString(), label ?? "Visits"]
          }
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#51bdce"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
