import type { Order, OrderBook, OrderBookLevel, TradeEvent } from "@portfolio/shared-types";

interface OrderBookSide {
  levels: Map<number, OrderBookLevel>;
  orders: Map<number, Order[]>;
}

export class OrderBookEngine {
  private bids: OrderBookSide = { levels: new Map(), orders: new Map() };
  private asks: OrderBookSide = { levels: new Map(), orders: new Map() };
  private onTrade: ((trade: TradeEvent) => void) | null = null;

  constructor(private symbol: string = "DEMO") {}

  onTradeEvent(callback: (trade: TradeEvent) => void): void {
    this.onTrade = callback;
  }

  placeOrder(order: Order): TradeEvent[] {
    const trades: TradeEvent[] = [];
    if (order.side === "buy") {
      trades.push(...this.matchBuy(order));
    } else {
      trades.push(...this.matchSell(order));
    }
    for (const trade of trades) {
      this.onTrade?.(trade);
    }
    return trades;
  }

  private matchBuy(order: Order): TradeEvent[] {
    const trades: TradeEvent[] = [];
    const askPrices = [...this.asks.levels.keys()].sort((a, b) => a - b);
    let remainingQty = order.quantity;

    for (const askPrice of askPrices) {
      if (order.price < askPrice) break;
      const level = this.asks.levels.get(askPrice)!;
      const orders = this.asks.orders.get(askPrice)!;
      const matchQty = Math.min(remainingQty, level.quantity);

      trades.push({
        id: crypto.randomUUID(),
        price: askPrice,
        quantity: matchQty,
        buyerOrderId: order.id,
        sellerOrderId: orders[0]!.id,
        timestamp: new Date().toISOString(),
      });

      remainingQty -= matchQty;
      level.quantity -= matchQty;
      if (level.quantity === 0) {
        this.asks.levels.delete(askPrice);
        this.asks.orders.delete(askPrice);
      }
      if (remainingQty === 0) break;
    }

    if (remainingQty > 0) {
      this.addToSide(this.bids, { ...order, quantity: remainingQty });
    }
    return trades;
  }

  private matchSell(order: Order): TradeEvent[] {
    const trades: TradeEvent[] = [];
    const bidPrices = [...this.bids.levels.keys()].sort((a, b) => b - a);
    let remainingQty = order.quantity;

    for (const bidPrice of bidPrices) {
      if (order.price > bidPrice) break;
      const level = this.bids.levels.get(bidPrice)!;
      const orders = this.bids.orders.get(bidPrice)!;
      const matchQty = Math.min(remainingQty, level.quantity);

      trades.push({
        id: crypto.randomUUID(),
        price: bidPrice,
        quantity: matchQty,
        buyerOrderId: orders[0]!.id,
        sellerOrderId: order.id,
        timestamp: new Date().toISOString(),
      });

      remainingQty -= matchQty;
      level.quantity -= matchQty;
      if (level.quantity === 0) {
        this.bids.levels.delete(bidPrice);
        this.bids.orders.delete(bidPrice);
      }
      if (remainingQty === 0) break;
    }

    if (remainingQty > 0) {
      this.addToSide(this.asks, { ...order, quantity: remainingQty });
    }
    return trades;
  }

  private addToSide(side: OrderBookSide, order: Order): void {
    const existingLevel = side.levels.get(order.price);
    if (existingLevel) {
      existingLevel.quantity += order.quantity;
      existingLevel.orderCount += 1;
    } else {
      side.levels.set(order.price, {
        price: order.price,
        quantity: order.quantity,
        orderCount: 1,
      });
      side.orders.set(order.price, [order]);
    }
  }

  getOrderBook(): OrderBook {
    const sortByPrice = (a: OrderBookLevel, b: OrderBookLevel) => b.price - a.price;
    return {
      bids: [...this.bids.levels.values()].sort(sortByPrice),
      asks: [...this.asks.levels.values()].sort((a, b) => a.price - b.price),
      lastUpdated: new Date().toISOString(),
    };
  }
}
