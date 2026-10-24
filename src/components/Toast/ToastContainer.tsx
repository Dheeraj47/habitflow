import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, X, Undo2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastItem {
  id: string;
  type?: 'success' | 'info' | 'undo' | 'error';
  message: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'undo':
        return <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="pointer-events-auto p-3.5 rounded-xl bg-[#0f1222]/95 border border-violet-500/30 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-white/5">{renderIcon()}</div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-100 truncate">{toast.message}</p>
          {toast.subtext && (
            <p className="text-[11px] text-slate-400 truncate">{toast.subtext}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {toast.onAction && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              toast.onAction?.();
              onDismiss(toast.id);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 text-[11px] font-bold cursor-pointer transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            <span>{toast.actionLabel || 'Undo'}</span>
          </motion.button>
        )}

        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
