'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, Eye, Clock, TrendingUp, Activity, Database, ArrowRight, Play, Square, RefreshCw } from 'lucide-react';
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
}

interface CrawlerStatus {
  id: number;
  name: string;
  contentType: string;
  status: string;
  lastRunTime: string | null;
  totalItems: number;
  totalRuns: number;
}

const TYPE_LABELS: Record<string, string> = {
  movie: '电影', drama: '剧集', variety: '综艺', anime: '动漫', short_drama: '短剧', short: '短剧'
};

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  movie: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '🎬' },
  drama: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '📺' },
  variety: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: '🎤' },
  anime: { bg: 'bg-red-500/10', text: 'text-red-400', icon: '🎯' },
  short_drama: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '⚡' },
  short: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '⚡' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ movies: 0, dramas: 0, varieties: 0, animes: 0, shortDramas: 0 });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setRecentItems(items.slice(0, 6));
        }
        if (crawlerRes.data?.code === 200) {
          setCrawlerStatus(crawlerRes.data.data.schedules || []);
        }
      } catch (e) {
        console.error('fetch dashboard data error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  const totalContent = stats.movies + stats.dramas + stats.varieties + stats.animes + stats.shortDramas;

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

  const contentStats = [
    { label: '电影', value: stats.movies, color: 'from-blue-500 to-blue-600', icon: '🎬' },
    { label: '剧集', value: stats.dramas, color: 'from-purple-500 to-purple-600', icon: '📺' },
    { label: '综艺', value: stats.varieties, color: 'from-amber-500 to-amber-600', icon: '🎤' },
    { label: '动漫', value: stats.animes, color: 'from-red-500 to-red-600', icon: '🎯' },
    { label: '短剧', value: stats.shortDramas, color: 'from-emerald-500 to-emerald-600', icon: '⚡' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent" />
        <div className="relative px-6 py-8 md:px-10 md:py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Activity className="w-3 h-3" /> 管理后台
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
              影视森林<span className="text-emerald-400">管理后台</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-400 mb-6">
              内容管理 · 爬虫监控 · 数据统计 · 系统配置
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/content" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
                <Film className="w-4 h-4" /> 内容管理
              </Link>
              <Link href="/crawler" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors">
                <Activity className="w-4 h-4" /> 爬虫管理
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-zinc-400" /> 内容统计
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {contentStats.map((stat) => (
            <div key={stat.label} className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="relative">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{loading ? '-' : stat.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {/* Total */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4">
            <div className="relative">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-xs text-emerald-400/70 mb-1">内容总量</p>
              <p className="text-xl font-bold text-emerald-400">{loading ? '-' : totalContent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" /> 最近内容
            </h3>
            <Link href="/content" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {loading ? (
              <div className="px-5 py-8 text-center text-zinc-500 text-sm">加载中...</div>
            ) : recentItems.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-500 text-sm">暂无内容</div>
            ) : recentItems.map((item, i) => {
              const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.movie;
              return (
                <div key={`${item.type}-${item.id}-${i}`} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${typeStyle.bg} flex items-center justify-center text-sm shrink-0`}>
                    {typeStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.title}</p>
                    <p className="text-xs text-zinc-500">{TYPE_LABELS[item.type] || item.type} · {getRelativeTime(item.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {item.status === 1 ? '上线' : '下线'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crawler Status */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" /> 爬虫状态
            </h3>
            <Link href="/crawler" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
              管理 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {loading ? (
              <div className="px-5 py-8 text-center text-zinc-500 text-sm">加载中...</div>
            ) : crawlerStatus.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-500 text-sm">暂无爬虫配置</div>
            ) : crawlerStatus.map((task) => {
              const isRunning = task.status === 'running';
              return (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isRunning ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                    {isRunning ? <Play className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-zinc-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{task.name}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{task.totalRuns} 次运行</span>
                      <span>·</span>
                      <span>{task.totalItems?.toLocaleString()} 条数据</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className={`text-xs ${isRunning ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {isRunning ? '运行中' : '空闲'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '爬虫配置', value: crawlerStatus.length, icon: '⚙️', href: '/crawler' },
          { label: '总运行次数', value: crawlerStatus.reduce((sum, s) => sum + (s.totalRuns || 0), 0), icon: '🔄', href: '/stats' },
          { label: '总抓取量', value: crawlerStatus.reduce((sum, s) => sum + (s.totalItems || 0), 0), icon: '📊', href: '/stats' },
          { label: '运行中', value: crawlerStatus.filter(s => s.status === 'running').length, icon: '🟢', href: '/crawler' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{stat.icon}</span>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-white">{loading ? '-' : stat.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
