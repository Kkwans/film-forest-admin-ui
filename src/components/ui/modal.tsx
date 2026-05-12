'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  sm: 'md:max-w-sm',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
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
    <div className="fixed inset-0 z-[9997] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className={cn(
        'relative bg-zinc-900 border-zinc-700/50 shadow-2xl w-full flex flex-col overflow-hidden',
        /* Mobile: full screen minus safe area */
        'h-[100dvh] md:h-auto md:max-h-[85vh] md:rounded-2xl md:border md:mx-4',
        /* Desktop: centered with max width */
        WIDTH_MAP[width],
        'animate-in duration-200',
        'md:zoom-in-95 md:fade-in',
        'slide-in-from-bottom-4 md:slide-in-from-bottom-0'
      )}>
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-zinc-800 shrink-0">
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-lg font-semibold text-white truncate">{title}</h3>}
              {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* No title - just close button */}
        {!title && !description && (
          <div className="flex justify-end px-4 md:px-6 pt-3 shrink-0">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-2 px-4 md:px-6 py-3 md:py-4 border-t border-zinc-800 bg-zinc-900/50 safe-area-inset-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
