import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Zap, BarChart2, Package, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../config";

const SUGGESTIONS = [
  { icon: BarChart2, text: "How much revenue today?" },
  { icon: Package,   text: "Which products need restocking?" },
  { icon: ShoppingBag, text: "How many orders are pending?" },
  { icon: Zap,       text: "What is our highest selling category?" },
];

const AIAssistant = () => {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hello! I am your **RetailMind AI Operations Brain**. I have access to your live inventory levels, sales histories, and customer directories. Ask me anything about your business performance!",
  }]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: msg }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages(prev => [...prev, { role: "assistant",
        content: data?.response || "I encountered an error. Please ensure the backend server is running." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error contacting AI backend. Please check the server." }]);
    } finally { setLoading(false); }
  };

  const formatMessage = (content) =>
    content.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ color: "#60a5fa" }}>{part.slice(2, -2)}</strong>
        : part
    );

  return (
    <div className="relative z-10" style={{ height: "calc(100vh - 72px)", display: "flex", flexDirection: "column" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="section-header flex-shrink-0">
        <div>
          <h1 className="section-title flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: "linear-gradient(135deg, #f59e0b20, #fbbf2420)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Bot size={17} style={{ color: "#f59e0b" }} />
            </span>
            AI Business Assistant
          </h1>
          <p className="section-subtitle">Query inventory, revenue, orders and product analytics in natural language</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <span className="w-2 h-2 rounded-full dot-pulse" style={{ background: "#f59e0b" }} />
          <span className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>AI Online</span>
        </div>
      </div>

      {/* ── Chat Container ─────────────────────────────────── */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        {/* Messages Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5" style={{ minHeight: 0 }}>
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const isAI = m.role === "assistant";
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={isAI
                      ? { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }
                      : { background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }
                    }>
                    {isAI ? <Bot size={15} style={{ color: "#f59e0b" }} /> : <User size={15} style={{ color: "#60a5fa" }} />}
                  </div>
                  {/* Bubble */}
                  <div className="max-w-[70%] p-4 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line"
                    style={isAI
                      ? { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)",
                          borderRadius: "4px 18px 18px 18px" }
                      : { background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "var(--text-primary)",
                          borderRadius: "18px 4px 18px 18px" }
                    }>
                    {formatMessage(m.content)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <Bot size={15} style={{ color: "#f59e0b" }} className="animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "4px 18px 18px 18px" }}>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "#f59e0b", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>AI is thinking…</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1" style={{ color: "var(--text-muted)" }}>
            <Sparkles size={10} style={{ color: "#f59e0b" }} /> Quick:
          </span>
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => handleSend(s.text)} disabled={loading}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.25)"; e.currentTarget.style.color = "#f59e0b"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                <Icon size={10} />{s.text}
              </button>
            );
          })}
        </div>

        {/* Input Row */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-4 flex gap-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(5,5,7,0.6)" }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading}
            placeholder="Ask anything about your business… (e.g. top selling product, total revenue this week)"
            className="input-field flex-1" />
          <button type="submit" disabled={loading || !input.trim()}
            className="btn btn-primary px-4 disabled:opacity-40">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
