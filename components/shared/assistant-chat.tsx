"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, Bot, CircleHelp, MessageSquareText, RotateCcw, Send, Sparkles, UserRound } from "lucide-react";
import { askAssistant } from "@/app/ai-assistant/actions";

type Message = { id: string; role: "assistant" | "user"; text: string };
const suggestions = [
  "What are my sales this month?",
  "Which customers have pending payments?",
  "Who are my top customers?",
  "Which customers should I follow up with?",
  "Show low-stock products",
  "Show recent orders",
];
const welcome: Message = { id: "welcome", role: "assistant", text: "Salam! I’m your AW CRM AI Assistant. Choose a suggested question or ask about sales, orders, outstanding payments, top customers, low stock, and reminders. I’ll use your live CRM records." };

export function AssistantChat({ organizationName, hasOrganization }: { organizationName: string; hasOrganization: boolean }) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, pending]);
  function send(value = input) {
    const question = value.trim();
    if (!question || pending) return;
    if (question.length > 2000) { setError("Keep your question under 2,000 characters."); return; }
    setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text: question }]);
    setInput("");
    setError("");
    startTransition(async () => {
      try {
        const result = await askAssistant(question);
        if (result.error) setError(result.error);
        else if (result.answer) setMessages(current => [...current, { id: crypto.randomUUID(), role: "assistant", text: result.answer! }]);
      } catch { setError("The assistant is unavailable. Try again shortly."); }
      inputRef.current?.focus();
    });
  }
  function onSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); send(); }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
  }
  function reset() { setMessages([welcome]); setInput(""); setError(""); inputRef.current?.focus(); }
  const newChat = messages.length === 1;
  return <div className="assistant-page"><header className="assistant-header"><div><div className="module-eyebrow">{organizationName} / INTELLIGENCE</div><h1>AI Assistant<span>.</span></h1><p>Ask questions about your verified business records.</p></div><button type="button" onClick={reset} disabled={newChat && !error} className="assistant-new-chat"><RotateCcw size={15} /> New chat</button></header>
    <div className="assistant-layout"><aside className="assistant-sidebar"><div className="assistant-sidebar-brand"><span><Sparkles size={21} /></span><div><strong>Your business copilot</strong><small>Connected to your workspace</small></div></div><div className="assistant-sidebar-section"><span>GOOD QUESTIONS TO ASK</span>{suggestions.map((suggestion, index) => <button type="button" key={suggestion} onClick={() => send(suggestion)} disabled={pending || !hasOrganization}><span>{index + 1}</span>{suggestion}<ArrowUp size={13} /></button>)}</div><div className="assistant-sidebar-tip"><CircleHelp size={18} /><div><strong>Ask in your own words</strong><p>Try a suggested question or type a supported business topic.</p></div></div></aside>
    <section className="assistant-chat" aria-label="AI Assistant conversation"><div className="assistant-chat-top"><div><span className="assistant-chat-avatar"><Sparkles size={17} /></span><div><strong>AW CRM Assistant</strong><small>Business insights and answers</small></div></div><span className="assistant-connected"><span /> {hasOrganization ? "Live workspace" : "Select a workspace"}</span></div>
      <div className="assistant-messages" role="log" aria-live="polite" aria-relevant="additions text">{newChat && <div className="assistant-intro"><span><Bot size={28} /></span><h2>How can I help your business?</h2><p>Choose a question about sales, orders, payments, customers, stock, or reminders. Answers come from your workspace records.</p></div>}{messages.map(message => <div key={message.id} className={`assistant-message ${message.role}`}><span className="assistant-message-avatar">{message.role === "assistant" ? <Sparkles size={16} /> : <UserRound size={16} />}</span><div><span className="assistant-message-label">{message.role === "assistant" ? "AW CRM Assistant" : "You"}</span><div className="assistant-message-bubble" dir="auto">{message.text}</div></div></div>)}{pending && <div className="assistant-message assistant"><span className="assistant-message-avatar"><Sparkles size={16} /></span><div><span className="assistant-message-label">AW CRM Assistant</span><div className="assistant-message-bubble assistant-typing" role="status"><span /><span /><span /><span className="sr-only">Thinking</span></div></div></div>}<div ref={endRef} /></div>
      <div className="assistant-composer-wrap">{!hasOrganization && <div className="assistant-error" role="status">Select or create an organization in Settings to ask about business data.</div>}{error && <div className="assistant-error" role="alert">{error}</div>}<form onSubmit={onSubmit} className="assistant-composer"><MessageSquareText size={19} aria-hidden="true" /><textarea ref={inputRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder="Ask about your business…" aria-label="Message the assistant" rows={1} maxLength={2000} disabled={pending || !hasOrganization} /><button type="submit" disabled={pending || !hasOrganization || !input.trim()} aria-label="Send message"><Send size={17} /></button></form><p>Answers come from your connected workspace. Verify important decisions against source records.</p></div>
    </section></div></div>;
}
