import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, GripHorizontal } from 'lucide-react';
import { useI18nContext } from '@/contexts/I18nContext';
import { CORRIDORS, calculateTotal } from '@/lib/corridors';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  { label: '💰 Savings on $500', query: 'How much do I save sending $500 with Jisr-Pay?' },
  { label: '🤖 How Agents Work', query: 'How do Rate-Scout, Router, and Reconciler work?' },
  { label: '🌍 Supported Corridors', query: 'Which Gulf to Africa corridors are supported?' },
  { label: '⚡ Why Stellar?', query: 'Why is Stellar faster and cheaper than Western Union?' },
];

export function JisrCopilot() {
  const { lang, isRTL } = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: lang === 'en'
        ? "Marhaba! I am Jisr Copilot, your AI Remittance Assistant. Ask me about Gulf ↔ Africa rates, Stellar settlement, or how our 3 AI agents save you up to 90% on fees."
        : "مرحباً بك! أنا مساعد جسر باي للذكاء الاصطناعي. اسألني عن أسعار التحويل بين الخليج وإفريقيا، أو تسوية ستيلار، أو كيف توفر لك وكلاؤنا 90% من الرسوم.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAnswer = (userQuery: string): string => {
    const q = userQuery.toLowerCase();

    if (q.includes('save') || q.includes('500') || q.includes('fee') || q.includes('cost')) {
      const jisrTotal = calculateTotal(CORRIDORS[0], 500);
      const bankTotal = 500 * (1 + 0.065) + 15;
      const saved = bankTotal - jisrTotal;
      return lang === 'en'
        ? `For a $500 remittance, bank wires cost ~$${bankTotal.toFixed(2)} (6.5% + $15 fee, taking 2 days). Jisr-Pay costs only $${jisrTotal.toFixed(2)} (0.4% flat fee, settling in ~5 seconds). You save $${saved.toFixed(2)} on every transfer!`
        : `لتحويل 500 دولار، تكلف الحوالات البنكية حوالي ${bankTotal.toFixed(2)}$ (رسوم 6.5% + 15$ وتستغرق يومين). بينما تكلف جسر باي ${jisrTotal.toFixed(2)}$ فقط (رسوم 0.4% وتكتمل في 5 ثوانٍ). توفر ${saved.toFixed(2)}$ في كل تحويل!`;
    }

    if (q.includes('agent') || q.includes('rate-scout') || q.includes('router') || q.includes('reconciler') || q.includes('how')) {
      return lang === 'en'
        ? "Jisr-Pay operates 3 autonomous AI agents:\n1. 🔍 Rate-Scout: Scans DEX orderbooks & liquidity pools for optimal currency paths.\n2. ⚡ Router: Constructs ZK key envelopes and validates Stellar Soroban contracts.\n3. 🔒 Reconciler: Listens to Horizon ledger consensus and issues branded PDF receipts."
        : "تستعين جسر باي بـ 3 وكلاء ذكاء اصطناعي:\n1. 🔍 Rate-Scout: يمسح مجمعات السيولة لتحديد المسار الأفضل.\n2. ⚡ Router: يبني معاملات ستيلار ويتحقق من عقود سوروبان.\n3. 🔒 Reconciler: يستمع لتوافق دفتر الحسابات ويصدر إيصالات PDF موثقة.";
    }

    if (q.includes('corridor') || q.includes('country') || q.includes('gulf') || q.includes('africa')) {
      return lang === 'en'
        ? "We currently support key corridors:\n• UAE (AED) ➔ Nigeria (NGN)\n• Saudi Arabia (SAR) ➔ Kenya (KES)\n• Kuwait (KWD) ➔ Ghana (GHS)\n• Qatar (QAR) ➔ Ethiopia (ETB)\nAll settled instantly on Stellar Testnet!"
        : "ندعم حالياً الممرات الرئيسية التالية:\n• الإمارات (AED) ➔ نيجيريا (NGN)\n• السعودية (SAR) ➔ كينيا (KES)\n• الكويت (KWD) ➔ غانا (GHS)\n• قطر (QAR) ➔ إثيوبيا (ETB)\nجميعها تتم تسويتها فورياً على شبكة ستيلار!";
    }

    if (q.includes('stellar') || q.includes('blockchain') || q.includes('western')) {
      return lang === 'en'
        ? "Traditional corridors rely on correspondent banking chains with up to 6 intermediary markups. Stellar uses open cryptographic ledger consensus to settle asset trustlines in ~5 seconds with sub-cent network gas fees, eliminating bank overhead."
        : "تعتمد الحوالات التقليدية على سلسلات البنوك المراسلة مع العديد من الرسوم الإضافية. بينما تستخدم شبكة ستيلار التوافق اللامركزي لتسوية الأصول في ~5 ثوانٍ بروسم شبه معدومة.";
    }

    return lang === 'en'
      ? "Jisr-Pay combines AI routing with Stellar blockchain settlement for zero-markup Gulf ↔ Africa remittances. Connect your wallet to launch a 5-second transfer!"
      : "تجمع جسر باي بين توجيه الذكاء الاصطناعي وتسوية بلوكتشين ستيلار لتحويلات خالية من العمولات الخفية. اربط محفظتك للبدء!";
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = generateAnswer(query);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-50 font-sans cursor-grab active:cursor-grabbing"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Floating Copilot Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-3 bg-card border border-border hover:border-primary/50 text-foreground font-bold px-4 py-3 rounded-full shadow-2xl backdrop-blur-xl transition-all group overflow-hidden"
          >
            <GripHorizontal className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <span className="text-sm font-extrabold tracking-tight">Jisr Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Copilot Modal Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-80 md:w-96 h-[500px] rounded-3xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drag Handle & Header */}
            <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GripHorizontal className="w-4 h-4 text-muted-foreground/60" />
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    Jisr Copilot <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">AI</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Remittance Intelligence</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                        : 'bg-muted border border-border text-foreground rounded-tl-none'
                    }`}
                  >
                    {m.text}
                    <span className="block text-[9px] opacity-60 text-end mt-1 font-mono">{m.timestamp}</span>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-2 items-center text-xs text-muted-foreground p-2">
                  <Bot className="w-4 h-4 text-primary animate-spin" />
                  <span>Analyzing liquidity & routing logic...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-2 border-t border-border/60 bg-muted/20 flex gap-2 overflow-x-auto no-scrollbar">
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleSend(q.query)}
                  className="shrink-0 text-[11px] font-semibold bg-muted hover:bg-primary/20 hover:text-primary text-muted-foreground px-3 py-1 rounded-full border border-border transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'en' ? 'Ask Jisr AI...' : 'اسأل ذكاء جسر...'}
                className="flex-1 bg-muted/60 text-xs px-3.5 py-2.5 rounded-full border border-border focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-all"
              >
                <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
