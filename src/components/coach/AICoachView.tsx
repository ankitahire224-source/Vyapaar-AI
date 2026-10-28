import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight,
  User,
  ShieldCheck,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { Product, Sale, Expense, WasteRecord, AICoachMessage } from '../../types';
import { askBusinessCoach } from '../../services/aiAdvisor';
import { formatINR } from '../../utils/formatters';

interface AICoachViewProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  wasteRecords: WasteRecord[];
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  products,
  sales,
  expenses,
  wasteRecords,
}) => {
  const [messages, setMessages] = useState<AICoachMessage[]>([
    {
      id: 'init-1',
      sender: 'coach',
      text: `Namaste! I am **Vyapaar Business Coach** — your AI local business copilot.\n\nI monitor your daily chai & snacks sales, ingredient costs, food waste, and peak rush hours to help you make more daily profit.\n\nTap any suggested question below or ask me anything about your shop's performance!`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      suggestedActions: [
        'Which products generate the most revenue?',
        'Which products have the highest gross profit?',
        'What stock should I prepare for tomorrow?',
        'Which items cause the most food waste?',
        'What promotion could I test during slow hours?',
        'How much did I spend today?',
        'How can I improve my recorded profit?',
      ],
      source: 'grounded_rules',
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMsg: AICoachMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const coachReply = await askBusinessCoach(
        q,
        products,
        sales,
        expenses,
        wasteRecords,
        messages
      );
      setMessages(prev => [...prev, coachReply]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'coach',
          text: `I encountered an unexpected issue while crunching your numbers. Please try asking again.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Which products generate the most revenue?',
    'Which products have the highest gross profit margin?',
    'What stock should I prepare for tomorrow morning rush?',
    'Which items are causing the most food waste?',
    'What promotion should I test during slow hours (2 PM - 5 PM)?',
    'How much did I spend on expenses and waste today?',
    'How can I improve my net profit this week?',
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl shadow-md border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Vyapaar Business Coach</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Grounded in Live Store Records
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Gives practical business advice grounded in your store's actual sales, costs, waste, and margin numbers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/50 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Factual • Never Fabricates</span>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Suggested Questions for Chai & Snacks Stall:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs text-left px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-xl transition-all font-medium text-slate-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4 min-h-[420px] max-h-[580px] overflow-y-auto">
        {messages.map((msg) => {
          const isCoach = msg.sender === 'coach';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs sm:text-sm ${isCoach ? 'items-start' : 'items-end flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isCoach
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-xl rounded-2xl p-4 space-y-3 ${
                  isCoach
                    ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-xs'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-line leading-relaxed font-normal">
                  {msg.text}
                </div>

                {/* Grounding Source Badge */}
                {isCoach && msg.source && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {msg.source === 'gemini_api'
                        ? 'Analyzed by Google Gemini API with verified store metrics'
                        : 'Calculated directly from your live store sales & cost logs'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}

                {/* Suggested Action Follow-up Pills */}
                {isCoach && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Recommended Next Actions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(action)}
                          className="text-[11px] text-left px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-lg transition-colors font-medium flex items-center gap-1 shadow-xs"
                        >
                          <span>{action}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Checking your latest sales, costs, and waste records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask Business Coach anything (e.g. How can I boost slow afternoon sales?)..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-700/20"
        >
          <span>Ask</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
