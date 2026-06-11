export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: "doctor" | "patient";
  text: string;
  timestamp: string;
}

export interface Room {
  id: string;
  patientName: string;
  doctorName: string;
  status: "waiting" | "active" | "closed";
  createdAt: string;
  queuePosition: number;
}

export interface ChatEvent {
  type: "message" | "room_update" | "queue_update";
  payload: Message | Room | { position: number };
}
