'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Film, Eye, Activity, Database, Clock, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { contentApi, crawlerApi } from '@/lib/api';

interface Stats {
  movies: number;
  dramas: number;
  varieties: number;
  animes: number;
  shortDramas: number;
}

interface CrawlerStats {
  total: number;
  running: number;
  idle: number;
  totalRuns: number;
  totalItems: number;
  schedules: Array<{
    name: string;
    contentType: string;
    totalRuns: number;
    totalItems: number;
    status: string;
    lastRunTime: string | null;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({ movies: 0, dramas: 0, varieties: 0, animes: 0, shortDramas: 0 });
  const [crawlerStats, setCrawlerStats] = useState<CrawlerStats>({ total: 0, running: 0, idle: 0, totalRuns: 0, totalItems: 0, schedules: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, crawlerRes] = await Promise.all([
          contentApi.getStats() as Promise<any>,
          crawlerApi.getStatus() as Promise<any>,
        ]);
        if (statsRes.data?.code === 200) setStats(statsRes.data.data);
        if (crawlerRes.data?.code === 200) {
          const d = crawlerRes.data.data;
          const schedules = d.schedules || [];
          setCrawlerStats({
            total: d.total || 0,
            running: d.running || 0,
            idle: d.idle || 0,
            totalRuns: schedules.reduce((sum: number, s: any) => sum + (s.totalRuns || 0), 0),
            totalItems: schedules.reduce((sum: number, s: any) => sum + (s.totalItems || 0), 0),
            schedules,
          });
        }
      } catch (e) {
        console.error('fetch stats error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const total = stats.movies + stats.dramas + stats.varieties + stats.animes + stats.shortDramas;

  const contentStats = [
    { label: '电影', value: stats.movies, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500', textColor: 'text-blue-400', icon: '🎬' },
    { label: '剧集', value: stats.dramas, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500', textColor: 'text-purple-400', icon: '📺' },
    { label: '综艺', value: stats.varieties, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-500', textColor: 'text-amber-400', icon: '🎤' },
    { label: '动漫', value: stats.animes, color: 'from-red-500 to-red-600', bgColor: 'bg-red-500', textColor: 'text-red-400', icon: '🎯' },
    { label: '短剧', value: stats.shortDramas, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-500', textColor: 'text-emerald-400', icon: '⚡' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">数据统计</h1>
        <p className="text-sm text-zinc-500">内容数据与爬虫运行概览</p>
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
              <p className="text-xl font-bold text-emerald-400">{loading ? '-' : total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Crawler Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-zinc-400" /> 爬虫统计
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '爬虫配置', value: crawlerStats.total, icon: '⚙️', color: 'from-blue-500 to-blue-600' },
            { label: '总运行次数', value: crawlerStats.totalRuns, icon: '🔄', color: 'from-emerald-500 to-emerald-600' },
            { label: '总抓取量', value: crawlerStats.totalItems, icon: '📊', color: 'from-amber-500 to-amber-600' },
            { label: '运行中', value: crawlerStats.running, icon: '🟢', color: 'from-green-500 to-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="relative">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{loading ? '-' : stat.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Distribution */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" /> 内容分布
            </h3>
          </div>
          <div className="p-5">
            <div className="text-3xl font-bold text-white mb-6">
              {loading ? '-' : total.toLocaleString()} <span className="text-sm font-normal text-zinc-500">内容总量</span>
            </div>
            <div className="space-y-4">
              {total > 0 && contentStats.map((stat) => {
                const pct = ((stat.value / total) * 100).toFixed(1);
                return (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{stat.icon}</span>
                        <span className="text-zinc-400">{stat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{stat.value.toLocaleString()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stat.bgColor}/10 ${stat.textColor}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Crawler Performance */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" /> 爬虫运行详情
            </h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-zinc-500">加载中...</div>
            ) : (
              <div className="space-y-3">
                {crawlerStats.schedules.map((s) => {
                  const pct = crawlerStats.totalItems > 0 ? ((s.totalItems || 0) / crawlerStats.totalItems * 100) : 0;
                  const isRunning = s.status === 'running';
                  return (
                    <div key={s.name} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                          <span className="text-sm font-medium text-white">{s.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isRunning ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {isRunning ? '运行中' : '空闲'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-zinc-500">运行次数</p>
                          <p className="text-lg font-bold text-white">{s.totalRuns?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">抓取量</p>
                          <p className="text-lg font-bold text-white">{s.totalItems?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">占比 {pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
