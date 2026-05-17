'use client';

import { useEffect, useState, useCallback } from 'react';
import { crawlerApi, contentApi, type CrawlerSchedule } from '@/lib/api';
import type { AxiosResponse } from 'axios';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Play, Square, ToggleLeft, ToggleRight, Clock, Activity, Database, Plus, Pencil, Trash2, RefreshCw, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ========== 类型定义 ==========
interface SourceOption { id: number; name: string; url: string; type: string; enabled: number; }
// 爬虫状态 API 返回结构（直接返回 data，非 Result 包装）
interface CrawlerStatusData { total: number; running: number; idle: number; schedules: CrawlerScheduleItem[]; }
interface CrawlerScheduleItem { id: number; name: string; contentType: string; sourceSite: string; enabled: number; status: string; totalRuns: number; totalItems: number; cronExpression: string; batchSize: number; rateLimitMs: number; priority: string; genreFilter: string | null; lastRunTime: string | null; nextRunTime: string | null; }
interface LogResult { code: number; data: CrawlerTaskLog[]; }
interface SourcesResult { code: number; data: SourceOption[]; }
interface GenresResult { code: number; data: string[]; }

type CronMode = 'interval' | 'daily' | 'weekly' | 'monthly';

const WEEKDAYS = [
  { label: '周日', value: '0' }, { label: '周一', value: '1' }, { label: '周二', value: '2' },
  { label: '周三', value: '3' }, { label: '周四', value: '4' }, { label: '周五', value: '5' }, { label: '周六', value: '6' },
];

const INTERVAL_OPTIONS = [
  { label: '每10分钟', value: '*/10 * * * *' },
  { label: '每15分钟', value: '*/15 * * * *' },
  { label: '每20分钟', value: '*/20 * * * *' },
  { label: '每30分钟', value: '*/30 * * * *' },
  { label: '每1小时', value: '0 * * * *' },
  { label: '每2小时', value: '0 */2 * * *' },
  { label: '每3小时', value: '0 */3 * * *' },
  { label: '每4小时', value: '0 */4 * * *' },
  { label: '每6小时', value: '0 */6 * * *' },
  { label: '每8小时', value: '0 */8 * * *' },
  { label: '每12小时', value: '0 */12 * * *' },
  { label: '每天早8点', value: '0 8 * * *' },
  { label: '每天晚10点', value: '0 22 * * *' },
  { label: '每周一早8点', value: '0 8 * * 1' },
  { label: '每月1号早8点', value: '0 8 1 * *' },
];

function parseCronMode(expr: string): CronMode {
  if (!expr) return 'daily';
  const parts = expr.split(' ');
  if (parts.length !== 5) return 'daily';
  const [min, hour, dom, , dow] = parts;
  if (min.includes('*/') && hour === '*') return 'interval';
  if (dow !== '*' && dom === '*') return 'weekly';
  if (dom !== '*' && dow === '*') return 'monthly';
  return 'daily';
}

function buildCron(mode: CronMode, interval: string, hour: string, minute: string, dom: string, dow: string[]): string {
  switch (mode) {
    case 'interval': return interval;
    case 'daily': return `${minute} ${hour} * * *`;
    case 'weekly': return `${minute} ${hour} * * ${dow.join(',') || '1'}`;
    case 'monthly': return `${minute} ${hour} ${dom || '1'} * *`;
  }
}

function describeCron(expr: string): string {
  if (!expr) return '未设置';
  const parts = expr.split(' ');
  if (parts.length !== 5) return expr;
  const [min, hour, dom, , dow] = parts;

  if (min.startsWith('*/')) return `每${min.replace('*/', '')}分钟执行一次`;
  if (hour.startsWith('*/')) return `每${hour.replace('*/', '')}小时执行一次`;

  const h = hour.padStart(2, '0');
  const m = min.padStart(2, '0');
  if (dom === '*' && dow === '*') return `每天 ${h}:${m} 执行`;

  if (dom === '*' && dow !== '*') {
    const dayNames = dow.split(',').map(d => WEEKDAYS.find(w => w.value === d)?.label || d);
    return `每${dayNames.join('、')} ${h}:${m} 执行`;
  }

  if (dom !== '*' && dow === '*') return `每月${dom}号 ${h}:${m} 执行`;

  return expr;
}

function CronBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<CronMode>(() => parseCronMode(value));
  const [interval, setInterval] = useState(value || '*/30 * * * *');
  const [hour, setHour] = useState('2');
  const [minute, setMinute] = useState('0');
  const [dom, setDom] = useState('1');
  const [dow, setDow] = useState<string[]>(['1']);

  useEffect(() => {
    const m = parseCronMode(value);
    setMode(m);
    if (m === 'interval') setInterval(value);
    else {
      const parts = value.split(' ');
      if (parts.length === 5) {
        setMinute(parts[0]);
        setHour(parts[1]);
        setDom(parts[2] === '*' ? '1' : parts[2]);
        if (parts[4] !== '*') setDow(parts[4].split(','));
      }
    }
  }, [value]);

  const update = (newMode: CronMode, newInterval?: string, newHour?: string, newMinute?: string, newDom?: string, newDow?: string[]) => {
    const result = buildCron(newMode, newInterval || interval, newHour || hour, newMinute || minute, newDom || dom, newDow || dow);
    onChange(result);
  };

  const handleModeChange = (newMode: CronMode) => {
    setMode(newMode);
    // 从当前 cron 中提取时分，确保模式切换时不丢失时间设置
    const parts = (value || '').split(' ');
    const curMin = parts.length === 5 ? parts[0] : minute;
    const curHour = parts.length === 5 ? parts[1] : hour;
    if (newMode === 'interval') {
      update(newMode, interval);
    } else if (newMode === 'daily') {
      setHour(curHour);
      setMinute(curMin);
      update(newMode, undefined, curHour, curMin);
    } else if (newMode === 'weekly') {
      setHour(curHour);
      setMinute(curMin);
      update(newMode, undefined, curHour, curMin);
    } else if (newMode === 'monthly') {
      setHour(curHour);
      setMinute(curMin);
      update(newMode, undefined, curHour, curMin);
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ label: `${String(i).padStart(2, '0')}时`, value: String(i) }));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5).map(i => ({ label: `${String(i).padStart(2, '0')}分`, value: String(i) }));
  const domOptions = Array.from({ length: 28 }, (_, i) => ({ label: `${i + 1}号`, value: String(i + 1) }));

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 md:p-4 space-y-3 md:space-y-4">
      {/* 模式选择 */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'interval' as CronMode, label: '定时间隔' },
          { key: 'daily' as CronMode, label: '每天定时' },
          { key: 'weekly' as CronMode, label: '每周定时' },
          { key: 'monthly' as CronMode, label: '每月定时' },
        ]).map(opt => (
          <button key={opt.key} type="button" onClick={() => handleModeChange(opt.key)}
            className={`px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors ${mode === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'interval' && (
        <div className="grid gap-2">
          <label className="text-xs text-muted-foreground">选择间隔</label>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {INTERVAL_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => { setInterval(opt.value); onChange(opt.value); }}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${interval === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {/* 自定义间隔输入 */}
          <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-muted-foreground">自定义：</label>
            <input
              type="number"
              min={1}
              max={1440}
              placeholder="分钟"
              className="w-20 h-8 px-2 rounded-lg border bg-background text-foreground text-xs"
              onChange={e => {
                const val = parseInt(e.target.value);
                if (val > 0 && val <= 1440) {
                  const cron = val >= 60 && val % 60 === 0
                    ? `0 */${val / 60} * * *`
                    : `*/${val} * * * *`;
                  setInterval(cron);
                  onChange(cron);
                }
              }}
            />
            <span className="text-xs text-muted-foreground">分钟</span>
          </div>
        </div>
      )}

      {mode === 'daily' && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="text-sm text-muted-foreground">每天</span>
          <Select value={hour} onChange={v => { setHour(v); update(mode, undefined, v); }} options={hourOptions} className="w-20 md:w-24" size="sm" />
          <Select value={minute} onChange={v => { setMinute(v); update(mode, undefined, undefined, v); }} options={minuteOptions} className="w-20 md:w-24" size="sm" />
          <span className="text-sm text-muted-foreground">执行</span>
        </div>
      )}

      {mode === 'weekly' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {WEEKDAYS.map(d => (
              <button key={d.value} type="button" onClick={() => {
                const newDow = dow.includes(d.value) ? dow.filter(x => x !== d.value) : [...dow, d.value];
                setDow(newDow); update(mode, undefined, undefined, undefined, undefined, newDow);
              }}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${dow.includes(d.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">时间</span>
            <Select value={hour} onChange={v => { setHour(v); update(mode, undefined, v); }} options={hourOptions} className="w-20 md:w-24" size="sm" />
            <Select value={minute} onChange={v => { setMinute(v); update(mode, undefined, undefined, v); }} options={minuteOptions} className="w-20 md:w-24" size="sm" />
          </div>
        </div>
      )}

      {mode === 'monthly' && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="text-sm text-muted-foreground">每月</span>
          <Select value={dom} onChange={v => { setDom(v); update(mode, undefined, undefined, undefined, v); }} options={domOptions} className="w-20 md:w-24" size="sm" />
          <Select value={hour} onChange={v => { setHour(v); update(mode, undefined, v); }} options={hourOptions} className="w-20 md:w-24" size="sm" />
          <Select value={minute} onChange={v => { setMinute(v); update(mode, undefined, undefined, v); }} options={minuteOptions} className="w-20 md:w-24" size="sm" />
        </div>
      )}

      {/* 预览 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground">{describeCron(value)}</span>
        <span className="text-xs text-muted-foreground font-mono ml-auto hidden sm:inline">{value}</span>
      </div>
    </div>
  );
}

// ========== 页面主组件 ==========

function formatTime(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string | null): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

const TYPE_MAP: Record<string, string> = {
  movie: '🎬 电影', drama: '📺 剧集', variety: '🎤 综艺', anime: '🎯 动漫', short: '⚡ 短剧'
};

const PRIORITY_OPTIONS = [
  { label: '按评分从高到低', value: 'by_score' },
  { label: '按热度从高到低', value: 'by_hot' },
];

interface ScheduleForm {
  id?: number;
  name: string;
  contentType: string;
  sourceSite: string;
  cronExpression: string;
  batchSize: number;
  rateLimitMs: number;
  priority: string;
  genreFilter: string;
  enabled: number;
}

interface SourceOption {
  id: number;
  name: string;
  url: string;
}

interface CrawlerTaskLog {
  id: number;
  scheduleId: number;
  scheduleName: string;
  contentType: string;
  status: string;
  itemsCrawled: number;
  itemsAdded: number;
  itemsUpdated: number;
  errorMessage: string | null;
  durationMs: number;
  startedAt: string;
  finishedAt: string | null;
}

const EMPTY_FORM: ScheduleForm = {
  name: '',
  contentType: 'movie',
  sourceSite: '七味网',
  cronExpression: '0 2 * * *',
  batchSize: 20,
  rateLimitMs: 1000,
  priority: 'by_score',
  genreFilter: '',
  enabled: 1,
};

export default function CrawlerPage() {
  const toast = useToast();
  const dialog = useDialog();
  const [schedules, setSchedules] = useState<CrawlerScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, running: 0, idle: 0 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [logs, setLogs] = useState<CrawlerTaskLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await crawlerApi.getStatus() as AxiosResponse<{ code: number; data: CrawlerStatusData }>;
      const statusData = res.data?.data;
      const data = statusData?.schedules || [];
      setSchedules(data);
      setStats({
        total: statusData?.total ?? data.length,
        running: statusData?.running ?? data.filter((s: CrawlerScheduleItem) => s.status === 'running').length,
        idle: statusData?.idle ?? data.filter((s: CrawlerScheduleItem) => s.status !== 'running').length,
      });
    } catch (e) {
      console.error('fetch schedules error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await crawlerApi.listLogs() as AxiosResponse<LogResult>;
      setLogs(res.data?.data || []);
      setLogsLoaded(true);
    } catch (e) {
      console.error('fetch logs error', e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // 预加载日志（获取条数）
  useEffect(() => {
    if (!logsLoaded) {
      fetchLogs();
    }
  }, [logsLoaded, fetchLogs]);

  // 加载资源来源列表
  useEffect(() => {
    crawlerApi.listSources().then((res: AxiosResponse<SourcesResult>) => {
      const data = res.data;
      if (data?.code === 200) setSources(data.data || []);
    }).catch(e => console.error('加载资源来源失败', e));
  }, []);

  // 当 contentType 变化时加载 genre 列表
  useEffect(() => {
    if (showForm) {
      contentApi.getGenres(form.contentType).then((res: AxiosResponse<GenresResult>) => {
        const data = res.data;
        if (data?.code === 200) setGenres(data.data || []);
      }).catch(e => { console.error('加载类型列表失败', e); setGenres([]); });
    }
  }, [form.contentType, showForm]);

  const handleStart = async (id: number) => {
    setActionId(id);
    try { await crawlerApi.start(id); toast.success('爬虫已启动'); await fetchSchedules(); } catch (e) { toast.error('启动失败'); console.error(e); } finally { setActionId(null); }
  };

  const handleStop = async (id: number) => {
    setActionId(id);
    try { await crawlerApi.stop(id); toast.success('爬虫已停止'); await fetchSchedules(); } catch (e) { toast.error('停止失败'); console.error(e); } finally { setActionId(null); }
  };

  const handleToggle = async (schedule: CrawlerScheduleItem) => {
    try { await crawlerApi.toggleEnabled(schedule.id, schedule.enabled !== 1); toast.success(schedule.enabled ? '已禁用' : '已启用'); await fetchSchedules(); } catch (e) { toast.error('操作失败'); console.error(e); }
  };

  const handleDelete = async (id: number) => {
    const ok = await dialog.confirm({ title: '删除配置', content: '确定删除此爬虫配置？删除后不可恢复。', confirmText: '删除', cancelText: '取消', variant: 'danger' });
    if (!ok) return;
    try { await crawlerApi.deleteSchedule(id); toast.success('已删除'); await fetchSchedules(); } catch (e) { toast.error('删除失败'); console.error(e); }
  };

  const parseGenreFilterForDisplay = (gf: string | null): string => {
    if (!gf) return '';
    try {
      const arr = JSON.parse(gf);
      if (Array.isArray(arr)) return arr.join('，');
    } catch {}
    return gf;
  };

  const handleEdit = (schedule: CrawlerScheduleItem) => {
    setForm({
      id: schedule.id,
      name: schedule.name,
      contentType: schedule.contentType,
      sourceSite: schedule.sourceSite,
      cronExpression: schedule.cronExpression,
      batchSize: schedule.batchSize,
      rateLimitMs: schedule.rateLimitMs,
      priority: schedule.priority,
      genreFilter: parseGenreFilterForDisplay(schedule.genreFilter),
      enabled: schedule.enabled,
    });
    try {
      if (schedule.genreFilter) {
        const arr = JSON.parse(schedule.genreFilter);
        setSelectedGenres(Array.isArray(arr) ? arr : []);
      } else {
        setSelectedGenres([]);
      }
    } catch { setSelectedGenres([]); }
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const submitData: { name: string; contentType: string; sourceSite: string; cronExpression: string; batchSize: number; rateLimitMs: number; priority: string; genreFilter: string; enabled: number; id?: number } = {
        name: form.name,
        contentType: form.contentType,
        sourceSite: form.sourceSite,
        cronExpression: form.cronExpression,
        batchSize: form.batchSize,
        rateLimitMs: form.rateLimitMs,
        priority: form.priority,
        genreFilter: selectedGenres.length > 0 ? JSON.stringify(selectedGenres) : '',
        enabled: form.enabled,
      };
      if (editingId) submitData.id = editingId;
      await crawlerApi.saveSchedule(submitData);
      toast.success(editingId ? '配置已更新' : '配置已创建');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setSelectedGenres([]);
      await fetchSchedules();
    } catch (e) { toast.error('保存失败'); console.error(e); } finally { setSaving(false); }
  };

  const handleCreateNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSelectedGenres([]);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">爬虫管理</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">配置定时爬虫任务，监控抓取进度</p>
        </div>
        <button onClick={handleCreateNew} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
          <Plus className="w-4 h-4" /> 新建配置
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg border bg-card">
          <Database className="w-5 h-5 md:w-6 md:h-6 text-primary opacity-60 shrink-0" />
          <div><p className="text-xs text-muted-foreground">配置总数</p><p className="text-lg md:text-xl font-bold text-foreground">{stats.total}</p></div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg border bg-card">
          <Activity className="w-5 h-5 md:w-6 md:h-6 text-primary opacity-60 shrink-0" />
          <div><p className="text-xs text-muted-foreground">运行中</p><p className="text-lg md:text-xl font-bold text-foreground">{stats.running}</p></div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg border bg-card">
          <Clock className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground opacity-60 shrink-0" />
          <div><p className="text-xs text-muted-foreground">空闲</p><p className="text-lg md:text-xl font-bold text-foreground">{stats.idle}</p></div>
        </div>
      </div>

      {/* Config Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? '编辑配置' : '新建配置'} width="lg"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 transition-colors">
              {saving ? '保存中...' : '保存配置'}
            </button>
          </>
        }
      >
        <div className="space-y-4 md:space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">配置名称 <span className="text-destructive">*</span></label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="如：电影每日爬取" className="h-10 px-3 rounded-lg border bg-background text-foreground text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">内容类型</label>
              <Select value={form.contentType} onChange={v => setForm({...form, contentType: v})} options={Object.entries(TYPE_MAP).map(([k, v]) => ({ label: v, value: k }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">资源来源</label>
              <Select value={form.sourceSite} onChange={v => setForm({...form, sourceSite: v})} options={sources.length > 0 ? sources.map(s => ({ label: s.name, value: s.name })) : [{ label: '七味网', value: '七味网' }]} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">优先级</label>
              <Select value={form.priority} onChange={v => setForm({...form, priority: v})} options={PRIORITY_OPTIONS} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">启用状态</label>
              <div className="flex items-center gap-2 h-10">
                <button type="button" onClick={() => setForm({...form, enabled: form.enabled ? 0 : 1})} className={`w-10 h-5 rounded-full relative transition-colors ${form.enabled ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-muted-foreground">{form.enabled ? '已启用' : '已禁用'}</span>
              </div>
            </div>
          </div>
          {/* Genre 多选 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">类型筛选（留空爬全部）</label>
            {genres.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-lg border bg-background">
                {genres.map(g => (
                  <label key={g} className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(g)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedGenres(prev => [...prev, g]);
                        } else {
                          setSelectedGenres(prev => prev.filter(x => x !== g));
                        }
                      }}
                      className="rounded accent-primary"
                    />
                    {g}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">切换内容类型后自动加载...</p>
            )}
            {selectedGenres.length > 0 && (
              <p className="text-xs text-muted-foreground">已选 {selectedGenres.length} 项: {selectedGenres.join('，')}</p>
            )}
          </div>
          {/* Cron 可视化构建器 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">定时规则</label>
            <CronBuilder value={form.cronExpression} onChange={v => setForm({...form, cronExpression: v})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">每批数量</label>
              <input type="number" min={1} max={1000} value={form.batchSize} onChange={e => setForm({...form, batchSize: Math.min(1000, Math.max(1, Number(e.target.value)))})} className="h-10 px-3 rounded-lg border bg-background text-foreground text-sm" />
              <p className="text-xs text-muted-foreground">1-1000</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">请求间隔 (ms)</label>
              <input type="number" min={200} step={100} value={form.rateLimitMs} onChange={e => setForm({...form, rateLimitMs: Math.max(200, Number(e.target.value))})} className="h-10 px-3 rounded-lg border bg-background text-foreground text-sm" />
              <p className="text-xs text-muted-foreground">最小 200ms</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Table - Desktop / Cards - Mobile */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-muted-foreground">名称</th>
                <th className="text-left p-3 font-medium text-muted-foreground">类型</th>
                <th className="text-left p-3 font-medium text-muted-foreground">定时</th>
                <th className="text-left p-3 font-medium text-muted-foreground">批量</th>
                <th className="text-left p-3 font-medium text-muted-foreground">间隔</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">优先级</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">上次</th>
                <th className="text-left p-3 font-medium text-muted-foreground">状态</th>
                <th className="text-right p-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /><span className="text-sm">加载中...</span></td></tr>
              ) : schedules.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">暂无配置，点击"新建配置"开始</td></tr>
              ) : schedules.map((s) => {
                const isRunning = s.status === 'running';
                const isLoading = actionId === s.id;
                return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{s.name}</td>
                    <td className="p-3 text-muted-foreground text-xs">{TYPE_MAP[s.contentType] || s.contentType}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{s.cronExpression}</td>
                    <td className="p-3 text-muted-foreground">{s.batchSize}</td>
                    <td className="p-3 text-muted-foreground">{s.rateLimitMs}ms</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{PRIORITY_OPTIONS.find(o => o.value === s.priority)?.label || s.priority}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell text-xs">{timeAgo(s.lastRunTime)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isRunning ? 'bg-primary/20 text-primary dark:text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        {isRunning ? '运行中' : '空闲'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isRunning ? (
                          <button onClick={() => handleStop(s.id)} disabled={isLoading} className="p-1.5 rounded hover:bg-destructive/20 text-destructive disabled:opacity-50" title="停止">
                            <Square className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleStart(s.id)} disabled={isLoading} className="p-1.5 rounded hover:bg-primary/20 text-primary dark:text-primary disabled:opacity-50" title="启动">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleToggle(s)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title={s.enabled ? '禁用' : '启用'}>
                          {s.enabled ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(s)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="编辑">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-destructive/20 text-destructive" title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /><span className="text-sm">加载中...</span></div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">暂无配置，点击"新建配置"开始</div>
          ) : schedules.map((s) => {
            const isRunning = s.status === 'running';
            const isLoading = actionId === s.id;
            return (
              <div key={s.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{s.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{TYPE_MAP[s.contentType] || s.contentType}</span>
                      <span className="text-xs text-muted-foreground font-mono">{s.cronExpression}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isRunning ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        {isRunning ? '运行中' : '空闲'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isRunning ? (
                      <button onClick={() => handleStop(s.id)} disabled={isLoading} className="p-2 rounded hover:bg-destructive/20 text-destructive disabled:opacity-50">
                        <Square className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleStart(s.id)} disabled={isLoading} className="p-2 rounded hover:bg-primary/20 text-primary disabled:opacity-50">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(s)} className="p-2 rounded hover:bg-muted text-muted-foreground">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded hover:bg-destructive/20 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>批量: {s.batchSize}</span>
                  <span>间隔: {s.rateLimitMs}ms</span>
                  <span>上次: {timeAgo(s.lastRunTime)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Logs Section */}
      <div className="rounded-lg border bg-card">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">任务日志</span>
            <span className="text-xs text-muted-foreground">({logs.length} 条)</span>
          </div>
          {showLogs ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showLogs && (
          <div className="border-t">
            {logsLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 inline" /> 加载中...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">暂无任务日志</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-muted-foreground">任务</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">类型</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">状态</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">抓取</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">新增</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">更新</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">耗时</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">开始时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-foreground font-medium">{log.scheduleName || '-'}</td>
                          <td className="p-3 text-muted-foreground text-xs">{TYPE_MAP[log.contentType] || log.contentType}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.status === 'success' ? 'bg-primary/20 text-primary dark:text-primary' :
                              log.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                              log.status === 'running' ? 'bg-primary/20 text-primary dark:text-primary' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {log.status === 'success' ? '✅ 成功' : log.status === 'failed' ? '❌ 失败' : log.status === 'running' ? '🔄 运行中' : log.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{log.itemsCrawled || 0}</td>
                          <td className="p-3 text-primary">+{log.itemsAdded || 0}</td>
                          <td className="p-3 text-primary hidden lg:table-cell">{log.itemsUpdated || 0}</td>
                          <td className="p-3 text-muted-foreground hidden lg:table-cell text-xs">{log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : '-'}</td>
                          <td className="p-3 text-muted-foreground text-xs">{formatTime(log.startedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{log.scheduleName || '-'}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          log.status === 'success' ? 'bg-primary/20 text-primary' :
                          log.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                          log.status === 'running' ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {log.status === 'success' ? '✅' : log.status === 'failed' ? '❌' : log.status === 'running' ? '🔄' : ''}{log.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>抓取: {log.itemsCrawled || 0}</span>
                        <span className="text-primary">新增: +{log.itemsAdded || 0}</span>
                        <span className="text-primary">更新: {log.itemsUpdated || 0}</span>
                        {log.durationMs && <span>耗时: {(log.durationMs / 1000).toFixed(1)}s</span>}
                        <span>{formatTime(log.startedAt)}</span>
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            {logs.some(l => l.errorMessage) && (
              <div className="p-4 border-t">
                <p className="text-sm font-medium text-foreground mb-2">错误详情</p>
                {logs.filter(l => l.errorMessage).map((log) => (
                  <div key={log.id} className="mb-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-muted-foreground mb-1">{log.scheduleName} — {formatTime(log.startedAt)}</p>
                    <p className="text-sm text-destructive break-all">{log.errorMessage}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
