import { describe, expect, it } from "bun:test";
import { ChatQueueEngine } from "../src/queue";

describe("Chat Queue Engine", () => {
  it("creates room in waiting state", () => {
    const engine = new ChatQueueEngine();
    const room = engine.createRoom("Alice");
    expect(room.status).toBe("waiting");
    expect(room.patientName).toBe("Alice");
    expect(room.doctorName).toBe("Dr. Demo");
    expect(room.queuePosition).toBe(1);
  });

  it("activates room when first message sent", () => {
    const engine = new ChatQueueEngine();
    const room = engine.createRoom("Bob");
    engine.addMessage({
      id: "msg1",
      roomId: room.id,
      senderId: "bob",
      senderRole: "patient",
      text: "Hello doctor",
      timestamp: new Date().toISOString(),
    });
    const updated = engine.getRoom(room.id);
    expect(updated?.status).toBe("active");
  });

  it("maintains correct queue order", () => {
    const engine = new ChatQueueEngine();
    engine.createRoom("Alice");
    engine.createRoom("Bob");
    engine.createRoom("Charlie");
    const queue = engine.getQueue();
    expect(queue).toHaveLength(3);
    expect(queue[0]?.position).toBe(1);
    expect(queue[1]?.position).toBe(2);
    expect(queue[2]?.position).toBe(3);
  });

  it("removes room from queue when closed", () => {
    const engine = new ChatQueueEngine();
    engine.createRoom("Alice");
    engine.createRoom("Bob");
    const room2 = engine.createRoom("Charlie");
    expect(engine.getQueue()).toHaveLength(3);
    engine.closeRoom(room2.id);
    expect(engine.getQueue()).toHaveLength(2);
    const closed = engine.getRoom(room2.id);
    expect(closed?.status).toBe("closed");
  });
});
