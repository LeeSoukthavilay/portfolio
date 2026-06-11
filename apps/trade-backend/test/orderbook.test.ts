import { describe, expect, it } from "bun:test";
import { OrderBookEngine } from "../src/orderbook";

describe("OrderBookEngine", () => {
  it("adds resting order when no match exists", () => {
    const engine = new OrderBookEngine();
    engine.placeOrder({
      id: "order-1", side: "buy", price: 100, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    const book = engine.getOrderBook();
    expect(book.bids).toHaveLength(1);
    expect(book.bids[0]!.price).toBe(100);
    expect(book.bids[0]!.quantity).toBe(10);
    expect(book.asks).toHaveLength(0);
  });

  it("matches buy order against existing ask at same price", () => {
    const engine = new OrderBookEngine();
    engine.placeOrder({
      id: "sell-1", side: "sell", price: 100, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    const trades = engine.placeOrder({
      id: "buy-1", side: "buy", price: 100, quantity: 5,
      timestamp: new Date().toISOString(),
    });
    expect(trades).toHaveLength(1);
    expect(trades[0]!.price).toBe(100);
    expect(trades[0]!.quantity).toBe(5);
    const book = engine.getOrderBook();
    expect(book.asks[0]!.quantity).toBe(5);
  });

  it("matches at the best price (price-time priority)", () => {
    const engine = new OrderBookEngine();
    engine.placeOrder({
      id: "sell-1", side: "sell", price: 101, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    engine.placeOrder({
      id: "sell-2", side: "sell", price: 100, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    const trades = engine.placeOrder({
      id: "buy-1", side: "buy", price: 102, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    expect(trades).toHaveLength(1);
    expect(trades[0]!.price).toBe(100);
  });

  it("partial fill leaves remaining in order book", () => {
    const engine = new OrderBookEngine();
    engine.placeOrder({
      id: "sell-1", side: "sell", price: 100, quantity: 10,
      timestamp: new Date().toISOString(),
    });
    const trades = engine.placeOrder({
      id: "buy-1", side: "buy", price: 100, quantity: 20,
      timestamp: new Date().toISOString(),
    });
    expect(trades[0]!.quantity).toBe(10);
    const book = engine.getOrderBook();
    expect(book.bids[0]!.quantity).toBe(10);
    expect(book.bids[0]!.price).toBe(100);
  });
});
