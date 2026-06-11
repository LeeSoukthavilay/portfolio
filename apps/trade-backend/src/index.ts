import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { OrderBookEngine } from "./orderbook";
import type { Order, TradeEvent, WebSocketMessage } from "@portfolio/shared-types";

const engine = new OrderBookEngine();
const clients = new Set<any>();

const broadcastOrderBook = () => {
  const book = engine.getOrderBook();
  const msg: WebSocketMessage = { type: "orderbook", data: book };
  for (const ws of clients) {
    ws.send(JSON.stringify(msg));
  }
};

setInterval(broadcastOrderBook, 500);

engine.onTradeEvent((trade: TradeEvent) => {
  const msg: WebSocketMessage = { type: "trade", data: trade };
  for (const ws of clients) {
    ws.send(JSON.stringify(msg));
  }
});

const app = new Elysia()
  .use(cors())
  .ws("/ws", {
    open(ws) { clients.add(ws); },
    close(ws) { clients.delete(ws); },
    message(ws, message) {
      const msg = message as WebSocketMessage;
      if (msg.type === "subscribe") {
        ws.send(JSON.stringify({ type: "orderbook", data: engine.getOrderBook() }));
      }
    },
  })
  .post(
    "/orders",
    ({ body }) => {
      const order: Order = {
        id: crypto.randomUUID(),
        side: body.side,
        price: body.price,
        quantity: body.quantity,
        timestamp: new Date().toISOString(),
      };
      const trades = engine.placeOrder(order);
      return { order, trades };
    },
    {
      body: t.Object({
        side: t.Union([t.Literal("buy"), t.Literal("sell")]),
        price: t.Number({ minimum: 0 }),
        quantity: t.Number({ minimum: 1 }),
      }),
    }
  )
  .get("/orderbook", () => engine.getOrderBook())
  .listen(4001);

console.log(`Trade backend running on http://localhost:${app.server?.port}`);
