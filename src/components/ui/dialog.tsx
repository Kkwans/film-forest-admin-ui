'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogOptions {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogContextValue {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

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

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {isOpen && dialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => handleClose(false)} />
          {/* 弹窗 */}
          <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
            {/* 标题 */}
            {dialog.title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-1">
                <h3 className="text-lg font-semibold text-foreground">{dialog.title}</h3>
                <button onClick={() => handleClose(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* 内容 */}
            <div className={`px-6 ${dialog.title ? 'pt-2 pb-4' : 'pt-5 pb-4'}`}>
              <p className="text-sm text-muted-foreground leading-relaxed">{dialog.content}</p>
            </div>
            {/* 按钮 */}
            <div className="flex items-center justify-end gap-2 px-6 pb-5">
              {dialog.cancelText && (
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                disabled={loading}
                className={`px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50 transition-colors ${
                  dialog.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
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
