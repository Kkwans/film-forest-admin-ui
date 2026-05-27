'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/** 路由 -> 面包屑标签映射 */
const ROUTE_LABELS: Record<string, string> = {
  '/': '仪表盘',
  '/content': '内容管理',
  '/crawler': '爬虫管理',
  '/stats': '数据统计',
  '/resources': '资源管理',
  '/tags': '标签管理',
  '/users': '用户管理',
  '/logs': '操作日志',
  '/settings': '系统设置',
};

export default function Breadcrumb() {
  const pathname = usePathname();

  // 登录页不显示面包屑
  if (pathname === '/login') return null;

  const currentLabel = ROUTE_LABELS[pathname];
  if (!currentLabel) return null;

  // 首页只显示首页图标，不显示完整面包屑
  const isHome = pathname === '/';

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="面包屑导航">
      <Link
        href="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {!isHome && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-foreground font-medium">{currentLabel}</span>
        </>
      )}
    </nav>
  );
}
