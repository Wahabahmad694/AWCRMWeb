"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPaisa } from "@/lib/display";

export function SalesChart({ points }: { points: { label: string; value: number }[] }) {
  return <div className="sales-chart" role="img" aria-label={`Sales trend across ${points.length} periods. ${points.every(point => point.value === 0) ? "No sales recorded in this period." : "Details are available in the data table below."}`}>
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
        <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3578f6" stopOpacity={0.22} /><stop offset="100%" stopColor="#3578f6" stopOpacity={0.01} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e8edf5" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7a879b", fontSize: 11 }} minTickGap={36} tickFormatter={label => String(label).slice(5)} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7a879b", fontSize: 11 }} width={62} tickFormatter={value => new Intl.NumberFormat("en", { notation: "compact" }).format(Number(value) / 100)} domain={[0, (maximum: number) => maximum === 0 ? 10000 : maximum]} />
        <Tooltip formatter={value => [formatPaisa(Number(value)), "Net sales"]} contentStyle={{ borderRadius: 12, border: "1px solid #e5eaf2", fontSize: 12 }} />
        <Area type="monotone" dataKey="value" stroke="#3578f6" strokeWidth={2.5} fill="url(#sales-fill)" isAnimationActive={false} dot={points.length === 1 ? { r: 4 } : false} />
      </AreaChart>
    </ResponsiveContainer>
    <details className="chart-data"><summary>View sales data</summary><table><caption className="sr-only">Sales by period</caption><thead><tr><th scope="col">Period</th><th scope="col">Net sales</th></tr></thead><tbody>{points.map((point, index) => <tr key={index}><td>{point.label}</td><td>{formatPaisa(point.value)}</td></tr>)}</tbody></table></details>
  </div>;
}
