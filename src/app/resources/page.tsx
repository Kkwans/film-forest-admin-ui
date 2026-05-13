'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, HardDrive, Link2, Server, RefreshCw, ExternalLink, Pencil, X, Save, Plus, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react';
import { resourceApi } from '@/lib/api';
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
  episodeId: number | null;
  diskType: string;
  title: string;
  url: string;
  password: string;
  sort: number;
  createdAt: string;
}

interface MagnetResource {
  id: number;
  contentType: string;
  contentId: number;
  episodeId: number | null;
  title: string;
  magnetUrl: string;
  resolution: string;
  hasSubtitle: boolean;
  isSpecialSub: boolean;
  sort: number;
  createdAt: string;
}

interface SourceSite {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
}

function formatDate(iso: string): string {
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

export default function ResourcesPage() {
  const toast = useToast();
  const dialog = useDialog();
  const [stats, setStats] = useState<ResourceStats>({ online: 0, magnet: 0, cloud: 0, todayNew: 0 });
  const [magnets, setMagnets] = useState<MagnetResource[]>([]);
  const [clouds, setClouds] = useState<CloudResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceSite[]>([]);
  const [editingSource, setEditingSource] = useState<SourceSite | null>(null);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ magnet: true, cloud: true, sources: true });

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, magnetRes, cloudRes, sourcesRes] = await Promise.all([
        resourceApi.getStats() as Promise<any>,
        resourceApi.listMagnet() as Promise<any>,
        resourceApi.listCloud() as Promise<any>,
        resourceApi.listSources() as Promise<any>,
      ]);
      setStats(statsRes.data?.data || { online: 0, magnet: 0, cloud: 0, todayNew: 0 });
      setMagnets((magnetRes.data?.data || []).slice(0, 50));
      setClouds((cloudRes.data?.data || []).slice(0, 50));
      setSources(sourcesRes.data?.data || []);
    } catch (e) {
      console.error('fetch resource data error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">资源管理</h1>
          <p className="text-sm text-muted-foreground mt-1">媒体资源存储与来源管理</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: '在线资源', value: stats.online, icon: HardDrive, color: 'text-blue-400' },
          { label: '磁力资源', value: stats.magnet, icon: Link2, color: 'text-emerald-400' },
          { label: '网盘资源', value: stats.cloud, icon: Database, color: 'text-purple-400' },
          { label: '今日新增', value: stats.todayNew, icon: Server, color: 'text-amber-400' },
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

      {/* Source Edit Modal */}
      <Modal open={showSourceForm && !!editingSource} onClose={() => { setShowSourceForm(false); setEditingSource(null); }} title={editingSource?.id ? '编辑来源' : '新增来源'} width="sm"
        footer={
          <>
            <button onClick={() => { setShowSourceForm(false); setEditingSource(null); }} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveSource} disabled={!editingSource?.name.trim()} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 transition-colors">保存</button>
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
              <button type="button" onClick={() => setEditingSource({...editingSource, enabled: !editingSource.enabled})} className={`w-10 h-5 rounded-full relative transition-colors ${editingSource.enabled ? 'bg-emerald-600' : 'bg-muted'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editingSource.enabled ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Magnet Resource List */}
      <Card className="bg-card border-border">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('magnet')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5" /> 磁力资源列表 <span className="text-sm font-normal text-muted-foreground">({magnets.length})</span>
            </CardTitle>
            {expandedSections.magnet ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.magnet && (
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          ) : magnets.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>暂无磁力资源记录 — 爬虫抓取后自动更新</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Desktop header */}
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-muted-foreground px-4 py-2 border-b border-border">
                  <div className="col-span-1">类型</div>
                  <div className="col-span-2">标题</div>
                  <div className="col-span-2">分辨率</div>
                  <div className="col-span-2">字幕</div>
                  <div className="col-span-4">磁力链接</div>
                  <div className="col-span-1">时间</div>
                </div>
                {magnets.map((m) => (
                  <div key={m.id}>
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm">
                      <div className="col-span-1">
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{m.contentType}</Badge>
                      </div>
                      <div className="col-span-2 text-foreground truncate" title={m.title}>{m.title}</div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={`text-xs ${m.resolution === '1080P' ? 'border-blue-500 text-blue-400' : m.resolution === '4K' ? 'border-purple-500 text-purple-400' : 'border-border text-muted-foreground'}`}>{m.resolution}</Badge>
                      </div>
                      <div className="col-span-2 text-muted-foreground text-xs">{m.hasSubtitle ? '✅ 有字幕' : '—'}</div>
                      <div className="col-span-4 text-muted-foreground text-xs truncate" title={m.magnetUrl}>{m.magnetUrl ? m.magnetUrl.slice(0, 60) + '...' : '-'}</div>
                      <div className="col-span-1 text-muted-foreground text-xs">{formatDate(m.createdAt)}</div>
                    </div>
                    {/* Mobile card */}
                    <div className="md:hidden flex flex-col gap-2 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm mb-2">
                      <div className="flex items-center gap-2 justify-between">
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{m.contentType}</Badge>
                        <span className="text-muted-foreground text-xs">{formatDate(m.createdAt)}</span>
                      </div>
                      <p className="text-foreground text-sm font-medium truncate">{m.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${m.resolution === '1080P' ? 'border-blue-500 text-blue-400' : m.resolution === '4K' ? 'border-purple-500 text-purple-400' : 'border-border text-muted-foreground'}`}>{m.resolution}</Badge>
                        <span className="text-muted-foreground text-xs">{m.hasSubtitle ? '✅ 有字幕' : '—'}</span>
                      </div>
                      <p className="text-muted-foreground text-xs truncate">{m.magnetUrl ? m.magnetUrl.slice(0, 80) + '...' : '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Cloud Resource List */}
      <Card className="bg-card border-border">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('cloud')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Database className="w-5 h-5" /> 网盘资源列表 <span className="text-sm font-normal text-muted-foreground">({clouds.length})</span>
            </CardTitle>
            {expandedSections.cloud ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {expandedSections.cloud && (
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> 加载中...
            </div>
          ) : clouds.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>暂无网盘资源记录 — 爬虫抓取后自动更新</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-muted-foreground px-4 py-2 border-b border-border">
                  <div className="col-span-1">类型</div>
                  <div className="col-span-2">标题</div>
                  <div className="col-span-2">网盘</div>
                  <div className="col-span-5">链接</div>
                  <div className="col-span-1">密码</div>
                  <div className="col-span-1">时间</div>
                </div>
                {clouds.map((c) => (
                  <div key={c.id}>
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm">
                      <div className="col-span-1">
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{c.contentType}</Badge>
                      </div>
                      <div className="col-span-2 text-foreground truncate" title={c.title}>{c.title}</div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">{DISK_TYPE_LABELS[c.diskType] || c.diskType}</Badge>
                      </div>
                      <div className="col-span-5 text-muted-foreground text-xs truncate">
                        {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">{c.url.slice(0, 50)}...</a> : '-'}
                      </div>
                      <div className="col-span-1 text-muted-foreground text-xs">{c.password || '-'}</div>
                      <div className="col-span-1 text-muted-foreground text-xs">{formatDate(c.createdAt)}</div>
                    </div>
                    <div className="md:hidden flex flex-col gap-2 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-sm mb-2">
                      <div className="flex items-center gap-2 justify-between">
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{c.contentType}</Badge>
                        <span className="text-muted-foreground text-xs">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-foreground text-sm font-medium truncate">{c.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">{DISK_TYPE_LABELS[c.diskType] || c.diskType}</Badge>
                        {c.password && <span className="text-muted-foreground text-xs">密码: {c.password}</span>}
                      </div>
                      <p className="text-muted-foreground text-xs truncate">{c.url ? c.url.slice(0, 80) + '...' : '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Resource Sources - Editable */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5" /> 资源来源
            </CardTitle>
            <button onClick={handleAddSource} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-foreground transition-colors">
              <Plus className="w-3 h-3" /> 新增来源
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-emerald-400' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                  <span className="text-foreground font-medium">{source.name}</span>
                  {source.name === '七味网' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">默认</span>
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
                    {source.enabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleEditSource(source)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="编辑">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteSource(source.id)} className="p-1 rounded hover:bg-red-500/20 text-red-500" title="删除">
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
