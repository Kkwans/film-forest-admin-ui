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
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* 弹窗 */}
      <div className={`relative bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl w-full ${WIDTH_MAP[width]} max-h-[85vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 overflow-hidden`}>
        {/* 头部 */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
            <div>
              {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
              {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* 无标题时只显示关闭按钮 */}
        {!title && !description && (
          <div className="flex justify-end px-6 pt-4 shrink-0">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* 内容 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        {/* 底部按钮 */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
