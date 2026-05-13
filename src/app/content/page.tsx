'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';
import { Film, Search, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Loader2, AlertCircle } from 'lucide-react';
import { contentApi } from '@/lib/api';
import { Select } from '@/components/ui/select';

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

const TYPE_COLORS: Record<string, string> = {
  movie: 'text-blue-400', drama: 'text-purple-400', variety: 'text-amber-400', anime: 'text-red-400', short_drama: 'text-emerald-400'
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

  const handleDelete = async (id: number, type: string) => {
    const ok = await dialog.confirm({ title: '删除内容', content: '确定删除此内容？删除后不可恢复。', confirmText: '删除', cancelText: '取消', variant: 'danger' });
    if (!ok) return;
    try {
      let res;
      switch (type) {
        case 'movie': res = await contentApi.deleteMovie(id); break;
        case 'drama': res = await contentApi.deleteDrama(id); break;
        case 'variety': res = await contentApi.deleteVariety(id); break;
        case 'anime': res = await contentApi.deleteAnime(id); break;
        case 'short_drama': res = await contentApi.deleteShortDrama(id); break;
      }
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
  const [editForm, setEditForm] = useState({ title: '', year: '', scoreDouban: '', scoreImdb: '', scoreRt: '', genre: '', region: '', language: '', director: '', writer: '', actor: '', storyline: '', duration: '', releaseDate: '', alias: '', status: 1, type: 'movie' as ContentRecord['type'] });

  const handleCreateNew = () => {
    setCreatingNew(true);
    setEditForm({ title: '', year: '', scoreDouban: '', scoreImdb: '', scoreRt: '', genre: '', region: '', language: '', director: '', writer: '', actor: '', storyline: '', duration: '', releaseDate: '', alias: '', status: 1, type: 'movie' });
  };

  const handleSaveNew = async () => {
    if (!editForm.title.trim()) { toast.warning('请输入标题'); return; }
    const data = {
      title: editForm.title,
      year: editForm.year ? Number(editForm.year) : null,
      scoreDouban: editForm.scoreDouban ? Number(editForm.scoreDouban) : null,
      scoreImdb: editForm.scoreImdb ? Number(editForm.scoreImdb) : null,
      scoreRt: editForm.scoreRt ? Number(editForm.scoreRt) : null,
      genre: editForm.genre ? JSON.stringify(editForm.genre.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      region: editForm.region ? JSON.stringify(editForm.region.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      language: editForm.language ? JSON.stringify(editForm.language.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      director: editForm.director ? JSON.stringify(editForm.director.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      writer: editForm.writer ? JSON.stringify(editForm.writer.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      actor: editForm.actor ? JSON.stringify(editForm.actor.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      storyline: editForm.storyline || null,
      duration: editForm.duration ? Number(editForm.duration) : null,
      releaseDate: editForm.releaseDate || null,
      alias: editForm.alias ? JSON.stringify(editForm.alias.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : null,
      status: editForm.status,
    };
    try {
      let res;
      switch (editForm.type) {
        case 'movie': res = await contentApi.createMovie(data); break;
        case 'drama': res = await contentApi.createDrama(data); break;
        case 'variety': res = await contentApi.createVariety(data); break;
        case 'anime': res = await contentApi.createAnime(data); break;
        case 'short_drama': res = await contentApi.createShortDrama(data); break;
      }
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

  /** 解析 JSON 数组为逗号分隔字符串 */
  function parseJsonArray(json: string | undefined): string {
    if (!json) return '';
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.join('，') : json;
    } catch { return json; }
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const data = {
      ...editingItem,
      title: editForm.title,
      year: editForm.year ? Number(editForm.year) : undefined,
      scoreDouban: editForm.scoreDouban ? Number(editForm.scoreDouban) : undefined,
      scoreImdb: editForm.scoreImdb ? Number(editForm.scoreImdb) : undefined,
      scoreRt: editForm.scoreRt ? Number(editForm.scoreRt) : undefined,
      genre: editForm.genre ? JSON.stringify(editForm.genre.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      region: editForm.region ? JSON.stringify(editForm.region.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      language: editForm.language ? JSON.stringify(editForm.language.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      director: editForm.director ? JSON.stringify(editForm.director.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      writer: editForm.writer ? JSON.stringify(editForm.writer.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      actor: editForm.actor ? JSON.stringify(editForm.actor.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      storyline: editForm.storyline || undefined,
      duration: editForm.duration ? Number(editForm.duration) : undefined,
      releaseDate: editForm.releaseDate || undefined,
      alias: editForm.alias ? JSON.stringify(editForm.alias.split(/[，,]/).map(s => s.trim()).filter(Boolean)) : undefined,
      status: editForm.status,
    };
    try {
      let res;
      switch (editingItem.type) {
        case 'movie': res = await contentApi.updateMovie(editingItem.id, data); break;
        case 'drama': res = await contentApi.updateDrama(editingItem.id, data); break;
        case 'variety': res = await contentApi.updateVariety(editingItem.id, data); break;
        case 'anime': res = await contentApi.updateAnime(editingItem.id, data); break;
        case 'short_drama': res = await contentApi.updateShortDrama(editingItem.id, data); break;
      }
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
    try {
      let res;
      const data = { ...item, status: newStatus };
      switch (item.type) {
        case 'movie': res = await contentApi.updateMovie(item.id, data); break;
        case 'drama': res = await contentApi.updateDrama(item.id, data); break;
        case 'variety': res = await contentApi.updateVariety(item.id, data); break;
        case 'anime': res = await contentApi.updateAnime(item.id, data); break;
        case 'short_drama': res = await contentApi.updateShortDrama(item.id, data); break;
      }
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
        <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" /> 新增内容
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '电影', key: 'movie', color: 'text-blue-400' },
          { label: '剧集', key: 'drama', color: 'text-purple-400' },
          { label: '综艺', key: 'variety', color: 'text-amber-400' },
          { label: '动漫', key: 'anime', color: 'text-red-400' },
          { label: '短剧', key: 'short_drama', color: 'text-emerald-400' },
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
            <div className="flex items-center gap-2 px-4 py-3 text-red-400 text-sm bg-red-900/20 border-b border-border">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[600px]">
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
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      加载中...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无内容</p>
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
                        <span className={`text-sm font-medium ${TYPE_COLORS[item.type] || 'text-muted-foreground'}`}>
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.year || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {item.scoreDouban ? (
                          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                            {item.scoreDouban}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${item.status === 1 ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 1 ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
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
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors"
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
                  {detailItem.scoreDouban && <Badge className="bg-emerald-600/20 text-emerald-400">豆瓣 {detailItem.scoreDouban}</Badge>}
                  {detailItem.scoreImdb && <Badge className="bg-blue-600/20 text-blue-400">IMDb {detailItem.scoreImdb}</Badge>}
                  {detailItem.scoreRt && <Badge className="bg-red-600/20 text-red-400">RT {detailItem.scoreRt}%</Badge>}
                  <Badge className={detailItem.status === 1 ? 'bg-emerald-600/20 text-emerald-400' : 'bg-muted text-muted-foreground'}>
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
            <button onClick={handleSaveNew} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">创建</button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">内容类型</label>
              <Select value={editForm.type} onChange={v => setEditForm({...editForm, type: v as ContentRecord['type']})} options={[{ label: '电影', value: 'movie' }, { label: '剧集', value: 'drama' }, { label: '综艺', value: 'variety' }, { label: '动漫', value: 'anime' }, { label: '短剧', value: 'short_drama' }]} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">年份</label>
              <input value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})} placeholder="2026" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">标题</label>
            <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="输入内容标题" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">豆瓣评分</label>
              <input value={editForm.scoreDouban} onChange={e => setEditForm({...editForm, scoreDouban: e.target.value})} placeholder="8.5" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">类型（逗号分隔）</label>
              <input value={editForm.genre} onChange={e => setEditForm({...editForm, genre: e.target.value})} placeholder="剧情，喜剧" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">地区（逗号分隔）</label>
              <input value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} placeholder="中国大陆" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">导演（逗号分隔）</label>
              <input value={editForm.director} onChange={e => setEditForm({...editForm, director: e.target.value})} placeholder="张三" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">演员（逗号分隔）</label>
            <input value={editForm.actor} onChange={e => setEditForm({...editForm, actor: e.target.value})} placeholder="演员A，演员B" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">语言（逗号分隔）</label>
              <input value={editForm.language} onChange={e => setEditForm({...editForm, language: e.target.value})} placeholder="英语，汉语" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">编剧（逗号分隔）</label>
              <input value={editForm.writer} onChange={e => setEditForm({...editForm, writer: e.target.value})} placeholder="编剧A" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">时长（分钟）</label>
              <input value={editForm.duration} onChange={e => setEditForm({...editForm, duration: e.target.value})} placeholder="120" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">上映日期</label>
              <input value={editForm.releaseDate} onChange={e => setEditForm({...editForm, releaseDate: e.target.value})} placeholder="2026-03-20" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">IMDb 评分</label>
              <input value={editForm.scoreImdb} onChange={e => setEditForm({...editForm, scoreImdb: e.target.value})} placeholder="8.3" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">RT 评分（%）</label>
              <input value={editForm.scoreRt} onChange={e => setEditForm({...editForm, scoreRt: e.target.value})} placeholder="95" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">又名（逗号分隔）</label>
            <input value={editForm.alias} onChange={e => setEditForm({...editForm, alias: e.target.value})} placeholder="极限返航，末日圣母号" className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">剧情简介</label>
            <textarea value={editForm.storyline} onChange={e => setEditForm({...editForm, storyline: e.target.value})} rows={3} className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm resize-none" />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="编辑内容" width="lg"
        footer={
          <>
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm rounded-lg border bg-background text-foreground hover:bg-muted transition-colors">取消</button>
            <button onClick={handleSaveEdit} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">保存</button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">内容类型</label>
              <Select value={editForm.type} onChange={v => setEditForm({...editForm, type: v as ContentRecord['type']})} options={[{ label: '电影', value: 'movie' }, { label: '剧集', value: 'drama' }, { label: '综艺', value: 'variety' }, { label: '动漫', value: 'anime' }, { label: '短剧', value: 'short_drama' }]} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">年份</label>
              <input value={editForm.year} onChange={e => setEditForm({...editForm, year: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">标题</label>
            <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">豆瓣评分</label>
              <input value={editForm.scoreDouban} onChange={e => setEditForm({...editForm, scoreDouban: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">类型（逗号分隔）</label>
              <input value={editForm.genre} onChange={e => setEditForm({...editForm, genre: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">地区（逗号分隔）</label>
              <input value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">导演（逗号分隔）</label>
              <input value={editForm.director} onChange={e => setEditForm({...editForm, director: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">演员（逗号分隔）</label>
              <input value={editForm.actor} onChange={e => setEditForm({...editForm, actor: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">状态</label>
              <div className="flex items-center gap-2 h-9">
                <button type="button" onClick={() => setEditForm({...editForm, status: editForm.status === 1 ? 0 : 1})} className={`w-10 h-5 rounded-full relative transition-colors ${editForm.status === 1 ? 'bg-emerald-600' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editForm.status === 1 ? 'right-0.5' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-muted-foreground">{editForm.status === 1 ? '已上线' : '已下线'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">语言（逗号分隔）</label>
              <input value={editForm.language} onChange={e => setEditForm({...editForm, language: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">编剧（逗号分隔）</label>
              <input value={editForm.writer} onChange={e => setEditForm({...editForm, writer: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">时长（分钟）</label>
              <input value={editForm.duration} onChange={e => setEditForm({...editForm, duration: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">上映日期</label>
              <input value={editForm.releaseDate} onChange={e => setEditForm({...editForm, releaseDate: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">IMDb 评分</label>
              <input value={editForm.scoreImdb} onChange={e => setEditForm({...editForm, scoreImdb: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">RT 评分（%）</label>
              <input value={editForm.scoreRt} onChange={e => setEditForm({...editForm, scoreRt: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">又名（逗号分隔）</label>
            <input value={editForm.alias} onChange={e => setEditForm({...editForm, alias: e.target.value})} className="h-9 px-3 rounded-lg border bg-background text-foreground text-sm" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">剧情简介</label>
            <textarea value={editForm.storyline} onChange={e => setEditForm({...editForm, storyline: e.target.value})} rows={3} className="px-3 py-2 rounded-lg border bg-background text-foreground text-sm resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  );
}