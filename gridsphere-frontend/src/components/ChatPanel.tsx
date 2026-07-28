import { FormEvent, useEffect, useRef, useState } from "react";
import { getChatHistory, sendChatMessage } from "../api/chat";
import { ChatMessage } from "../types";

export default function ChatPanel({ deviceId }: { deviceId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getChatHistory(deviceId)
      .then(setMessages)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load chat history"))
      .finally(() => setIsLoading(false));
  }, [deviceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setIsSending(true);
    // Optimistically show the user's message right away.
    const optimisticUser: ChatMessage = {
      id: -Date.now(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    try {
      const { userMessage, assistantMessage } = await sendChatMessage(deviceId, trimmed);
      setMessages((prev) => [...prev.filter((m) => m.id !== optimisticUser.id), userMessage, assistantMessage]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not get a response");
      // Remove the optimistic bubble since it never actually got a reply.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  const suggestions = ["Should I irrigate today?", "Will it rain soon?", "Is today good for spraying?"];

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">Ask GridSphere</span>
      </div>
      <div className="panel-body">
        {error && <div className="error-banner">{error}</div>}

        {isLoading ? (
          <div className="loading-text">Loading conversation…</div>
        ) : (
          <div className="chat-scroll" ref={scrollRef}>
            {messages.length === 0 && (
              <p className="muted" style={{ fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                Ask anything about this device's current conditions - irrigation, spraying, forecast, whatever's on
                your mind.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {isSending && <div className="chat-bubble assistant">Thinking…</div>}
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex-row" style={{ flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {suggestions.map((s) => (
              <button key={s} className="btn-ghost" onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="chat-input-row">
          <input
            placeholder="Ask a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            maxLength={2000}
          />
          <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isSending || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
