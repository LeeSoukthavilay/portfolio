export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

export interface ChatSource {
  title: string;
  excerpt: string;
  service: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  sources: ChatSource[];
}
