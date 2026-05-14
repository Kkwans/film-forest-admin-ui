'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Eye, AlertCircle, Inbox } from 'lucide-react';
import { contentApi } from '@/lib/api';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// ========== 类型分发工具 ==========

/** 根据内容类型分发 API 调用 */
function dispatchByType<T>(
  type: ContentRecord['type'],
  handlers: {
    movie: () => T;
    drama: () => T;
    variety: () => T;
    anime: () => T;
    short_drama: () => T;
  }
): T {
  return handlers[type]();
}

// ========== 表单类型定义 ==========

interface EditForm {
  title: string;
  year: string;
  scoreDouban: string;
  scoreImdb: string;
  scoreRt: string;
  genre: string;
  region: string;
  language: string;
  director: string;
  writer: string;
  actor: string;
  storyline: string;
  duration: string;
  releaseDate: string;
  alias: string;
  status: number;
  type: ContentRecord['type'];
}

const EMPTY_FORM: EditForm = {
  title: '', year: '', scoreDouban: '', scoreImdb: '', scoreRt: '',
  genre: '', region: '', language: '', director: '', writer: '',
  actor: '', storyline: '', duration: '', releaseDate: '', alias: '',
  status: 1, type: 'movie',
};

const TYPE_OPTIONS = [
  { label: '电影', value: 'movie' },
  { label: '剧集', value: 'drama' },
  { label: '综艺', value: 'variety' },
  { label: '动漫', value: 'anime' },
  { label: '短剧', value: 'short_drama' },
];

/** 解析 JSON 数组为逗号分隔字符串 */
function parseJsonArray(json: string | undefined): string {
  if (!json) return '';
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join('，') : json;
  } catch { return json; }
}

