export function pkrToPaisa(input: string): number | null {
  const clean = input.trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(clean)) return null;
  const [rupees, fraction = ""] = clean.split(".");
  const result = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(result) ? result : null;
}

export function formatPkr(paisa: number): string {
  return `Rs ${(paisa / 100).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function karachiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }).format(date);
}
