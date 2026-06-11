import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { ChatQueueEngine } from "./queue";
import type { Message } from "@portfolio/shared-types";

const engine = new ChatQueueEngine();
const httpServer = createServer();

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
  }))
  .listen(4004);

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

httpServer.listen(4005);
console.log(`Telemedicine backend: HTTP :4004, WS :4005`);
