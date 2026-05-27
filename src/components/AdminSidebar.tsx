'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, Upload, BarChart3, Settings, Database, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/content', label: '内容管理', icon: Film },
  { href: '/crawler', label: '爬虫管理', icon: Upload },
  { href: '/stats', label: '数据统计', icon: BarChart3 },
  { href: '/resources', label: '资源管理', icon: Database },
  { href: '/settings', label: '系统设置', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-[60] p-2 rounded-lg bg-sidebar border border-sidebar-border md:hidden"
        aria-label="打开菜单"
      >
        <Menu className="w-5 h-5 text-sidebar-foreground" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-[56]
          w-64 bg-sidebar border-r border-sidebar-border flex flex-col
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0 md:block
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border md:hidden">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌲</span>
            <div>
              <p className="font-bold text-sidebar-foreground">影视森林</p>
              <p className="text-xs text-sidebar-foreground/60">管理后台</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-sidebar-foreground/70 hover:text-sidebar-foreground"
            aria-label="关闭菜单"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop logo */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <span className="text-2xl">🌲</span>
          <div>
            <p className="font-bold text-sidebar-foreground">影视森林</p>
            <p className="text-xs text-sidebar-foreground/60">管理后台</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sidebar-primary animate-in slide-in-from-left-1 duration-200" />}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-sidebar-primary' : 'group-hover:text-sidebar-foreground/90'}`} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-sidebar-foreground/40">运行中 · v0.1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
