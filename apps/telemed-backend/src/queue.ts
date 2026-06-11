import type { Room, Message } from "@portfolio/shared-types";

export class ChatQueueEngine {
  private rooms: Map<string, Room> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private waitingQueue: string[] = [];

  createRoom(patientName: string): Room {
    const room: Room = {
      id: crypto.randomUUID(),
      patientName,
      doctorName: "Dr. Demo",
      status: "waiting",
      createdAt: new Date().toISOString(),
      queuePosition: this.waitingQueue.length + 1,
    };
    this.waitingQueue.push(room.id);
    this.rooms.set(room.id, room);
    this.messages.set(room.id, []);
    return room;
  }

  addMessage(msg: Message): void {
    const roomMessages = this.messages.get(msg.roomId) || [];
    roomMessages.push(msg);
    this.messages.set(msg.roomId, roomMessages);
    const room = this.rooms.get(msg.roomId);
    if (room && room.status === "waiting") {
      room.status = "active";
    }
  }

  activateRoom(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    room.status = "active";
    this.waitingQueue = this.waitingQueue.filter((id) => id !== roomId);
    return room;
  }

  closeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = "closed";
      this.waitingQueue = this.waitingQueue.filter((id) => id !== roomId);
    }
  }

  getQueue(): { position: number }[] {
    return this.waitingQueue.map((_, i) => ({ position: i + 1 }));
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getMessages(roomId: string): Message[] {
    return this.messages.get(roomId) || [];
  }
}
