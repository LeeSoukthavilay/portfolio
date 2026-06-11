const SERVICE_URLS: Record<string, string> = {
  ai: process.env.AI_SERVICE_URL || "http://localhost:8000",
  trade: process.env.TRADE_BACKEND_URL || "http://localhost:4001",
  payment: process.env.PAYMENT_BACKEND_URL || "http://localhost:4002",
  ecom: process.env.ECOM_BACKEND_URL || "http://localhost:4003",
  telemed: process.env.TELEMED_BACKEND_URL || "http://localhost:4004",
};

export async function bffFetch(
  service: string,
  path: string,
  options?: RequestInit
) {
  const baseUrl = SERVICE_URLS[service];
  if (!baseUrl) throw new Error(`Unknown service: ${service}`);
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`BFF error: ${service} returned ${res.status}`);
  return res.json();
}
