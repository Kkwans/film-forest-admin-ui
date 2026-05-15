'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getFullTitle } from '@/lib/metadata';

/** 根据当前路由更新 document.title */
export default function PageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = getFullTitle(pathname);
  }, [pathname]);

  return null;
}
