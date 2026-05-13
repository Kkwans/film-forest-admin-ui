'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, Activity, Database, ArrowRight, Play, Square, RefreshCw, TrendingUp, Clock, Zap } from 'lucide-react';
import { contentApi, crawlerApi } from '@/lib/api';

interface Stats {
  movies: number;
  dramas: number;
  varieties: number;
  animes: number;
  shortDramas: number;
}

interface RecentItem {
  id: number;
  title: string;
  type: string;
  status: number;
  createdAt: string;
  scoreDouban?: number;
}

interface CrawlerStatus {
  id: number;
  name: string;
  contentType: string;
  status: string;
  enabled: number;
  lastRunTime: string | null;
  totalItems: number;
  totalRuns: number;
}

const TYPE_LABELS: Record<string, string> = {
  movie: '电影', drama: '剧集', variety: '综艺', anime: '动漫', short_drama: '短剧', short: '短剧'
};

const TYPE_ICONS: Record<string, string> = {
  movie: '🎬', drama: '📺', variety: '🎤', anime: '🎯', short_drama: '⚡', short: '⚡'
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ movies: 0, dramas: 0, varieties: 0, animes: 0, shortDramas: 0 });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [statsRes, allRes, crawlerRes] = await Promise.all([
        contentApi.getStats() as Promise<any>,
        contentApi.listAll({ page: 1, size: 20 }) as Promise<any>,
        crawlerApi.getStatus() as Promise<any>,
      ]);

      if (statsRes.data?.code === 200) setStats(statsRes.data.data);
      if (allRes.data?.code === 200) {
        const items = allRes.data.data;
        items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentItems(items.slice(0, 8));
      }
      if (crawlerRes.data?.code === 200) {
        setCrawlerStatus(crawlerRes.data.data.schedules || []);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('fetch dashboard data error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const totalContent = stats.movies + stats.dramas + stats.varieties + stats.animes + stats.shortDramas;
  const runningCrawlers = crawlerStatus.filter(s => s.status === 'running').length;
  const totalCrawlItems = crawlerStatus.reduce((sum, s) => sum + (s.totalItems || 0), 0);
  const totalCrawlRuns = crawlerStatus.reduce((sum, s) => sum + (s.totalRuns || 0), 0);

  const getRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return '刚刚';
      if (mins < 60) return `${mins}分钟前`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}小时前`;
      return `${Math.floor(hours / 24)}天前`;
    } catch { return dateStr; }
  };

  const statCards = [
    { label: '内容总量', value: totalContent, icon: Database, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', href: '/content' },
    { label: '爬虫配置', value: crawlerStatus.length, icon: Activity, color: 'text-blue-400', bgColor: 'bg-blue-500/10', href: '/crawler' },
    { label: '运行中', value: runningCrawlers, icon: Zap, color: runningCrawlers > 0 ? 'text-emerald-400' : 'text-muted-foreground', bgColor: runningCrawlers > 0 ? 'bg-emerald-500/10' : 'bg-muted', href: '/crawler' },
    { label: '总抓取量', value: totalCrawlItems, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/10', href: '/stats' },
  ];

  const contentStats = [
    { label: '电影', value: stats.movies, icon: '🎬', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { label: '剧集', value: stats.dramas, icon: '📺', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    { label: '综艺', value: stats.varieties, icon: '🎤', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    { label: '动漫', value: stats.animes, icon: '🎯', color: 'text-red-400', bgColor: 'bg-red-500/10' },
    { label: '短剧', value: stats.shortDramas, icon: '⚡', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">仪表盘</h1>
          <p className="text-sm text-muted-foreground mt-0.5">影视森林管理后台概览</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">刷新</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 hover:border-border transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{loading ? '-' : stat.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {/* Content Breakdown */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">内容分布</h2>
          <Link href="/stats" className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors flex items-center gap-1">
            详细统计 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {contentStats.map((stat) => {
            const pct = totalContent > 0 ? (stat.value / totalContent * 100) : 0;
            return (
              <div key={stat.label} className="text-center">
                <div className={`w-10 h-10 mx-auto rounded-lg ${stat.bgColor} flex items-center justify-center text-lg mb-2`}>
                  {stat.icon}
                </div>
                <p className="text-lg font-bold text-foreground">{loading ? '-' : stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {!loading && totalContent > 0 && (
                  <p className={`text-xs mt-1 ${stat.color}`}>{pct.toFixed(1)}%</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> 最近内容
            </h3>
            <Link href="/content" className="text-xs text-muted-foreground hover:text-emerald-400 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">加载中...</div>
            ) : recentItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">暂无内容</div>
            ) : recentItems.map((item, i) => (
              <div key={`${item.type}-${item.id}-${i}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0">
                  {TYPE_ICONS[item.type] || '🎬'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[item.type] || item.type}
                    {item.scoreDouban ? ` · ⭐ ${item.scoreDouban}` : ''}
                    {' · '}{getRelativeTime(item.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.status === 1
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {item.status === 1 ? '上线' : '下线'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Crawler Status */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" /> 爬虫状态
            </h3>
            <Link href="/crawler" className="text-xs text-muted-foreground hover:text-emerald-400 flex items-center gap-1 transition-colors">
              管理 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">加载中...</div>
            ) : crawlerStatus.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">暂无爬虫配置</div>
            ) : crawlerStatus.map((task) => {
              const isRunning = task.status === 'running';
              return (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isRunning ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    {isRunning ? <Play className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{task.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{task.totalRuns} 次运行</span>
                      <span>·</span>
                      <span>{task.totalItems?.toLocaleString()} 条数据</span>
                      {task.lastRunTime && (
                        <>
                          <span>·</span>
                          <span>{getRelativeTime(task.lastRunTime)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                    <span className={`text-xs ${isRunning ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {isRunning ? '运行中' : '空闲'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '内容管理', desc: '管理影视内容', icon: Film, href: '/content', color: 'text-blue-400' },
          { label: '爬虫管理', desc: '配置爬虫任务', icon: Activity, href: '/crawler', color: 'text-emerald-400' },
          { label: '数据统计', desc: '查看数据图表', icon: TrendingUp, href: '/stats', color: 'text-amber-400' },
          { label: '资源管理', desc: '管理媒体资源', icon: Database, href: '/resources', color: 'text-purple-400' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-border transition-colors group"
          >
            <action.icon className={`w-5 h-5 ${action.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground transition-colors ml-auto shrink-0" />
          </Link>
        ))}
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-muted-foreground py-2">
        上次刷新: {lastRefresh.toLocaleTimeString('zh-CN')} · 每30秒自动刷新
      </div>
    </div>
  );
}
