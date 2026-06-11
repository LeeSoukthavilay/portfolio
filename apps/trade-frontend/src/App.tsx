import { useState, useEffect, useCallback, useRef } from "react";
import type { OrderBook, OrderBookLevel, WebSocketMessage } from "@portfolio/shared-types";

const WS_URL = "ws://localhost:4001/ws";
const API_URL = "http://localhost:4001";

interface OrderFormData {
  side: "buy" | "sell";
  price: string;
  quantity: string;
}

function useOrderBook() {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: "subscribe", symbol: "ALL" } satisfies WebSocketMessage));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          if (msg.type === "orderbook") {
            setOrderBook(msg.data);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  return { orderBook, connected };
}

function OrderBookLevelRow({ level, maxQuantity, type }: { level: OrderBookLevel; maxQuantity: number; type: "bid" | "ask" }) {
  const barWidth = maxQuantity > 0 ? (level.quantity / maxQuantity) * 100 : 0;
  const barColor = type === "bid" ? "bg-green-500/20" : "bg-red-500/20";

  return (
    <div className="relative flex items-center px-3 py-1 text-sm font-mono">
      <div
        className={`absolute inset-0 ${barColor}`}
        style={{ width: `${barWidth}%` }}
      />
      <span className={`relative z-10 w-24 text-right ${type === "bid" ? "text-green-400" : "text-red-400"}`}>
        {level.price.toFixed(2)}
      </span>
      <span className="relative z-10 w-24 text-right text-text-muted">{level.quantity.toFixed(4)}</span>
      <span className="relative z-10 w-20 text-right text-text-subtle text-xs">{level.orderCount}</span>
    </div>
  );
}

function OrderBookView({ orderBook }: { orderBook: OrderBook }) {
  if (!orderBook) {
    return <div className="p-6 text-text-muted text-center">Waiting for order book data...</div>;
  }

  const maxAskQty = Math.max(...orderBook.asks.map((l) => l.quantity), 0);
  const maxBidQty = Math.max(...orderBook.bids.map((l) => l.quantity), 0);
  const maxQty = Math.max(maxAskQty, maxBidQty);

  return (
    <div className="bg-surface-elevated rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50">
        <h2 className="text-sm font-semibold text-text">Order Book</h2>
        <span className="text-xs text-text-subtle font-mono">
          Updated {new Date(orderBook.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_1fr] divide-x divide-gray-700">
        {/* Asks */}
        <div>
          <div className="flex items-center px-3 py-1.5 text-xs font-semibold text-text-muted border-b border-gray-700 bg-gray-800/30">
            <span className="w-24 text-right">Price</span>
            <span className="w-24 text-right">Qty</span>
            <span className="w-20 text-right">Count</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {[...orderBook.asks].reverse().map((level, i) => (
              <OrderBookLevelRow key={`ask-${level.price}-${i}`} level={level} maxQuantity={maxQty} type="ask" />
            ))}
          </div>
        </div>

        {/* Bids */}
        <div>
          <div className="flex items-center px-3 py-1.5 text-xs font-semibold text-text-muted border-b border-gray-700 bg-gray-800/30">
            <span className="w-24 text-right">Price</span>
            <span className="w-24 text-right">Qty</span>
            <span className="w-20 text-right">Count</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {orderBook.bids.map((level, i) => (
              <OrderBookLevelRow key={`bid-${level.price}-${i}`} level={level} maxQuantity={maxQty} type="bid" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderForm() {
  const [form, setForm] = useState<OrderFormData>({ side: "buy", price: "", quantity: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    const price = parseFloat(form.price);
    const quantity = parseFloat(form.quantity);
    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
      setError("Price and quantity must be positive numbers");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side: form.side, price, quantity }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setResult(`Order placed: ${data.order.id.slice(0, 8)}... (${data.trades?.length ?? 0} trades)`);
      setForm((prev) => ({ ...prev, price: "", quantity: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  return (
    <div className="bg-surface-elevated rounded-lg border border-gray-700 p-4">
      <h2 className="text-sm font-semibold text-text mb-3">Place Order</h2>

      {/* Side Toggle */}
      <div className="flex mb-3 rounded-md overflow-hidden border border-gray-600">
        <button
          onClick={() => setForm((prev) => ({ ...prev, side: "buy" }))}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            form.side === "buy"
              ? "bg-green-600 text-white"
              : "bg-transparent text-text-muted hover:text-text"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setForm((prev) => ({ ...prev, side: "sell" }))}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            form.side === "sell"
              ? "bg-red-600 text-white"
              : "bg-transparent text-text-muted hover:text-text"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Price Input */}
      <label className="block mb-1 text-xs font-medium text-text-muted">Price</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={form.price}
        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
        className="w-full mb-3 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-text text-sm font-mono focus:outline-none focus:border-brand-500"
        placeholder="0.00"
      />

      {/* Quantity Input */}
      <label className="block mb-1 text-xs font-medium text-text-muted">Quantity</label>
      <input
        type="number"
        step="0.0001"
        min="0"
        value={form.quantity}
        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
        className="w-full mb-4 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-text text-sm font-mono focus:outline-none focus:border-brand-500"
        placeholder="0.0000"
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full py-2.5 rounded-md text-sm font-semibold text-white transition-colors ${
          submitting
            ? "bg-gray-600 cursor-not-allowed"
            : form.side === "buy"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {submitting ? "Placing..." : `Place ${form.side === "buy" ? "Buy" : "Sell"} Order`}
      </button>

      {/* Result / Error */}
      {result && <p className="mt-3 text-xs text-green-400">{result}</p>}
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function App() {
  const { orderBook, connected } = useOrderBook();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-text">Trade App</h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              connected
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <OrderBookView orderBook={orderBook} />
          <OrderForm />
        </div>
      </main>
    </div>
  );
}
