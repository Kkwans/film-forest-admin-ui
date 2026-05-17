'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, HardDrive, Link2, Server, RefreshCw, ExternalLink, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { resourceApi } from '@/lib/api';
import type { AxiosResponse } from 'axios';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';
import { Modal } from '@/components/ui/modal';

interface ResourceStats {
  online: number;
  magnet: number;
  cloud: number;
  todayNew: number;
}

interface CloudResource {
  id: number;
  contentType: string;
  contentId: number;
  diskType: string;
  title: string;
  url: string;
  password: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

interface MagnetResource {
  id: number;
  contentType: string;
  contentId: number;
  title: string;
  magnetUrl: string;
  resolution: string;
  hasSubtitle: boolean;
  isSpecialSub: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

interface SourceSite {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
}

interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// ========== API 响应类型 ==========
interface StatsResult { code: number; data: ResourceStats; }
interface MagnetPageResult { code: number; data: PageResult<MagnetResource>; }
interface CloudPageResult { code: number; data: PageResult<CloudResource>; }
interface SourcesResult { code: number; data: SourceSite[]; }

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

const DISK_TYPE_LABELS: Record<string, string> = {
  baidu: '百度网盘',
  quark: '夸克网盘',
  thunder: '迅雷网盘',
  uc: 'UC网盘',
  ali: '阿里网盘',
  '123': '123网盘',
  ed2k: '电驴',
};

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'movie', label: '电影' },
  { value: 'drama', label: '剧集' },
  { value: 'variety', label: '综艺' },
  { value: 'anime', label: '动漫' },
  { value: 'short', label: '短剧' },
];

const RESOLUTION_OPTIONS = ['', '1080P', '4K', '720P', '2160P', 'BluRay'];

