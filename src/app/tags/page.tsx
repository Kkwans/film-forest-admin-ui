'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, Plus, Edit, Trash2, Palette, Hash, Loader2, X, Check } from 'lucide-react';
import { tagApi, type TagItem } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#6366F1', '#F97316', '#14B8A6',
  '#84CC16', '#A855F7', '#E11D48', '#0EA5E9', '#D946EF',
];

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const dialog = useDialog();

  const loadTags = async () => {
    try {
      const res = await tagApi.list();
      const data = res.data as { data?: TagItem[] };
      setTags(data?.data || []);
    } catch {
      toast.error('加载标签失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTags(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await tagApi.create({ name: newName.trim(), color: newColor });
      toast.success('标签创建成功');
      setNewName('');
      setShowCreate(false);
      loadTags();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await tagApi.update(id, { name: editName.trim(), color: editColor });
      toast.success('标签已更新');
      setEditingId(null);
      loadTags();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tag: TagItem) => {
    dialog.confirm({
      title: '删除标签',
      content: `确定要删除标签「${tag.name}」吗？关联的内容将自动解除关联。`,
      onConfirm: async () => {
        try {
          await tagApi.delete(tag.id);
          toast.success('标签已删除');
          loadTags();
        } catch {
          toast.error('删除失败');
        }
      },
    });
  };

  const startEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color || PRESET_COLORS[0]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">管理内容标签，用于内容分类和筛选</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> 新建标签
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">标签总数</p>
                <p className="text-xl font-bold text-foreground">{loading ? '-' : tags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总使用次数</p>
                <p className="text-xl font-bold text-foreground">{loading ? '-' : tags.reduce((s, t) => s + (t.usageCount || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              新建标签
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">标签名称</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="输入标签名称"
                maxLength={50}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">标签颜色</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? 'var(--foreground)' : 'transparent',
                      transform: newColor === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">预览：</span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${newColor}18`, color: newColor, border: `1px solid ${newColor}30` }}
              >
                {newName || '标签名'}
              </span>
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              创建标签
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tag List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">所有标签</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无标签</p>
              <p className="text-xs mt-1">点击上方「新建标签」创建第一个标签</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-foreground/10 transition-colors group"
                >
                  {editingId === tag.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-8 w-32"
                        maxLength={50}
                        onKeyDown={e => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        {PRESET_COLORS.slice(0, 8).map(c => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className="w-5 h-5 rounded-full border-2"
                            style={{ backgroundColor: c, borderColor: editColor === c ? 'var(--foreground)' : 'transparent' }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1 ml-auto">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => handleUpdate(tag.id)} disabled={saving}>
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || 'var(--primary)' }}
                        />
                        <span className="text-sm font-medium text-foreground">{tag.name}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: tag.color ? `${tag.color}18` : 'var(--muted)',
                            color: tag.color || 'var(--muted-foreground)',
                          }}
                        >
                          {tag.usageCount || 0} 次使用
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(tag)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(tag)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
