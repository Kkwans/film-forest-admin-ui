'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** 路由 -> 页面标题映射 */
const PAGE_TITLES: Record<string, string> = {
  '/': '仪表盘',
  '/content': '内容管理',
  '/crawler': '爬虫管理',
  '/stats': '数据统计',
  '/resources': '资源管理',
  '/settings': '系统设置',
  '/login': '登录',
};

/** 根据当前路由更新 document.title */
export default function PageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const pageTitle = PAGE_TITLES[pathname] || '页面不存在';
    document.title = `${pageTitle} - 影视森林管理后台`;
  }, [pathname]);

  return null;
}
