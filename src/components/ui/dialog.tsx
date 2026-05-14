'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogOptions {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogContextValue {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const VARIANT_STYLES = {
  default: {
    icon: <HelpCircle className="w-6 h-6 text-muted-foreground" />,
    button: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    iconBg: 'bg-muted',
  },
  danger: {
    icon: <AlertTriangle className="w-6 h-6 text-destructive" />,
    button: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    iconBg: 'bg-destructive/10',
  },
  warning: {
    icon: <Info className="w-6 h-6 text-amber-400" />,
    button: 'bg-amber-600 hover:bg-amber-500 text-white',
    iconBg: 'bg-amber-500/10',
  },
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog(options);
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  }, []);

  const alert = useCallback((message: string, title?: string): Promise<void> => {
    return new Promise(resolve => {
      setDialog({ content: message, title, confirmText: '确定', cancelText: undefined });
      setIsOpen(true);
      setResolveRef(() => (_v: boolean) => resolve());
    });
  }, []);

  const handleClose = useCallback(async (confirmed: boolean) => {
    if (loading) return;
    if (confirmed && dialog?.onConfirm) {
      setLoading(true);
      try {
        await dialog.onConfirm();
      } finally {
        setLoading(false);
      }
    }
    dialog?.onCancel?.();
    setIsOpen(false);
    resolveRef?.(confirmed);
    setDialog(null);
    setResolveRef(null);
  }, [dialog, loading, resolveRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const variant = dialog?.variant || 'default';
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {isOpen && dialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => handleClose(false)} />
          <div className="relative bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-start gap-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', variantStyle.iconBg)}>
                {variantStyle.icon}
              </div>
              <div className="flex-1 min-w-0">
                {dialog.title && <h3 className="text-lg font-semibold text-foreground">{dialog.title}</h3>}
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{dialog.content}</p>
              </div>
              <button onClick={() => handleClose(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-popover/80 backdrop-blur-sm border-t border-border">
              {dialog.cancelText && (
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                disabled={loading}
                className={cn('px-4 py-2 text-sm rounded-xl font-medium disabled:opacity-50 transition-colors', variantStyle.button)}
              >
                {loading ? '处理中...' : (dialog.confirmText || '确定')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
