export function buildWaUrl(phoneE164: string, text: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  if (!/^92\d{10}$/.test(digits)) throw new Error("Enter a valid Pakistani mobile number.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatPhonePk(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return /^92\d{10}$/.test(digits) ? `+92 ${digits.slice(2, 5)} ${digits.slice(5)}` : e164;
}
