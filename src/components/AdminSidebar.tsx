'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, Upload, BarChart3, Settings, Database, Users, FileText, Tags, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/content', label: '内容管理', icon: Film },
  { href: '/crawler', label: '爬虫管理', icon: Upload },
  { href: '/stats', label: '数据统计', icon: BarChart3 },
  { href: '/resources', label: '资源管理', icon: Database },
  { href: '/tags', label: '标签管理', icon: Tags },
  { href: '/users', label: '用户管理', icon: Users },
  { href: '/logs', label: '操作日志', icon: FileText },
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
        className="fixed top-3 left-3 z-[60] p-2 rounded-lg bg-sidebar border border-sidebar-border md:hidden shadow-lg"
        aria-label="打开菜单"
      >
        <Menu className="w-5 h-5 text-sidebar-foreground" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
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
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-lg">🌲</span>
            </div>
            <div>
              <p className="font-bold text-sidebar-foreground">影视森林</p>
              <p className="text-xs text-sidebar-foreground/50">管理后台</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground"
            aria-label="关闭菜单"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop logo */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center shadow-sm">
            <span className="text-lg">🌲</span>
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground tracking-tight">影视森林</p>
            <p className="text-xs text-sidebar-foreground/40">管理后台 v0.3.0</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">导航</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary shadow-[0_0_8px_var(--sidebar-primary)]" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary/15 text-sidebar-primary'
                    : 'bg-transparent text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70 group-hover:bg-sidebar-accent/60'
                }`}>
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shadow-[0_0_6px_var(--sidebar-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_oklch(0.6_0.18_145)]" />
            <p className="text-xs text-sidebar-foreground/30">运行中</p>
          </div>
        </div>
      </aside>
    </>
  );
}
