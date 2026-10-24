import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  User, 
  Lightbulb, 
  Clock
} from 'lucide-react';
import type { AICoachMessage } from '../types/habit';
import { INITIAL_AI_CHAT, AI_SUGGESTIONS } from '../data/initialData';
import { motion, AnimatePresence } from 'motion/react';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  completionRate: number;
  streakCount: number;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  completionRate,
  streakCount,
}) => {
  const [messages, setMessages] = useState<AICoachMessage[]>(INITIAL_AI_CHAT);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef<number>(100);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Intelligent demo response generator based on question keywords & habit context
  const getSimulatedResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('streak') || q.includes('maintain') || q.includes('mindfulness')) {
      return `To maintain your current ${streakCount}-day streak, anchor your habits to existing routines (Habit Stacking). For instance: 'Immediately after brewing my morning coffee, I will sit for 10 minutes of box breathing.' Never break the chain two days in a row!`;
    }

    if (q.includes('consistency') || q.includes('week') || q.includes('analyze')) {
      return `Analyzing your metrics: Your weekly consistency is at 92%, which places you in the top tier of HabitFlow users! Your strongest ritual is Optimal Hydration (21-day streak). To boost your evening rituals, consider setting a digital sunset alarm at 9:30 PM.`;
    }

    if (q.includes('deep work') || q.includes('focus') || q.includes('stack')) {
      return `For deep focus sprints, use the 45/15 cadence: 45 minutes of uninterrupted single-tasking followed by 15 minutes of physical movement. Before beginning, close all communication apps and place your phone in another room.`;
    }

    if (q.includes('evening') || q.includes('procrastination') || q.includes('sleep')) {
      return `Evening procrastination usually stems from decision fatigue, not laziness. Prepare your environment in the morning: set your book on your pillow and dim ambient screens 1 hour before bed. Make the good habit the easiest path.`;
    }

    return `That's a thoughtful question regarding habit formation. Consistency builds identity: every ritual you complete is a vote for the type of person you want to become. You're currently at ${completionRate}% completion today — pick one small ritual to focus on next!`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputValue.trim();
    if (!query) return;

    msgCounterRef.current += 1;
    const userMsgId = `msg-user-${msgCounterRef.current}`;

    // Add user message
    const userMsg: AICoachMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response with natural delay
    setTimeout(() => {
      msgCounterRef.current += 1;
      const aiMsgId = `msg-ai-${msgCounterRef.current}`;
      const responseText = getSimulatedResponse(query);
      const aiMsg: AICoachMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: responseText,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          {/* Modal Dialog with Spring Entrance */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-coach-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-2xl h-[620px] max-h-[90vh] rounded-2xl bg-[#0c0e1a] border border-violet-500/30 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/5 bg-[#111424] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-500/30">
                    <div className="w-full h-full bg-[#0c0e1a] rounded-xl flex items-center justify-center">
                      <Bot className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0c0e1a] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="ai-coach-modal-title" className="text-base font-bold text-white">
                      Aura AI Coach
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Demo Companion
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Context-aware habit advice based on behavioral science
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Demo Notice Banner */}
            <div className="px-4 py-2 bg-violet-950/40 border-b border-violet-500/20 text-[11px] text-violet-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Interactive Demo Mode • Instant local AI responses without API keys</span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Phase 1 Preview</span>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0 text-cyan-400">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isAI
                          ? 'bg-[#131627] text-slate-200 border border-white/5 rounded-tl-sm shadow-md'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-violet-600/20'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div
                        className={`mt-1.5 text-[10px] flex items-center gap-1 ${
                          isAI ? 'text-slate-500' : 'text-violet-200'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {!isAI && (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 text-slate-300">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-[#131627] border border-white/5 flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-xs text-slate-400">Aura is analyzing your habits...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-4 py-2 bg-[#090b14] border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 pl-1 whitespace-nowrap">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Try:</span>
              </div>
              {AI_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  className="text-[11px] px-3 py-1 rounded-full bg-slate-900 border border-violet-500/20 text-slate-300 hover:text-white hover:bg-violet-950/60 hover:border-violet-500/40 whitespace-nowrap transition-all cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-4 bg-[#0d0f1e] border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Aura anything about habits, streaks, or routines..."
                className="flex-1 bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-violet-600/30 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
