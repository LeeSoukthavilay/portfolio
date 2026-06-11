import { useState, useEffect, useCallback } from "react";
import type { Product, CheckoutResponse } from "@portfolio/shared-types";

const API_URL = "http://localhost:4003";

function generateIdempotencyKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ProductCard({ product, onCheckout }: { product: Product; onCheckout: (id: string) => void }) {
  const outOfStock = product.stock <= 0;

  return (
    <div className="bg-surface-elevated rounded-lg border border-gray-700 overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-gray-800 flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-text-subtle text-4xl font-mono">{product.name.charAt(0)}</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-brand-400 font-medium mb-1 uppercase tracking-wider">{product.category}</span>
        <h3 className="text-sm font-semibold text-text mb-1">{product.name}</h3>
        <p className="text-lg font-bold text-text font-mono mb-2">${product.price.toFixed(2)}</p>
        <p className={`text-xs mb-3 ${outOfStock ? "text-red-400" : "text-text-muted"}`}>
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </p>
        <div className="mt-auto">
          <button
            onClick={() => onCheckout(product.id)}
            disabled={outOfStock}
            className={`w-full py-2 rounded-md text-xs font-semibold text-white transition-colors ${
              outOfStock
                ? "bg-gray-700 text-text-subtle cursor-not-allowed"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {outOfStock ? "Unavailable" : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [checkouting, setCheckouting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products ?? []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load products");
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const handleCheckout = useCallback(async (_productId: string) => {
    const idempotencyKey = generateIdempotencyKey();
    setCheckouting(true);
    setCheckoutResult(null);

    try {
      const res = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: _productId, idempotencyKey }),
      });

      if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
      const data: CheckoutResponse = await res.json();
      setCheckoutResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckouting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-text">E-Commerce</h1>
          {checkouting && (
            <span className="text-xs text-text-muted">Processing checkout...</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-text-muted text-sm">Loading products...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md mb-6">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <p className="text-text-muted text-sm">No products available.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onCheckout={handleCheckout} />
            ))}
          </div>
        )}

        {/* Checkout Confirmation */}
        {checkoutResult && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-green-400 text-sm font-semibold mb-2">Order Confirmed</p>
            <p className="text-green-300 text-xs font-mono">Order ID: {checkoutResult.orderId}</p>
            <p className="text-green-300 text-xs font-mono">Status: {checkoutResult.status}</p>
            <p className="text-green-300 text-xs font-mono">
              Total: ${checkoutResult.totalAmount.toFixed(2)}
            </p>
            <p className="text-green-300/70 text-xs font-mono mt-1">
              {new Date(checkoutResult.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
