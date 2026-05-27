'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, Activity, Database, ArrowRight, Play, Square, RefreshCw, TrendingUp, Clock, Zap, Inbox, Tags } from 'lucide-react';
import { contentApi, crawlerApi } from '@/lib/api';
import type { AxiosResponse } from 'axios';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  movies: number;
  dramas: number;
  varieties: number;
  animes: number;
  shortDramas: number;
}

interface RecentItem { id: number; title: string; type: string; status: number; createdAt: string; scoreDouban?: number; }
interface StatsResponse { code: number; data: Stats; }
interface RecentItemsResponse { code: number; data: { records: RecentItem[]; total: number } | RecentItem[]; }
interface CrawlerStatusItem { id: number; name: string; contentType: string; status: string; totalRuns: number; totalItems: number; enabled: number; lastRunTime: string | null; }
interface CrawlerStatusResponse { code: number; data: { schedules: CrawlerStatusItem[]; }; }

const TYPE_LABELS: Record<string, string> = {
  movie: '电影', drama: '剧集', variety: '综艺', anime: '动漫', short_drama: '短剧', short: '短剧'
};

const TYPE_ICONS: Record<string, string> = {
  movie: '🎬', drama: '📺', variety: '🎤', anime: '🎯', short_drama: '⚡', short: '⚡'
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ movies: 0, dramas: 0, varieties: 0, animes: 0, shortDramas: 0 });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [statsRes, allRes, crawlerRes] = await Promise.all([
        contentApi.getStats() as Promise<AxiosResponse<StatsResponse>>,
        contentApi.listAll({ page: 1, size: 20 }) as Promise<AxiosResponse<RecentItemsResponse>>,
        crawlerApi.getStatus() as Promise<AxiosResponse<CrawlerStatusResponse>>,
      ]);

      if (statsRes.data?.code === 200) setStats(statsRes.data.data);
      if (allRes.data?.code === 200) {
        const raw = allRes.data.data;
        const items: RecentItem[] = Array.isArray(raw) ? raw : (raw.records || []);
        items.sort((a: RecentItem, b: RecentItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentItems(items.slice(0, 8));
      }
      if (crawlerRes.data?.code === 200) {
        setCrawlerStatus(crawlerRes.data.data.schedules || []);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('fetch dashboard data error', e);
      toast.error('数据加载失败，请检查后端服务');
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
    { label: '内容总量', value: totalContent, icon: Database, color: 'text-primary', bgColor: 'bg-primary/10', href: '/content', gradient: 'from-primary/5 to-transparent' },
    { label: '爬虫配置', value: crawlerStatus.length, icon: Activity, color: 'text-violet-500', bgColor: 'bg-violet-500/10', href: '/crawler', gradient: 'from-violet-500/5 to-transparent' },
    { label: '运行中', value: runningCrawlers, icon: Zap, color: runningCrawlers > 0 ? 'text-emerald-500' : 'text-muted-foreground', bgColor: runningCrawlers > 0 ? 'bg-emerald-500/10' : 'bg-muted', href: '/crawler', gradient: runningCrawlers > 0 ? 'from-emerald-500/5 to-transparent' : 'from-muted/5 to-transparent' },
    { label: '总抓取量', value: totalCrawlItems, icon: TrendingUp, color: 'text-amber-500', bgColor: 'bg-amber-500/10', href: '/stats', gradient: 'from-amber-500/5 to-transparent' },
  ];

  const contentStats = [
    { label: '电影', value: stats.movies, icon: '🎬', color: 'text-muted-foreground', bgColor: 'bg-muted' },
    { label: '剧集', value: stats.dramas, icon: '📺', color: 'text-muted-foreground', bgColor: 'bg-muted' },
    { label: '综艺', value: stats.varieties, icon: '🎤', color: 'text-muted-foreground', bgColor: 'bg-muted' },
    { label: '动漫', value: stats.animes, icon: '🎯', color: 'text-muted-foreground', bgColor: 'bg-muted' },
    { label: '短剧', value: stats.shortDramas, icon: '⚡', color: 'text-primary', bgColor: 'bg-primary/10' },
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`stat-card group relative overflow-hidden rounded-xl bg-card border border-border p-4 hover:border-foreground/15 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} pointer-events-none`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                  style={{ boxShadow: 'none' }}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{loading ? <Skeleton className="h-7 w-16" /> : stat.value.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Breakdown */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-primary" />
            内容分布
          </h2>
          <Link href="/stats" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
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
                <p className="text-lg font-bold text-foreground">{loading ? <Skeleton className="h-5 w-12" /> : stat.value.toLocaleString()}</p>
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-violet-500" />
              最近内容
            </h3>
            <Link href="/content" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="divide-y divide-border/50">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">
                <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无内容</p>
                <Link href="/content" className="text-xs text-primary hover:underline mt-1 inline-block">去添加内容 →</Link>
              </div>
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
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {item.status === 1 ? '已上线' : '已下线'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Crawler Status */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-emerald-500" />
              爬虫状态
            </h3>
            <Link href="/crawler" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              管理 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="divide-y divide-border/50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                ))}
              </div>
            ) : crawlerStatus.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无爬虫配置</p>
                <Link href="/crawler" className="text-xs text-primary hover:underline mt-1 inline-block">去创建爬虫 →</Link>
              </div>
            ) : crawlerStatus.map((task) => {
              const isRunning = task.status === 'running';
              return (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isRunning ? 'bg-primary/10' : 'bg-muted'}`}>
                    {isRunning ? <Play className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
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
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                    <span className={`text-xs ${isRunning ? 'text-primary' : 'text-muted-foreground'}`}>
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
          { label: '内容管理', desc: '管理影视内容', icon: Film, href: '/content', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: '爬虫管理', desc: '配置爬虫任务', icon: Activity, href: '/crawler', color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: '数据统计', desc: '查看数据图表', icon: TrendingUp, href: '/stats', color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: '标签管理', desc: '管理内容标签', icon: Tags, href: '/tags', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { label: '资源管理', desc: '管理媒体资源', icon: Database, href: '/resources', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-foreground/10 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
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
