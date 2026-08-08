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
    content: "Hello! I am your **RetailMind AI Operations Intelligence**. I am connected to your live stock levels, platform orders, and sales history. How can I assist your store operations today?",
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: msg }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data?.response || "I encountered an issue processing your query. Please verify the backend server status."
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Unable to reach the AI engine backend. Please verify your connection."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (content) =>
    content.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="text-[#007AFF] font-bold">{part.slice(2, -2)}</strong>
        : part
    );

  return (
    <div className="relative z-10 h-[calc(100vh-80px)] flex flex-col space-y-4">
      {/* ── Page Header Bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-3 border-b border-black/[0.06] flex-shrink-0"
      >
        <div>
          <span className="apple-section-label block mb-1 text-[#007AFF]">
            Artificial Intelligence
          </span>
          <h1 className="apple-hero-title">
            Natural language business queries.
          </h1>
          <p className="apple-hero-subtitle">
            Instantly query sales performance, inventory thresholds, and order status.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF8ED] border border-[#34C759]/30 text-[#28A745]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] dot-pulse" />
          <span className="text-[11px] font-bold">AI Core Online</span>
        </div>
      </motion.div>

      {/* ── Main Chat Card Container ───────────────────────────────── */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden bg-white rounded-2xl border border-black/[0.06] shadow-xs">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const isAI = m.role === "assistant";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                      isAI ? "bg-[#E5F1FF] text-[#007AFF]" : "bg-[#F2F1FD] text-[#5856D6]"
                    }`}
                  >
                    {isAI ? <Bot size={16} strokeWidth={2} /> : <User size={16} strokeWidth={2} />}
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                      isAI
                        ? "bg-[#F5F5F7] text-[#1D1D1F] rounded-tl-xs border border-black/[0.04]"
                        : "bg-[#007AFF] text-white rounded-tr-xs font-medium"
                    }`}
                  >
                    {formatMessage(m.content)}
                  </div>
                </motion.div>
              );
            })}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#E5F1FF] text-[#007AFF] flex items-center justify-center">
                  <Bot size={16} className="animate-spin" />
                </div>
                <div className="bg-[#F5F5F7] px-4 py-3 rounded-2xl text-xs font-semibold text-[#86868B]">
                  Analyzing store intelligence...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-black/[0.04] bg-[#F5F5F7]/50 flex items-center gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[11px] font-semibold text-[#515154] border border-black/[0.06] hover:bg-slate-50 flex-shrink-0 cursor-pointer shadow-xs transition-all"
              >
                <Icon size={12} className="text-[#007AFF]" />
                <span>{s.text}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 border-t border-black/[0.06] bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI about sales, low stock, revenue trends..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="input-field flex-1"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-[#007AFF] text-white flex items-center justify-center disabled:opacity-50 cursor-pointer border-none shadow-md shadow-blue-500/20"
          >
            <Send size={16} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
