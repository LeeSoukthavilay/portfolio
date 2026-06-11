import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { Server } from "socket.io";
import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { ChatQueueEngine } from "./queue";
import type { Message } from "@portfolio/shared-types";

const PORT = 4004;
const engine = new ChatQueueEngine();

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({
    status: "ok",
    queueLength: engine.getQueue().length,
  }))
  .post("/rooms", ({ body }: any) => engine.createRoom(body.patientName))
  .get(
    "/rooms/:id",
    ({ params }) =>
      engine.getRoom(params.id) ?? new Response("Not found", { status: 404 })
  )
  .get("/rooms/:id/messages", ({ params }) => ({
    messages: engine.getMessages(params.id),
  }));

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const url = `http://localhost:${PORT}${req.url || "/"}`;
    const headers = new Headers();
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      headers.set(req.rawHeaders[i]!, req.rawHeaders[i + 1]!);
    }

    try {
      const webRes = await app.fetch(
        new Request(url, { method: req.method || "GET", headers })
      );
      res.writeHead(
        webRes.status,
        Object.fromEntries(webRes.headers.entries())
      );
      res.end(await webRes.text());
    } catch {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
);

const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join_room", (roomId: string) => {
    socket.join(roomId);
    const room = engine.activateRoom(roomId);
    if (room) {
      io.to(roomId).emit("room_update", room);
      io.emit("queue_update", { queue: engine.getQueue() });
    }
  });

  socket.on(
    "send_message",
    (data: {
      roomId: string;
      senderId: string;
      senderRole: "doctor" | "patient";
      text: string;
    }) => {
      const msg: Message = {
        id: crypto.randomUUID(),
        roomId: data.roomId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        text: data.text,
        timestamp: new Date().toISOString(),
      };
      engine.addMessage(msg);
      io.to(data.roomId).emit("message", msg);
    }
  );

  socket.on("close_room", (roomId: string) => {
    engine.closeRoom(roomId);
    io.emit("queue_update", { queue: engine.getQueue() });
  });
});

httpServer.listen(PORT);
console.log(`Telemedicine backend running on http://localhost:${PORT}`);
