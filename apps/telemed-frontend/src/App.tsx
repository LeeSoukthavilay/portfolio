import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, Room, ChatEvent } from "@portfolio/shared-types";

const API_URL = "http://localhost:4004";
const WS_URL = "http://localhost:4005";

function CreateRoomForm({ onRoomCreated }: { onRoomCreated: (room: Room) => void }) {
  const [patientName, setPatientName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    if (!patientName.trim()) {
      setError("Please enter your name");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: patientName.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const room: Room = await res.json();
      onRoomCreated(room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setCreating(false);
    }
  }, [patientName, onRoomCreated]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-surface-elevated rounded-lg border border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-text mb-4">Start a Consultation</h2>

        <label className="block mb-1.5 text-sm font-medium text-text">Your Name</label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className="w-full mb-4 px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-md text-text text-sm focus:outline-none focus:border-brand-500"
          placeholder="Enter your name"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <button
          onClick={handleCreate}
          disabled={creating}
          className={`w-full py-2.5 rounded-md text-sm font-semibold text-white transition-colors ${
            creating
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          {creating ? "Creating..." : "Create Room"}
        </button>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function ChatRoom({ room, onLeave }: { room: Room; onLeave: () => void }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [queuePosition, setQueuePosition] = useState<number>(room.queuePosition);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s: Socket = io(WS_URL);

    s.on("connect", () => {
      s.emit("join_room", room.id);
    });

    s.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    s.on("room_update", (updatedRoom: Room) => {
      if (updatedRoom.queuePosition !== undefined) {
        setQueuePosition(updatedRoom.queuePosition);
      }
    });

    s.on("queue_update", (data: { queue: Array<{ roomId: string }> }) => {
      const pos = data.queue.findIndex((r: { roomId: string }) => r.roomId === room.id);
      setQueuePosition(pos >= 0 ? pos + 1 : 0);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [room.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!socket || !input.trim()) return;

    const text = input.trim();
    setInput("");

    socket.emit("send_message", {
      roomId: room.id,
      senderId: "patient",
      senderRole: "patient",
      text,
    });
  }, [socket, room.id, input]);

  const isInQueue = queuePosition > 0;
  const roomActive = room.status === "active";

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[70vh] bg-surface-elevated rounded-lg border border-gray-700 overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">Consultation Room</h2>
          {!roomActive && (
            <p className="text-xs text-text-muted mt-0.5">
              Queue position: <span className="font-mono text-brand-400">{queuePosition}</span>
            </p>
          )}
          {roomActive && (
            <p className="text-xs text-green-400 mt-0.5">Connected with doctor</p>
          )}
        </div>
        <button
          onClick={onLeave}
          className="text-xs text-text-muted hover:text-red-400 transition-colors px-3 py-1 rounded border border-gray-600 hover:border-red-500"
        >
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-xs">
              {roomActive ? "No messages yet. Start the conversation!" : "Waiting for a doctor to join..."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderRole === "patient" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg text-xs ${
                msg.senderRole === "patient"
                  ? "bg-brand-600 text-white rounded-br-sm"
                  : "bg-gray-700 text-text rounded-bl-sm"
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.senderRole === "patient" ? "text-brand-200" : "text-text-subtle"}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-text text-sm focus:outline-none focus:border-brand-500"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`px-4 py-2 rounded-md text-xs font-semibold text-white transition-colors ${
              !input.trim()
                ? "bg-gray-700 text-text-subtle cursor-not-allowed"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [room, setRoom] = useState<Room | null>(null);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-text">Telemedicine</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!room ? (
          <CreateRoomForm onRoomCreated={setRoom} />
        ) : (
          <ChatRoom room={room} onLeave={() => setRoom(null)} />
        )}
      </main>
    </div>
  );
}