function Pagination({ current, total, pageSize, onChange }: { current: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 2 && i <= current + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return (
    <div className="flex items-center justify-between mt-4 px-4 pb-2">
      <span className="text-xs text-muted-foreground">共 {total} 条</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(current - 1)} disabled={current <= 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) => (
          typeof p === 'number' ? (
            <button key={i} onClick={() => onChange(p)} className={`w-8 h-8 rounded text-xs font-medium transition-colors ${p === current ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
              {p}
            </button>
          ) : (
            <span key={i} className="px-1 text-muted-foreground text-xs">...</span>
          )
        ))}
        <button onClick={() => onChange(current + 1)} disabled={current >= totalPages} className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const toast = useToast();
  const dialog = useDialog();
  const [stats, setStats] = useState<ResourceStats>({ online: 0, magnet: 0, cloud: 0, todayNew: 0 });
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceSite[]>([]);
  const [editingSource, setEditingSource] = useState<SourceSite | null>(null);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ magnet: true, cloud: true, sources: true });

  // ===== 磁力资源分页+筛选状态 =====
  const [magnets, setMagnets] = useState<MagnetResource[]>([]);
  const [magnetTotal, setMagnetTotal] = useState(0);
  const [magnetPage, setMagnetPage] = useState(1);
  const [magnetFilter, setMagnetFilter] = useState({ contentType: '', keyword: '' });
  const [magnetLoading, setMagnetLoading] = useState(false);

  // ===== 网盘资源分页+筛选状态 =====
  const [clouds, setClouds] = useState<CloudResource[]>([]);
  const [cloudTotal, setCloudTotal] = useState(0);
  const [cloudPage, setCloudPage] = useState(1);
  const [cloudFilter, setCloudFilter] = useState({ contentType: '', keyword: '' });
  const [cloudLoading, setCloudLoading] = useState(false);

  // ===== 编辑弹窗状态 =====
  const [editingMagnet, setEditingMagnet] = useState<Partial<MagnetResource> | null>(null);
  const [showMagnetForm, setShowMagnetForm] = useState(false);
  const [editingCloud, setEditingCloud] = useState<Partial<CloudResource> | null>(null);
  const [showCloudForm, setShowCloudForm] = useState(false);

  const PAGE_SIZE = 20;

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ===== 加载磁力资源 =====
  const fetchMagnets = useCallback(async (page = magnetPage, filter = magnetFilter) => {
    try {
      setMagnetLoading(true);
      const res = await resourceApi.listMagnet({
        page, size: PAGE_SIZE,
        contentType: filter.contentType || undefined,
        keyword: filter.keyword || undefined,
      }) as AxiosResponse<MagnetPageResult>;
      const data = res.data?.data;
      setMagnets(data?.records || []);
      setMagnetTotal(data?.total || 0);
      setMagnetPage(data?.current || page);
    } catch (e) {
      console.error('fetch magnet error', e);
      toast.error('磁力资源加载失败');
    } finally {
      setMagnetLoading(false);
    }
  }, [magnetPage, magnetFilter, toast]);

  // ===== 加载网盘资源 =====
  const fetchClouds = useCallback(async (page = cloudPage, filter = cloudFilter) => {
    try {
      setCloudLoading(true);
      const res = await resourceApi.listCloud({
        page, size: PAGE_SIZE,
        contentType: filter.contentType || undefined,
        keyword: filter.keyword || undefined,
      }) as AxiosResponse<CloudPageResult>;
      const data = res.data?.data;
      setClouds(data?.records || []);
      setCloudTotal(data?.total || 0);
      setCloudPage(data?.current || page);
    } catch (e) {
      console.error('fetch cloud error', e);
      toast.error('网盘资源加载失败');
    } finally {
      setCloudLoading(false);
    }
  }, [cloudPage, cloudFilter, toast]);

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [statsRes, sourcesRes] = await Promise.all([
        resourceApi.getStats() as Promise<AxiosResponse<StatsResult>>,
        resourceApi.listSources() as Promise<AxiosResponse<SourcesResult>>,
      ]);
      setStats(statsRes.data?.data || { online: 0, magnet: 0, cloud: 0, todayNew: 0 });
      setSources(sourcesRes.data?.data || []);
    } catch (e) {
      console.error('fetch base data error', e);
      toast.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseData();
    fetchMagnets(1);
    fetchClouds(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 磁力资源筛选 =====
  const handleMagnetSearch = () => {
    fetchMagnets(1, magnetFilter);
  };

  // ===== 网盘资源筛选 =====
  const handleCloudSearch = () => {
    fetchClouds(1, cloudFilter);
  };

  // ===== 磁力资源编辑 =====
  const handleEditMagnet = (m: MagnetResource) => {
    setEditingMagnet({ ...m });
    setShowMagnetForm(true);
  };

  const handleAddMagnet = () => {
    setEditingMagnet({ contentType: 'movie', contentId: 0, title: '', magnetUrl: '', resolution: '', hasSubtitle: false, isSpecialSub: false, sort: 0 });
    setShowMagnetForm(true);
  };

  const handleSaveMagnet = async () => {
    if (!editingMagnet) return;
    if (!editingMagnet.magnetUrl?.trim()) { toast.error('磁力链接不能为空'); return; }
    if (!editingMagnet.contentId) { toast.error('内容ID不能为空'); return; }
    try {
      await resourceApi.saveMagnet(editingMagnet as any);
      toast.success(editingMagnet.id ? '磁力资源已更新' : '磁力资源已添加');
      setShowMagnetForm(false);
      setEditingMagnet(null);
      fetchMagnets(editingMagnet.id ? magnetPage : 1);
      fetchBaseData();
    } catch {
      toast.error('保存失败');
    }
  };

  const handleDeleteMagnet = async (id: number) => {
    const ok = await dialog.confirm({ title: '删除磁力资源', content: '确定删除此磁力资源？', confirmText: '删除', cancelText: '取消', variant: 'danger' });
    if (!ok) return;
    try {
      await resourceApi.deleteMagnet(id);
      toast.success('已删除');
      fetchMagnets(magnetPage);
      fetchBaseData();
    } catch {
      toast.error('删除失败');
    }
  };

  // ===== 网盘资源编辑 =====
  const handleEditCloud = (c: CloudResource) => {
    setEditingCloud({ ...c });
    setShowCloudForm(true);
  };

  const handleAddCloud = () => {
    setEditingCloud({ contentType: 'movie', contentId: 0, title: '', diskType: 'baidu', url: '', password: '', sort: 0 });
    setShowCloudForm(true);
  };

  const handleSaveCloud = async () => {
    if (!editingCloud) return;
    if (!editingCloud.url?.trim()) { toast.error('分享链接不能为空'); return; }
    if (!editingCloud.contentId) { toast.error('内容ID不能为空'); return; }
    try {
      await resourceApi.saveCloud(editingCloud as any);
      toast.success(editingCloud.id ? '网盘资源已更新' : '网盘资源已添加');
      setShowCloudForm(false);
      setEditingCloud(null);
      fetchClouds(editingCloud.id ? cloudPage : 1);
      fetchBaseData();
    } catch {
      toast.error('保存失败');
    }
  };

  const handleDeleteCloud = async (id: number) => {
    const ok = await dialog.confirm({ title: '删除网盘资源', content: '确定删除此网盘资源？', confirmText: '删除', cancelText: '取消', variant: 'danger' });
    if (!ok) return;
    try {
      await resourceApi.deleteCloud(id);
      toast.success('已删除');
      fetchClouds(cloudPage);
      fetchBaseData();
    } catch {
      toast.error('删除失败');
    }
  };

  // ===== 资源来源 =====
  const handleToggleSource = async (id: number) => {
    const source = sources.find(s => s.id === id);
    if (!source) return;
    try {
      await resourceApi.toggleSource(id, !source.enabled);
      setSources(sources.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
      toast.success(source.enabled ? '已禁用' : '已启用');
    } catch {
      toast.error('操作失败');
    }
  };

  const handleEditSource = (source: SourceSite) => {
    setEditingSource({ ...source });
    setShowSourceForm(true);
  };

  const handleSaveSource = async () => {
    if (!editingSource || !editingSource.name.trim()) return;
    try {
      await resourceApi.saveSource(editingSource);
      toast.success('来源已保存');
      fetchBaseData();
      setShowSourceForm(false);
      setEditingSource(null);
    } catch {
      toast.error('保存失败');
    }
  };

  const handleDeleteSource = async (id: number) => {
    const ok = await dialog.confirm({ title: '删除来源', content: '确定删除此资源来源？', confirmText: '删除', cancelText: '取消', variant: 'danger' });
    if (!ok) return;
    try {
      await resourceApi.deleteSource(id);
      setSources(sources.filter(s => s.id !== id));
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleAddSource = () => {
    setEditingSource({ id: 0, name: '', url: '', enabled: true });
    setShowSourceForm(true);
  };

  // ===== 筛选栏组件 =====
  function FilterBar({ filter, setFilter, onSearch, type }: {
    filter: { contentType: string; keyword: string };
    setFilter: (f: { contentType: string; keyword: string }) => void;
    onSearch: () => void;
    type: 'magnet' | 'cloud';
  }) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filter.contentType}
          onChange={e => setFilter({ ...filter, contentType: e.target.value })}
          className="h-8 px-3 rounded-lg border bg-background text-foreground text-xs"
        >
          {CONTENT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[180px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={filter.keyword}
            onChange={e => setFilter({ ...filter, keyword: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder="搜索标题..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border bg-background text-foreground text-xs"
          />
        </div>
        <button onClick={onSearch} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
          筛选
        </button>
        {(filter.contentType || filter.keyword) && (
          <button onClick={() => { setFilter({ contentType: '', keyword: '' }); }} className="h-8 px-3 rounded-lg border text-xs text-muted-foreground hover:bg-muted transition-colors">
            重置
          </button>
        )}
        <div className="flex-1" />
        <button onClick={type === 'magnet' ? handleAddMagnet : handleAddCloud} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
          <Plus className="w-3 h-3" /> {type === 'magnet' ? '新增磁力' : '新增网盘'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">资源管理</h1>
          <p className="text-sm text-muted-foreground mt-1">媒体资源存储与来源管理</p>
        </div>
        <button onClick={() => { fetchBaseData(); fetchMagnets(magnetPage); fetchClouds(cloudPage); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: '在线资源', value: stats.online, icon: HardDrive, color: 'text-primary' },
          { label: '磁力资源', value: stats.magnet, icon: Link2, color: 'text-primary' },
          { label: '网盘资源', value: stats.cloud, icon: Database, color: 'text-primary' },
          { label: '今日新增', value: stats.todayNew, icon: Server, color: 'text-primary' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== Source Edit Modal ===== */}
      <Modal open={showSourceForm && !!editingSource} onClose={() => { setShowSourceForm(false); setEditingSource(null); }} title={editingSource?.id ? '编辑来源' : '新增来源'} width="sm"
        footer={
          <>
            <button onClick={() => { setShowSourceForm(false); setEditingSource(null); }} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveSource} disabled={!editingSource?.name.trim()} className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 transition-colors">保存</button>
          </>
        }
      >
        {editingSource && (
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">来源名称</label>
              <input value={editingSource.name} onChange={e => setEditingSource({...editingSource, name: e.target.value})} placeholder="如：七味网" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">链接地址</label>
              <input value={editingSource.url} onChange={e => setEditingSource({...editingSource, url: e.target.value})} placeholder="https://..." className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">启用状态</label>
              <button type="button" onClick={() => setEditingSource({...editingSource, enabled: !editingSource.enabled})} className={`w-10 h-5 rounded-full relative transition-colors ${editingSource.enabled ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editingSource.enabled ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Magnet Edit Modal ===== */}
      <Modal open={showMagnetForm && !!editingMagnet} onClose={() => { setShowMagnetForm(false); setEditingMagnet(null); }} title={editingMagnet?.id ? '编辑磁力资源' : '新增磁力资源'} width="md"
        footer={
          <>
            <button onClick={() => { setShowMagnetForm(false); setEditingMagnet(null); }} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveMagnet} className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">保存</button>
          </>
        }
      >
        {editingMagnet && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">内容类型</label>
                <select value={editingMagnet.contentType} onChange={e => setEditingMagnet({...editingMagnet, contentType: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm">
                  {CONTENT_TYPE_OPTIONS.filter(o => o.value).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">内容ID <span className="text-destructive">*</span></label>
                <input type="number" value={editingMagnet.contentId || ''} onChange={e => setEditingMagnet({...editingMagnet, contentId: Number(e.target.value)})} placeholder="关联内容ID" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">标题</label>
              <input value={editingMagnet.title || ''} onChange={e => setEditingMagnet({...editingMagnet, title: e.target.value})} placeholder="如：HD高清" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">磁力链接 <span className="text-destructive">*</span></label>
              <input value={editingMagnet.magnetUrl || ''} onChange={e => setEditingMagnet({...editingMagnet, magnetUrl: e.target.value})} placeholder="magnet:?xt=urn:btih:..." className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">分辨率</label>
                <select value={editingMagnet.resolution || ''} onChange={e => setEditingMagnet({...editingMagnet, resolution: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm">
                  {RESOLUTION_OPTIONS.map(r => <option key={r} value={r}>{r || '未知'}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">排序</label>
                <input type="number" value={editingMagnet.sort ?? 0} onChange={e => setEditingMagnet({...editingMagnet, sort: Number(e.target.value)})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingMagnet.hasSubtitle || false} onChange={e => setEditingMagnet({...editingMagnet, hasSubtitle: e.target.checked})} className="rounded" />
                  有字幕
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingMagnet.isSpecialSub || false} onChange={e => setEditingMagnet({...editingMagnet, isSpecialSub: e.target.checked})} className="rounded" />
                  特效字幕
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Cloud Edit Modal ===== */}
      <Modal open={showCloudForm && !!editingCloud} onClose={() => { setShowCloudForm(false); setEditingCloud(null); }} title={editingCloud?.id ? '编辑网盘资源' : '新增网盘资源'} width="md"
        footer={
          <>
            <button onClick={() => { setShowCloudForm(false); setEditingCloud(null); }} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveCloud} className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">保存</button>
          </>
        }
      >
        {editingCloud && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">内容类型</label>
                <select value={editingCloud.contentType} onChange={e => setEditingCloud({...editingCloud, contentType: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm">
                  {CONTENT_TYPE_OPTIONS.filter(o => o.value).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">内容ID <span className="text-destructive">*</span></label>
                <input type="number" value={editingCloud.contentId || ''} onChange={e => setEditingCloud({...editingCloud, contentId: Number(e.target.value)})} placeholder="关联内容ID" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">标题</label>
              <input value={editingCloud.title || ''} onChange={e => setEditingCloud({...editingCloud, title: e.target.value})} placeholder="资源标题" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">网盘类型</label>
                <select value={editingCloud.diskType} onChange={e => setEditingCloud({...editingCloud, diskType: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm">
                  {Object.entries(DISK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">排序</label>
                <input type="number" value={editingCloud.sort ?? 0} onChange={e => setEditingCloud({...editingCloud, sort: Number(e.target.value)})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">分享链接 <span className="text-destructive">*</span></label>
              <input value={editingCloud.url || ''} onChange={e => setEditingCloud({...editingCloud, url: e.target.value})} placeholder="https://pan.baidu.com/..." className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">提取密码</label>
              <input value={editingCloud.password || ''} onChange={e => setEditingCloud({...editingCloud, password: e.target.value})} placeholder="无密码留空" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Magnet Resource List ===== */}
      <Card className="bg-card border-border">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('magnet')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5" /> 磁力资源列表 <span className="text-sm font-normal text-muted-foreground">({magnetTotal})</span>
            </CardTitle>
            {expandedSections.magnet ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.magnet && (
        <CardContent>
          <FilterBar filter={magnetFilter} setFilter={setMagnetFilter} onSearch={handleMagnetSearch} type="magnet" />
          {magnetLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          ) : magnets.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>暂无磁力资源记录 — 爬虫抓取后自动更新</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="hidden md:grid grid-cols-[40px_60px_60px_1.5fr_70px_80px_50px_2fr_100px_70px] gap-2 text-xs text-muted-foreground px-4 py-2 border-b border-border">
                  <div>ID</div><div>类型</div><div>内容ID</div><div>标题</div><div>分辨率</div><div>字幕</div><div>排序</div><div>磁力链接</div><div>创建时间</div><div>操作</div>
                </div>
                {magnets.map((m) => (
                  <div key={m.id}>
                    <div className="hidden md:grid grid-cols-[40px_60px_60px_1.5fr_70px_80px_50px_2fr_100px_70px] gap-2 items-center px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm">
                      <div className="text-muted-foreground text-xs">{m.id}</div>
                      <div><Badge variant="outline" className="text-xs border-border text-muted-foreground">{m.contentType}</Badge></div>
                      <div><a href={`/content?id=${m.contentId}`} className="text-xs text-primary hover:underline">#{m.contentId}</a></div>
                      <div className="text-foreground truncate" title={m.title}>{m.title}</div>
                      <div><Badge variant="outline" className={`text-xs ${m.resolution === '1080P' || m.resolution === '4K' ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>{m.resolution || '-'}</Badge></div>
                      <div className="text-muted-foreground text-xs">{m.hasSubtitle ? '✅有字幕' : '—'}{m.isSpecialSub && <span className="ml-1 text-primary">特</span>}</div>
                      <div className="text-muted-foreground text-xs">{m.sort ?? 0}</div>
                      <div className="text-muted-foreground text-xs truncate" title={m.magnetUrl}>{m.magnetUrl ? m.magnetUrl.slice(0, 50) + '...' : '-'}</div>
                      <div className="text-muted-foreground text-xs">{formatDate(m.createdAt)}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditMagnet(m)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="编辑"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteMagnet(m.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="md:hidden flex flex-col gap-2 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm mb-2">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">{m.contentType}</Badge>
                          <span className="text-xs text-muted-foreground">ID: {m.id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditMagnet(m)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteMagnet(m.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p className="text-foreground text-sm font-medium truncate">{m.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/content?id=${m.contentId}`} className="text-xs text-primary hover:underline">内容#{m.contentId}</a>
                        <Badge variant="outline" className={`text-xs ${m.resolution === '1080P' || m.resolution === '4K' ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>{m.resolution || '-'}</Badge>
                        <span className="text-muted-foreground text-xs">{m.hasSubtitle ? '✅有字幕' : '—'}{m.isSpecialSub && <span className="ml-1 text-primary">特</span>}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Pagination current={magnetPage} total={magnetTotal} pageSize={PAGE_SIZE} onChange={(p) => fetchMagnets(p)} />
        </CardContent>
        )}
      </Card>

      {/* ===== Cloud Resource List ===== */}
      <Card className="bg-card border-border">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('cloud')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Database className="w-5 h-5" /> 网盘资源列表 <span className="text-sm font-normal text-muted-foreground">({cloudTotal})</span>
            </CardTitle>
            {expandedSections.cloud ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.cloud && (
        <CardContent>
          <FilterBar filter={cloudFilter} setFilter={setCloudFilter} onSearch={handleCloudSearch} type="cloud" />
          {cloudLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          ) : clouds.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>暂无网盘资源记录 — 爬虫抓取后自动更新</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="hidden md:grid grid-cols-[40px_60px_60px_1.5fr_80px_60px_50px_2fr_100px_70px] gap-2 text-xs text-muted-foreground px-4 py-2 border-b border-border">
                  <div>ID</div><div>类型</div><div>内容ID</div><div>标题</div><div>网盘</div><div>密码</div><div>排序</div><div>链接</div><div>创建时间</div><div>操作</div>
                </div>
                {clouds.map((c) => (
                  <div key={c.id}>
                    <div className="hidden md:grid grid-cols-[40px_60px_60px_1.5fr_80px_60px_50px_2fr_100px_70px] gap-2 items-center px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm">
                      <div className="text-muted-foreground text-xs">{c.id}</div>
                      <div><Badge variant="outline" className="text-xs border-border text-muted-foreground">{c.contentType}</Badge></div>
                      <div><a href={`/content?id=${c.contentId}`} className="text-xs text-primary hover:underline">#{c.contentId}</a></div>
                      <div className="text-foreground truncate" title={c.title}>{c.title}</div>
                      <div><Badge variant="outline" className="text-xs border-primary text-primary">{DISK_TYPE_LABELS[c.diskType] || c.diskType}</Badge></div>
                      <div className="text-muted-foreground text-xs">{c.password || '-'}</div>
                      <div className="text-muted-foreground text-xs">{c.sort ?? 0}</div>
                      <div className="text-muted-foreground text-xs truncate">
                        {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">{c.url.slice(0, 40)}...</a> : '-'}
                      </div>
                      <div className="text-muted-foreground text-xs">{formatDate(c.createdAt)}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditCloud(c)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="编辑"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteCloud(c.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="md:hidden flex flex-col gap-2 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm mb-2">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">{c.contentType}</Badge>
                          <span className="text-xs text-muted-foreground">ID: {c.id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditCloud(c)} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteCloud(c.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p className="text-foreground text-sm font-medium truncate">{c.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/content?id=${c.contentId}`} className="text-xs text-primary hover:underline">内容#{c.contentId}</a>
                        <Badge variant="outline" className="text-xs border-primary text-primary">{DISK_TYPE_LABELS[c.diskType] || c.diskType}</Badge>
                        {c.password && <span className="text-muted-foreground text-xs">密码: {c.password}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Pagination current={cloudPage} total={cloudTotal} pageSize={PAGE_SIZE} onChange={(p) => fetchClouds(p)} />
        </CardContent>
        )}
      </Card>

      {/* ===== Resource Sources ===== */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5" /> 资源来源
            </CardTitle>
            <button onClick={handleAddSource} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              <Plus className="w-3 h-3" /> 新增来源
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span className="text-foreground font-medium">{source.name}</span>
                  {source.name === '七味网' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">默认</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {source.url && source.url !== '#' && (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">{source.url}</span>
                    </a>
                  )}
                  <button onClick={() => handleToggleSource(source.id)} className="p-1 rounded hover:bg-muted" title={source.enabled ? '点击禁用' : '点击启用'}>
                    {source.enabled ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleEditSource(source)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="编辑">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteSource(source.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
