import { useEffect, useRef, useState } from "react";
import { getChatHistory, sendChatMessage } from "../api/devices";
import { ChatMessage } from "../types";

export default function ChatAssistant({ deviceId }: { deviceId: number }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) getChatHistory(deviceId).then(setMessages).catch(() => {});
  }, [open, deviceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", content: text, createdAt: new Date().toISOString() }]);
    setIsSending(true);
    try {
      const reply = await sendChatMessage(deviceId, text);
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", content: reply, createdAt: new Date().toISOString() }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant. Try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          borderRadius: "50%",
          width: 56,
          height: 56,
          background: "var(--brand-green-dark)",
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: 22,
          cursor: "pointer",
          zIndex: 100,
        }}
        aria-label="Open AI chat assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div
      className="panel"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 340,
        maxHeight: 480,
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div className="panel-header">
        <span className="panel-title">Ask about your field</span>
        <button className="btn-ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            Ask things like "Should I irrigate today?" or "Why is humidity so high?"
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "var(--brand-green-dark)" : "var(--brand-green-light)",
              color: m.role === "user" ? "#fff" : "var(--ink)",
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: 13,
              maxWidth: "85%",
            }}
          >
            {m.content}
          </div>
        ))}
        {isSending && (
          <div className="muted" style={{ fontSize: 12 }}>
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--hairline)" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a question…"
          style={{ flex: 1, border: "1px solid var(--hairline)", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
        />
        <button className="btn-ghost" onClick={handleSend} disabled={isSending}>
          Send
        </button>
      </div>
    </div>
  );
}
