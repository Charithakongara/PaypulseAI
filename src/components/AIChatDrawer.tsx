import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  ChevronRight, 
  Sliders, 
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulatorWithSku?: (sku: string) => void;
  onOpenDisputes?: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSimulatorWithSku,
  onOpenDisputes,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am your **PayPal Store AI Copilot**. I have full visibility into your live PayPal Sandbox APIs:
- **Transaction Search API**: Revenue volume, fees, order velocity
- **Catalog Products API**: Unit pricing, stock levels & elasticity models ($E_d$)
- **Disputes & Invoicing API**: Active buyer claims & unpaid receivables

What would you like to analyze or optimize today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterChips = [
    "Which products had highest refund rate this month?",
    "What happens to margin if I discount my top seller by 10%?",
    "Analyze dispute risk and unpaid invoices",
    "Which items have high price elasticity?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.slice(-6)
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error analyzing query: ${err.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#0c1322] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0d172e]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Chat-with-your-Store
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
                Gemini 3.8
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Live PayPal REST API Function Calling & Elasticity
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Suggested Starter Chips */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto">
        {starterChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition whitespace-nowrap border border-slate-700/60 shrink-0 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-cyan-400 border border-slate-700'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              {/* Message text with basic markdown formatting */}
              <div className="whitespace-pre-wrap space-y-1">
                {msg.text.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**:')) {
                    return <strong key={i} className="text-white block mt-2 text-[13px]">{line.replace(/\*\*/g, '')}</strong>;
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} className="flex items-start gap-1.5 pl-1 my-0.5">
                        <span className="text-blue-400">•</span>
                        <span>{line.replace(/^- /, '')}</span>
                      </div>
                    );
                  }
                  return <p key={i}>{line}</p>;
                })}
              </div>

              <div className="text-[10px] text-slate-400 mt-1.5 text-right font-mono">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Analyzing PayPal APIs & calculating elasticity...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-[#0d1527]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about refunds, elasticity, disputes, or pricing..."
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[10px] text-slate-500 text-center mt-2 font-mono">
          Powered by PayPal AI Toolkit • Function Calling
        </div>
      </div>
    </aside>
  );
};