/** 从表单数据构建提交用的数据对象 */
function buildSubmitData(form: EditForm) {
  const parseArr = (v: string) =>
    v ? JSON.stringify(v.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null;
  return {
    title: form.title,
    year: form.year ? Number(form.year) : null,
    scoreDouban: form.scoreDouban ? Number(form.scoreDouban) : null,
    scoreImdb: form.scoreImdb ? Number(form.scoreImdb) : null,
    scoreRt: form.scoreRt ? Number(form.scoreRt) : null,
    genre: parseArr(form.genre),
    region: parseArr(form.region),
    language: parseArr(form.language),
    director: parseArr(form.director),
    writer: parseArr(form.writer),
    actor: parseArr(form.actor),
    storyline: form.storyline || null,
    duration: form.duration ? Number(form.duration) : null,
    releaseDate: form.releaseDate || null,
    alias: parseArr(form.alias),
    status: form.status,
  };
}

// ========== 表单字段组件 ==========

function ContentFormFields({ form, onChange, showStatus = false }: {
  form: EditForm;
  onChange: (form: EditForm) => void;
  showStatus?: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="内容类型">
          <Select value={form.type} onChange={v => onChange({ ...form, type: v as ContentRecord['type'] })} options={TYPE_OPTIONS} />
        </Field>
        <Field label="年份">
          <input value={form.year} onChange={e => onChange({ ...form, year: e.target.value })} placeholder="2026" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
      </div>
      <Field label="标题">
        <input value={form.title} onChange={e => onChange({ ...form, title: e.target.value })} placeholder="输入内容标题" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="豆瓣评分">
          <input value={form.scoreDouban} onChange={e => onChange({ ...form, scoreDouban: e.target.value })} placeholder="8.5" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
        <Field label="类型（逗号分隔）">
          <input value={form.genre} onChange={e => onChange({ ...form, genre: e.target.value })} placeholder="剧情，喜剧" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="地区（逗号分隔）">
          <input value={form.region} onChange={e => onChange({ ...form, region: e.target.value })} placeholder="中国大陆" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
        <Field label="导演（逗号分隔）">
          <input value={form.director} onChange={e => onChange({ ...form, director: e.target.value })} placeholder="张三" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
      </div>
      <Field label="演员（逗号分隔）">
        <input value={form.actor} onChange={e => onChange({ ...form, actor: e.target.value })} placeholder="演员A，演员B" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="语言（逗号分隔）">
          <input value={form.language} onChange={e => onChange({ ...form, language: e.target.value })} placeholder="英语，汉语" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
        <Field label="编剧（逗号分隔）">
          <input value={form.writer} onChange={e => onChange({ ...form, writer: e.target.value })} placeholder="编剧A" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
      </div>
      {showStatus && (
        <Field label="状态">
          <div className="flex items-center gap-2 h-9">
            <button type="button" onClick={() => onChange({ ...form, status: form.status === 1 ? 0 : 1 })} className={`w-10 h-5 rounded-full relative transition-colors ${form.status === 1 ? 'bg-primary' : 'bg-muted'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.status === 1 ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-muted-foreground">{form.status === 1 ? '已上线' : '已下线'}</span>
          </div>
        </Field>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="时长（分钟）">
          <input value={form.duration} onChange={e => onChange({ ...form, duration: e.target.value })} placeholder="120" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
        <Field label="上映日期">
          <input value={form.releaseDate} onChange={e => onChange({ ...form, releaseDate: e.target.value })} placeholder="2026-03-20" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="IMDb 评分">
          <input value={form.scoreImdb} onChange={e => onChange({ ...form, scoreImdb: e.target.value })} placeholder="8.3" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
        <Field label="RT 评分（%）">
          <input value={form.scoreRt} onChange={e => onChange({ ...form, scoreRt: e.target.value })} placeholder="95" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
        </Field>
      </div>
      <Field label="又名（逗号分隔）">
        <input value={form.alias} onChange={e => onChange({ ...form, alias: e.target.value })} placeholder="极限返航，末日圣母号" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
      </Field>
      <Field label="剧情简介">
        <textarea value={form.storyline} onChange={e => onChange({ ...form, storyline: e.target.value })} rows={3} className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm resize-none" />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

interface ContentRecord {
  id: number;
  title: string;
  type: 'movie' | 'drama' | 'variety' | 'anime' | 'short_drama';
  posterUrl?: string;
  year?: number;
  scoreDouban?: number;
  scoreImdb?: number;
  scoreRt?: number;
  genre?: string;
  region?: string;
  language?: string;
  director?: string;
  writer?: string;
  actor?: string;
  storyline?: string;
  duration?: number;
  releaseDate?: string;
  alias?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  movie: '电影', drama: '剧集', variety: '综艺', anime: '动漫', short_drama: '短剧'
};

const TYPE_ICON_EMOJI: Record<string, string> = {
  movie: '🎬', drama: '📺', variety: '🎤', anime: '🎯', short_drama: '⚡'
};

type FilterType = 'all' | 'movie' | 'drama' | 'variety' | 'anime' | 'short_drama';
type StatusFilter = 'all' | '1' | '0';

export default function ContentPage() {
  const toast = useToast();
  const dialog = useDialog();
  const [items, setItems] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let records: ContentRecord[] = [];
      let totalCount = 0;
      const types: FilterType[] = typeFilter === 'all'
        ? ['movie', 'drama', 'variety', 'anime', 'short_drama']
        : [typeFilter];

      const results = await Promise.allSettled(
        types.map(t => {
          const params: any = { page, size: pageSize };
          if (keyword) params.keyword = keyword;
          switch (t) {
            case 'movie': return contentApi.listMovies(params);
            case 'drama': return contentApi.listDramas(params);
            case 'variety': return contentApi.listVarieties(params);
            case 'anime': return contentApi.listAnimes(params);
            case 'short_drama': return contentApi.listShortDramas(params);
          }
        })
      );

      let idx = 0;
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const res = result.value;
          if (res.data?.code === 200) {
            const recs: ContentRecord[] = (res.data.data.records || []).map((r: any) => ({
              ...r,
              type: types[idx],
            }));
            records.push(...recs);
            totalCount += res.data.data.total || 0;
          }
        }
        idx++;
      }

      // Filter by status
      if (statusFilter !== 'all') {
        records = records.filter(i => String(i.status) === statusFilter);
      }

      // Sort by createdAt desc
      records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setItems(records);
      setTotal(totalCount);
    } catch (e: any) {
      setError(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, keyword, page, pageSize]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Stats per type
  const [stats, setStats] = useState({ movies: 0, dramas: 0, varieties: 0, animes: 0, shortDramas: 0 });
  useEffect(() => {
    contentApi.getStats().then(res => {
      if (res.data?.code === 200) setStats(res.data.data);
    }).catch(() => {});
  }, []);

  const filtered = items;
  const typeCountMap: Record<string, number> = {
    movie: stats.movies,
    drama: stats.dramas,
    variety: stats.varieties,
    anime: stats.animes,
    short_drama: stats.shortDramas,
  };

  const handleDelete = async (id: number, type: ContentRecord['type']) => {
    const ok = await dialog.confirm({ title: '删除内容', content: '确定删除此内容？删除后不可恢复。', confirmText: '删除', cancelText: '取消', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await dispatchByType(type, {
        movie: () => contentApi.deleteMovie(id),
        drama: () => contentApi.deleteDrama(id),
        variety: () => contentApi.deleteVariety(id),
        anime: () => contentApi.deleteAnime(id),
        short_drama: () => contentApi.deleteShortDrama(id),
      });
      if (res?.data?.code === 200 || res?.data?.code === 0) {
        setItems(items.filter(i => !(i.id === id && i.type === type)));
        setTotal(t => t - 1);
        toast.success('已删除');
      } else {
        toast.error('删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handlePreview = (item: ContentRecord) => {
    // 在新窗口打开七味网详情页
    window.open(`https://www.pkmp4.xyz/mv/${item.id}.html`, '_blank');
  };

  const [editingItem, setEditingItem] = useState<ContentRecord | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [detailItem, setDetailItem] = useState<ContentRecord | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);

  const handleCreateNew = () => {
    setCreatingNew(true);
    setEditForm(EMPTY_FORM);
  };

  const handleSaveNew = async () => {
    if (!editForm.title.trim()) { toast.warning('请输入标题'); return; }
    const data = buildSubmitData(editForm);
    try {
      const res = await dispatchByType(editForm.type, {
        movie: () => contentApi.createMovie(data),
        drama: () => contentApi.createDrama(data),
        variety: () => contentApi.createVariety(data),
        anime: () => contentApi.createAnime(data),
        short_drama: () => contentApi.createShortDrama(data),
      });
      if (res?.data?.code === 200 || res?.data?.code === 0) {
        setCreatingNew(false);
        toast.success('创建成功');
        fetchItems();
      } else {
        toast.error('创建失败');
      }
    } catch {
      toast.error('创建失败');
    }
  };

  const handleEditClick = (item: ContentRecord) => {
    setEditingItem(item);
    setEditForm({
      title: item.title || '',
      year: String(item.year || ''),
      scoreDouban: String(item.scoreDouban || ''),
      scoreImdb: String(item.scoreImdb || ''),
      scoreRt: String(item.scoreRt || ''),
      genre: parseJsonArray(item.genre),
      region: parseJsonArray(item.region),
      language: parseJsonArray(item.language),
      director: parseJsonArray(item.director),
      writer: parseJsonArray(item.writer),
      actor: parseJsonArray(item.actor),
      storyline: item.storyline || '',
      duration: String(item.duration || ''),
      releaseDate: item.releaseDate || '',
      alias: parseJsonArray(item.alias),
      status: item.status,
      type: item.type,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const data = { ...editingItem, ...buildSubmitData(editForm) };
    try {
      const res = await dispatchByType(editingItem.type, {
        movie: () => contentApi.updateMovie(editingItem.id, data),
        drama: () => contentApi.updateDrama(editingItem.id, data),
        variety: () => contentApi.updateVariety(editingItem.id, data),
        anime: () => contentApi.updateAnime(editingItem.id, data),
        short_drama: () => contentApi.updateShortDrama(editingItem.id, data),
      });
      if (res?.data?.code === 200 || res?.data?.code === 0) {
        setEditingItem(null);
        toast.success('已保存');
        fetchItems();
      } else {
        toast.error('保存失败');
      }
    } catch {
      toast.error('保存失败');
    }
  };

  const handleToggleStatus = async (item: ContentRecord) => {
    const newStatus = item.status === 1 ? 0 : 1;
    const data = { ...item, status: newStatus };
    try {
      const res = await dispatchByType(item.type, {
        movie: () => contentApi.updateMovie(item.id, data),
        drama: () => contentApi.updateDrama(item.id, data),
        variety: () => contentApi.updateVariety(item.id, data),
        anime: () => contentApi.updateAnime(item.id, data),
        short_drama: () => contentApi.updateShortDrama(item.id, data),
      });
      if (res?.data?.code === 200 || res?.data?.code === 0) {
        toast.success(newStatus === 1 ? '已上线' : '已下线');
        fetchItems();
      } else {
        toast.error('更新状态失败');
      }
    } catch {
      toast.error('更新状态失败');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">内容管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理影视资源内容，审核状态</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" /> 新增内容
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '电影', key: 'movie', color: 'text-muted-foreground' },
          { label: '剧集', key: 'drama', color: 'text-muted-foreground' },
          { label: '综艺', key: 'variety', color: 'text-muted-foreground' },
          { label: '动漫', key: 'anime', color: 'text-destructive' },
          { label: '短剧', key: 'short_drama', color: 'text-primary' },
        ].map((stat) => (
          <Card key={stat.key} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className={`text-xl font-bold ${stat.color}`}>{typeCountMap[stat.key] ?? '-'}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索标题..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v as FilterType); setPage(1); }}
              options={[{ label: '全部分类', value: 'all' }, { label: '电影', value: 'movie' }, { label: '剧集', value: 'drama' }, { label: '综艺', value: 'variety' }, { label: '动漫', value: 'anime' }, { label: '短剧', value: 'short_drama' }]}
              className="w-36"
            />
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}
              options={[{ label: '全部状态', value: 'all' }, { label: '已上线', value: '1' }, { label: '已下线', value: '0' }]}
              className="w-36"
            />
            <Button variant="outline" size="sm" onClick={fetchItems} className="border-border text-muted-foreground hover:text-foreground">
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 条，第 {page} / {Math.ceil(total / pageSize)} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(p => p + 1)}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-base">
            内容列表 ({loading ? '...' : total || filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 text-destructive text-sm bg-destructive/10 border-b border-border">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">内容</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">分类</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">年份</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">评分</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">上线状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="w-10 h-14 rounded shrink-0" /><div><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></div></div></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-8 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Skeleton className="w-7 h-7 rounded" /><Skeleton className="w-7 h-7 rounded" /><Skeleton className="w-7 h-7 rounded" /></div></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">暂无内容</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.posterUrl || `https://picsum.photos/seed/${item.type}${item.id}/100/150`}
                            alt={item.title}
                            className="w-10 h-14 object-cover rounded"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.type}${item.id}/100/150`; }}
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground max-w-48 truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.createdAt?.slice(0, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">
                          {TYPE_ICON_EMOJI[item.type] || ''} {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.year || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {item.scoreDouban ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {item.scoreDouban}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${item.status === 1 ? 'bg-primary/15 text-primary hover:bg-primary/25' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 1 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          {item.status === 1 ? '已上线' : '已下线'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDetailItem(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="详情">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditClick(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="编辑">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.type)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-16 rounded shrink-0" />
                    <div className="flex-1"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-20" /></div>
                  </div>
                  <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /></div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无内容</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.posterUrl || `https://picsum.photos/seed/${item.type}${item.id}/100/150`}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.type}${item.id}/100/150`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{TYPE_ICON_EMOJI[item.type]} {TYPE_LABELS[item.type]}</span>
                        {item.year && <span className="text-xs text-muted-foreground">{item.year}</span>}
                        {item.scoreDouban && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{item.scoreDouban}</Badge>
                        )}
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${item.status === 1 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 1 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          {item.status === 1 ? '已上线' : '已下线'}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.createdAt?.slice(0, 10)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setDetailItem(item)} className="p-2 rounded hover:bg-muted text-muted-foreground" title="详情">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(item)} className="p-2 rounded hover:bg-muted text-muted-foreground" title="编辑">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.type)} className="p-2 rounded hover:bg-destructive/20 text-destructive" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="内容详情" width="lg">
        {detailItem && (
          <div className="space-y-4 py-2">
            <div className="flex gap-4">
              <img
                src={detailItem.posterUrl || `https://picsum.photos/seed/${detailItem.type}${detailItem.id}/200/300`}
                alt={detailItem.title}
                className="w-32 h-44 object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${detailItem.type}${detailItem.id}/200/300`; }}
              />
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-bold text-foreground">{detailItem.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-muted text-muted-foreground">{TYPE_LABELS[detailItem.type]}</Badge>
                  {detailItem.year && <Badge className="bg-muted text-muted-foreground">{detailItem.year}</Badge>}
                  {detailItem.scoreDouban && <Badge className="bg-primary/20 text-primary">豆瓣 {detailItem.scoreDouban}</Badge>}
                  {detailItem.scoreImdb && <Badge className="bg-muted text-muted-foreground">IMDb {detailItem.scoreImdb}</Badge>}
                  {detailItem.scoreRt && <Badge className="bg-destructive/20 text-destructive">RT {detailItem.scoreRt}%</Badge>}
                  <Badge className={detailItem.status === 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}>
                    {detailItem.status === 1 ? '已上线' : '已下线'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {detailItem.genre && <div><span className="text-muted-foreground">类型: </span><span className="text-foreground">{parseJsonArray(detailItem.genre)}</span></div>}
              {detailItem.region && <div><span className="text-muted-foreground">地区: </span><span className="text-foreground">{parseJsonArray(detailItem.region)}</span></div>}
              {detailItem.language && <div><span className="text-muted-foreground">语言: </span><span className="text-foreground">{parseJsonArray(detailItem.language)}</span></div>}
              {detailItem.director && <div><span className="text-muted-foreground">导演: </span><span className="text-foreground">{parseJsonArray(detailItem.director)}</span></div>}
              {detailItem.writer && <div><span className="text-muted-foreground">编剧: </span><span className="text-foreground">{parseJsonArray(detailItem.writer)}</span></div>}
              {detailItem.actor && <div className="col-span-2"><span className="text-muted-foreground">演员: </span><span className="text-foreground">{parseJsonArray(detailItem.actor)}</span></div>}
              {detailItem.duration && <div><span className="text-muted-foreground">时长: </span><span className="text-foreground">{detailItem.duration}分钟</span></div>}
              {detailItem.releaseDate && <div><span className="text-muted-foreground">上映: </span><span className="text-foreground">{detailItem.releaseDate}</span></div>}
              {detailItem.alias && <div className="col-span-2"><span className="text-muted-foreground">又名: </span><span className="text-foreground">{parseJsonArray(detailItem.alias)}</span></div>}
            </div>
            {detailItem.storyline && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">剧情简介:</p>
                <p className="text-foreground leading-relaxed">{detailItem.storyline}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <p>ID: {detailItem.id} | 创建: {detailItem.createdAt?.slice(0, 19)} | 更新: {detailItem.updatedAt?.slice(0, 19)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={creatingNew} onClose={() => setCreatingNew(false)} title="新增内容" width="lg"
        footer={
          <>
            <button onClick={() => setCreatingNew(false)} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveNew} className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">创建</button>
          </>
        }
      >
        <ContentFormFields form={editForm} onChange={setEditForm} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="编辑内容" width="lg"
        footer={
          <>
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveEdit} className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors">保存</button>
          </>
        }
      >
        <ContentFormFields form={editForm} onChange={setEditForm} showStatus />
      </Modal>
    </div>
  );
}