'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Bell, Shield, Save, Loader2, CheckCircle2, Globe, Palette, Key, Server, HardDrive, Mail, AlertTriangle } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

interface SettingsData {
  site_name: string;
  site_desc: string;
  copyright: string;
  notify_on_complete: string;
  notify_on_error: string;
  admin_path: string;
}

const defaultSettings: SettingsData = {
  site_name: '影视森林',
  site_desc: '影视资源聚合平台',
  copyright: '© 2026 影视森林. 仅供学习交流.',
  notify_on_complete: 'true',
  notify_on_error: 'false',
  admin_path: '/admin',
};

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    settingsApi.getSettings().then(res => {
      if (res.data?.code === 200 && res.data.data) {
        const d = res.data.data;
        setSettings(prev => ({
          ...prev,
          site_name: d.site_name || prev.site_name,
          site_desc: d.site_desc || prev.site_desc,
          copyright: d.copyright || prev.copyright,
          notify_on_complete: d.notify_on_complete ?? prev.notify_on_complete,
          notify_on_error: d.notify_on_error ?? prev.notify_on_error,
        }));
      }
    }).catch(e => console.error('加载设置失败', e)).finally(() => setLoading(false));
  }, []);

  const update = (key: keyof SettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveSettings({
        site_name: settings.site_name,
        site_desc: settings.site_desc,
        copyright: settings.copyright,
        notify_on_complete: settings.notify_on_complete,
        notify_on_error: settings.notify_on_error,
      });
      setSaved(true);
      toast.success('设置已保存');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('保存失败', e);
      toast.error('保存失败，请检查后端服务');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = () => {
    if (!password.trim()) {
      toast.error('请输入新密码');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次密码不一致');
      return;
    }
    toast.info('密码更新功能需要后端用户认证模块支持，当前版本暂不可用');
    setPassword('');
    setConfirmPassword('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">加载设置...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">配置站点参数、通知与安全策略</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> 已保存</>
          ) : (
            <><Save className="w-4 h-4" /> 保存全部设置</>
          )}
        </button>
      </div>

      {/* Site Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            站点信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">站点名称</label>
            <input
              value={settings.site_name}
              onChange={e => update('site_name', e.target.value)}
              className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              placeholder="影视森林"
            />
            <p className="text-xs text-muted-foreground">显示在浏览器标签和页面标题中</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">站点描述</label>
            <input
              value={settings.site_desc}
              onChange={e => update('site_desc', e.target.value)}
              className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              placeholder="影视资源聚合平台"
            />
            <p className="text-xs text-muted-foreground">用于 SEO 和社交分享</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">版权信息</label>
            <input
              value={settings.copyright}
              onChange={e => update('copyright', e.target.value)}
              className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              placeholder="© 2026 影视森林"
            />
            <p className="text-xs text-muted-foreground">显示在页面底部</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            通知设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-foreground font-medium">爬取完成通知</p>
                <p className="text-sm text-muted-foreground">每次爬虫任务完成后发送通知</p>
              </div>
            </div>
            <button
              onClick={() => update('notify_on_complete', settings.notify_on_complete === 'true' ? 'false' : 'true')}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.notify_on_complete === 'true' ? 'bg-emerald-600' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${settings.notify_on_complete === 'true' ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-foreground font-medium">错误告警</p>
                <p className="text-sm text-muted-foreground">爬虫出错时发送告警通知</p>
              </div>
            </div>
            <button
              onClick={() => update('notify_on_error', settings.notify_on_error === 'true' ? 'false' : 'true')}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.notify_on_error === 'true' ? 'bg-emerald-600' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${settings.notify_on_error === 'true' ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <Mail className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-xs text-muted-foreground">邮件通知功能将在后续版本中支持</p>
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-500" />
            </div>
            数据库配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">主机地址</span>
              </div>
              <p className="text-sm font-mono text-foreground">192.168.5.110:3306</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">数据库名</span>
              </div>
              <p className="text-sm font-mono text-foreground">film_forest</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">数据库引擎</span>
              </div>
              <p className="text-sm text-foreground">MySQL 8.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">字符集</span>
              </div>
              <p className="text-sm text-foreground">utf8mb4</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            安全设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">管理端路径</label>
            <div className="relative">
              <input
                value={settings.admin_path}
                readOnly
                className="h-10 px-4 pr-20 rounded-lg border bg-muted/50 text-muted-foreground text-sm w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">只读</span>
            </div>
            <p className="text-xs text-muted-foreground">修改路径需重新配置 Nginx 反向代理</p>
          </div>
          <div className="border-t border-border pt-5">
            <p className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              修改管理员密码
            </p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">新密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="输入新密码"
                  className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="h-10 px-4 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                className="w-fit px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                更新密码
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
