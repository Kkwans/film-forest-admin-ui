'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const current = theme as Theme;
    const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const btnClass = "size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center";

  if (!mounted) {
    return <button type="button" className={btnClass} aria-label="切换主题"><Sun className="w-5 h-5" /></button>;
  }

  const currentTheme = theme as Theme;

  return (
    <button type="button" onClick={cycleTheme} className={btnClass} aria-label="切换主题"
      title={currentTheme === 'light' ? '浅色' : currentTheme === 'dark' ? '深色' : '跟随系统'}>
      {currentTheme === 'light' && <Sun className="w-5 h-5" />}
      {currentTheme === 'dark' && <Moon className="w-5 h-5" />}
      {currentTheme === 'system' && <Monitor className="w-5 h-5" />}
    </button>
  );
}
