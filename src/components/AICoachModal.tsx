import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Send, 
  Bot, 
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
  initialPrompt?: string;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  completionRate,
  streakCount,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<AICoachMessage[]>(INITIAL_AI_CHAT);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCounterRef = useRef<number>(100);
  const handledInitialRef = useRef<string | null>(null);

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

  // Intelligent response generator based on question keywords & habit context
  const getSimulatedResponse = useCallback((question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('streak') || q.includes('maintain') || q.includes('mindfulness')) {
      return `To maintain your current ${streakCount}-day streak, anchor habits to existing routines (Habit Stacking). For example: "Immediately after pouring my morning coffee, I will complete 10 minutes of box breathing." Focus on never missing twice.`;
    }

    if (q.includes('consistency') || q.includes('week') || q.includes('analyze')) {
      return `Based on your metrics: Your weekly consistency is currently strong at 92%. Your keystone habit is Optimal Hydration (21-day streak). To boost adherence for evening rituals, consider scheduling a digital wind-down prompt 45 minutes before sleep.`;
    }

    if (q.includes('deep work') || q.includes('focus') || q.includes('stack')) {
      return `For deep focus sprints, use a 45/15 cadence: 45 minutes of uninterrupted single-task execution followed by 15 minutes of recovery. Before starting, close all communication apps and place your phone outside arm's reach.`;
    }

    if (q.includes('evening') || q.includes('procrastination') || q.includes('sleep')) {
      return `Evening procrastination usually stems from decision fatigue, not lack of will. Prepare your environment in advance: place your book on your nightstand in the morning and dim overhead lights 1 hour before bed.`;
    }

    return `Consistency reinforces identity: each habit you complete is a vote for the person you strive to be. You have achieved ${completionRate}% completion today — pick one small action to execute next.`;
  }, [streakCount, completionRate]);

  const handleSendMessage = useCallback((textToSend?: string) => {
    const query = textToSend || inputValue.trim();
    if (!query) return;

    msgCounterRef.current += 1;
    const userMsgId = `msg-user-${msgCounterRef.current}`;

    const userMsg: AICoachMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

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
    }, 600);
  }, [inputValue, getSimulatedResponse]);

  useEffect(() => {
    if (isOpen && initialPrompt && handledInitialRef.current !== initialPrompt) {
      handledInitialRef.current = initialPrompt;
      handleSendMessage(initialPrompt);
    }
  }, [isOpen, initialPrompt, handleSendMessage]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-coach-modal-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-2xl h-[600px] max-h-[88vh] rounded-2xl bg-[#0d1019] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#0f121d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="ai-coach-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                      AI Habit Advisor
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Behavioral Science
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Actionable habit strategies and momentum analysis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
              {messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        isAI
                          ? 'bg-[#121522] text-slate-200 border border-white/[0.06]'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div
                        className={`mt-1.5 text-[10px] flex items-center gap-1 ${
                          isAI ? 'text-slate-500' : 'text-indigo-200'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {!isAI && (
                      <div className="w-7 h-7 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0 text-slate-300 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#121522] border border-white/[0.06] flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-xs text-slate-400">Analyzing your habit data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-4 py-2 bg-[#090b12] border-t border-white/[0.06] flex gap-1.5 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 pl-1 whitespace-nowrap">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Suggested:</span>
              </div>
              {AI_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(suggestion)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-slate-300 hover:text-white hover:bg-white/[0.07] whitespace-nowrap transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3.5 bg-[#0f121d] border-t border-white/[0.06] flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about habit consistency, streak protection, or routine stacks..."
                className="flex-1 bg-[#121522] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
