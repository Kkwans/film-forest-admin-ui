'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { DialogProvider } from '@/components/ui/dialog';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DialogProvider>
        {children}
      </DialogProvider>
    </ToastProvider>
  );
}
