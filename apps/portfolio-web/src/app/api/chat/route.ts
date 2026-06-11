import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@portfolio/shared-types";
import { bffFetch } from "@/lib/bff";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "message field is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await bffFetch("ai", "/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const chatResponse: ChatResponse = {
      messageId: result.messageId || crypto.randomUUID(),
      content: result.content || result.response || "",
      sources: result.sources || [],
    };

    return NextResponse.json(chatResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
