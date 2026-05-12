'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, width = 'md', footer }: ModalProps) {
  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* 弹窗 */}
      <div className={`relative bg-card border rounded-xl shadow-xl w-full ${WIDTH_MAP[width]} max-h-[85vh] flex flex-col animate-in zoom-in-95 fade-in duration-200`}>
        {/* 头部 */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-3 shrink-0">
            <div>
              {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0 ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* 无标题时只显示关闭按钮 */}
        {!title && !description && (
          <div className="flex justify-end px-6 pt-4 shrink-0">
            <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* 内容 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {children}
        </div>
        {/* 底部按钮 */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
