import { useState, useCallback } from "react";
import type { PaymentResponse } from "@portfolio/shared-types";

const API_URL = "http://localhost:4002";

function generateIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function PaymentForm() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const parsed = Math.round(parseFloat(amount) * 100);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    const idempotencyKey = generateIdempotencyKey();
    setSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          amount: parsed,
          currency,
          source: "payment-frontend",
          description: `Payment of ${parsed / 100} ${currency}`,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Server error: ${res.status}`);
      }

      const data: PaymentResponse = await res.json();
      setResponse(data);
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }, [amount, currency]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface-elevated rounded-lg border border-gray-700 p-6">
        {/* Amount */}
        <label className="block mb-1.5 text-sm font-medium text-text">Amount</label>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">
            {currency === "USD" ? "$" : currency === "THB" ? "฿" : "€"}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-md text-text text-sm font-mono focus:outline-none focus:border-brand-500"
            placeholder="0.00"
          />
        </div>

        {/* Currency */}
        <label className="block mb-1.5 text-sm font-medium text-text">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full mb-6 px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-md text-text text-sm focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
        >
          <option value="USD">USD -- US Dollar</option>
          <option value="THB">THB -- Thai Baht</option>
          <option value="EUR">EUR -- Euro</option>
        </select>

        {/* Pay Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-md text-sm font-semibold text-white transition-colors ${
            submitting
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          {submitting ? "Processing..." : "Pay Now"}
        </button>

        {/* Success */}
        {response && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-400 text-xs font-semibold mb-1">Payment Successful</p>
            <p className="text-green-300 text-xs font-mono">
              Transaction ID: {response.transactionId}
            </p>
            <p className="text-green-300 text-xs font-mono">
              Status: {response.status}
            </p>
            <p className="text-green-300/70 text-xs font-mono mt-1">
              {new Date(response.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-text">Payment Gateway</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <PaymentForm />
      </main>
    </div>
  );
}
