export interface Order {
  id: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  timestamp: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdated: string;
}

export interface TradeEvent {
  id: string;
  price: number;
  quantity: number;
  buyerOrderId: string;
  sellerOrderId: string;
  timestamp: string;
}

export type WebSocketMessage =
  | { type: "orderbook"; data: OrderBook }
  | { type: "trade"; data: TradeEvent }
  | { type: "subscribe"; symbol: string };
