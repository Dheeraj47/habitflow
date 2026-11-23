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
  // Controlled Queue: Show at most 2 notifications simultaneously to avoid vertical mobile clutter
  const visibleToasts = toasts.slice(-2);
  const hiddenCount = toasts.length - visibleToasts.length;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 sm:right-6 inset-x-3 sm:inset-x-auto z-50 flex flex-col gap-2 max-w-sm w-auto sm:w-full pointer-events-none mx-auto sm:mx-0"
    >
      {hiddenCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="self-center sm:self-end px-2.5 py-0.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-secondary)] shadow-sm"
        >
          +{hiddenCount} more queued
        </motion.div>
      )}
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
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
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'undo':
        return <Sparkles className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-cyan-500 flex-shrink-0" />;
    }
  };

  const getBorderAccent = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'undo':
        return 'border-[var(--accent-primary)]/40';
      case 'error':
        return 'border-rose-500/40';
      default:
        return 'border-[var(--border-subtle)]';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`pointer-events-auto p-3.5 rounded-xl bg-[var(--surface-base)] border ${getBorderAccent()} backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs text-[var(--text-primary)] transition-colors`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex-shrink-0">
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text-primary)] truncate">{toast.message}</p>
          {toast.subtext && (
            <p className="text-[11px] text-[var(--text-secondary)] truncate">{toast.subtext}</p>
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-subtle)] hover:bg-[var(--accent-hover)]/20 text-[var(--accent-primary)] border border-[var(--accent-border)] text-[11px] font-bold cursor-pointer transition-colors"
          >
            <Undo2 className="w-3 h-3" />
            <span>{toast.actionLabel || 'Undo'}</span>
          </motion.button>
        )}

        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
