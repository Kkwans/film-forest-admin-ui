'use client';

import { Bell, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import Breadcrumb from './Breadcrumb';
import { useAuth } from './auth-provider';

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 md:hidden" />
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Link
          href="/logs"
          className="relative size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center"
          aria-label="操作日志"
        >
          <Bell className="w-[18px] h-[18px]" />
        </Link>
        <div className="hidden md:flex items-center gap-2.5 ml-1 px-3 py-1.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {user?.nickname || user?.username || '管理员'}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center"
          aria-label="退出登录"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
