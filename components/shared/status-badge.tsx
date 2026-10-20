const positive = new Set(["active", "paid", "completed", "confirmed", "delivered", "fulfilled", "approved"]);
const pending = new Set(["pending", "draft", "unpaid", "partial", "partially_paid", "in_progress", "scheduled"]);
const negative = new Set(["cancelled", "canceled", "overdue", "failed", "inactive", "rejected", "refunded"]);

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replaceAll(" ", "_");
  const tone = positive.has(normalized) ? "positive" : pending.has(normalized) ? "pending" : negative.has(normalized) ? "negative" : "neutral";
  if (value === "—") return <span>{value}</span>;
  return <span className={`status-badge status-${tone}`}><span />{value.replaceAll("_", " ")}</span>;
}
