'use client';

import { Bell, User, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './auth-provider';

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="w-8 md:hidden" />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center"
          aria-label="通知"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors">
          <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground hidden md:block">
            {user?.nickname || user?.username || '管理员'}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center"
          aria-label="退出登录"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
