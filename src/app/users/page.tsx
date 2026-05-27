'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Key, Loader2, ChevronLeft, ChevronRight, Shield, ShieldOff } from 'lucide-react';
import { userApi, type UserItem } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';
import { Modal } from '@/components/ui/modal';

interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export default function UsersPage() {
  const toast = useToast();
  const dialog = useDialog();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ username: '', password: '', nickname: '', email: '', phone: '', status: 1 });
  const [saving, setSaving] = useState(false);

  // Password reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.list({ page, size, keyword: keyword || undefined });
      if (res.data?.code === 200) {
        const data = res.data.data as PageResult<UserItem>;
        setUsers(data.records);
        setTotal(data.total);
      }
    } catch (e) {
      console.error('加载用户列表失败', e);
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, size, keyword]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = () => { setPage(1); loadUsers(); };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', nickname: '', email: '', phone: '', status: 1 });
    setShowModal(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setForm({ username: user.username, password: '', nickname: user.nickname || '', email: user.email || '', phone: user.phone || '', status: user.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingUser && !form.username.trim()) { toast.error('用户名不能为空'); return; }
    if (!editingUser && !form.password.trim()) { toast.error('密码不能为空'); return; }
    if (!editingUser && form.password.length < 6) { toast.error('密码长度至少 6 位'); return; }

    setSaving(true);
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, {
          nickname: form.nickname || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          status: form.status,
        });
        toast.success('用户已更新');
      } else {
        await userApi.create({
          username: form.username,
          password: form.password,
          nickname: form.nickname || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          status: form.status,
        });
        toast.success('用户已创建');
      }
      setShowModal(false);
      loadUsers();
    } catch (e: any) {
      const msg = e.response?.data?.message || '操作失败';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user: UserItem) => {
    dialog.confirm({
      title: '删除用户',
      content: `确定要删除用户「${user.username}」吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await userApi.delete(user.id);
          toast.success('用户已删除');
          loadUsers();
        } catch (e: any) {
          toast.error(e.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const handleToggleStatus = async (user: UserItem) => {
    try {
      await userApi.toggleStatus(user.id);
      toast.success(user.status === 1 ? '已禁用' : '已启用');
      loadUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || '操作失败');
    }
  };

  const openResetPassword = (user: UserItem) => {
    setResetUserId(user.id);
    setResetUsername(user.username);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) { toast.error('密码长度至少 6 位'); return; }
    if (!resetUserId) return;
    try {
      await userApi.resetPassword(resetUserId, newPassword);
      toast.success('密码已重置');
      setShowResetModal(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || '重置失败');
    }
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Users className="w-6 h-6" /> 用户管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">管理系统用户账号、权限和状态</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
          <UserPlus className="w-4 h-4" /> 新建用户
        </button>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索用户名、昵称、邮箱、手机号..."
                className="h-10 pl-10 pr-4 rounded-lg border bg-background text-foreground text-sm w-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <button onClick={handleSearch} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
              搜索
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground text-sm">加载中...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">暂无用户数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">用户名</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">昵称</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">邮箱</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">手机号</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">状态</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">创建时间</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{user.nickname || '-'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{user.email || '-'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{user.phone || '-'}</td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge variant={user.status === 1 ? 'default' : 'destructive'}>
                          {user.status === 1 ? '正常' : '禁用'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleToggleStatus(user)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title={user.status === 1 ? '禁用' : '启用'}>
                            {user.status === 1 ? <ShieldOff className="w-4 h-4 text-destructive" /> : <Shield className="w-4 h-4 text-emerald-500" />}
                          </button>
                          <button onClick={() => openResetPassword(user)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="重置密码">
                            <Key className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => openEditModal(user)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="编辑">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(user)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="删除">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</p>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border bg-card hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border bg-card hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingUser ? '编辑用户' : '新建用户'}>
          <div className="space-y-4 p-1">
            {!editingUser && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">用户名 <span className="text-destructive">*</span></label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="3~30 位" className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              </div>
            )}
            {!editingUser && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">密码 <span className="text-destructive">*</span></label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="至少 6 位" className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              </div>
            )}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">昵称</label>
              <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="显示名称" className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">邮箱</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="可选" className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">手机号</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="可选" className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">状态</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, status: 1 }))} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.status === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'}`}>
                  正常
                </button>
                <button onClick={() => setForm(f => ({ ...f, status: 0 }))} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.status === 0 ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'}`}>
                  禁用
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted transition-colors">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" />保存中...</> : editingUser ? '保存修改' : '创建用户'}
              </button>
            </div>
          </div>
        </Modal>

      {/* Reset Password Modal */}
      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title={`重置密码 — ${resetUsername}`}>
          <div className="space-y-4 p-1">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">新密码</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="至少 6 位" className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted transition-colors">取消</button>
              <button onClick={handleResetPassword} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">确认重置</button>
            </div>
          </div>
        </Modal>
    </div>
  );
}
