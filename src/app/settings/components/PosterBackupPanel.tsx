'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CirclePause,
  CloudDownload,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { posterBackupApi, type PosterBackupStatus } from '@/lib/api';
import { extractErrorMessage } from '@/lib/utils';

const EMPTY_STATUS: PosterBackupStatus = {
  status: 'IDLE',
  total: 0,
  pending: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  progressPercent: 0,
  currentContentType: null,
  currentId: null,
  currentTitle: null,
  lastError: null,
  startedAt: null,
  updatedAt: null,
  completedAt: null,
  maxRequestsPerWindow: 10,
  rateLimitWindowSeconds: 5,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  movie: '电影',
  drama: '剧集',
  variety: '综艺',
  anime: '动漫',
  short_drama: '短剧',
};

const STATUS_LABELS: Record<PosterBackupStatus['status'], string> = {
  IDLE: '等待启动',
  RUNNING: '正在回填',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  ERROR: '等待重试',
};

function formatCount(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatTime(value: string | null) {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp);
}

function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' }) {
  const valueClass = tone === 'success'
    ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-foreground';

  return (
    <div className="rounded-xl border border-border/70 bg-background/60 px-3.5 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function PosterBackupPanel() {
  const toast = useToast();
  const [status, setStatus] = useState<PosterBackupStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'start' | 'pause' | 'refresh' | null>(null);

  const loadStatus = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await posterBackupApi.getStatus();
      if (response.data?.code !== 200 || !response.data.data) {
        throw new Error(response.data?.message || '读取海报回填状态失败');
      }
      setStatus(response.data.data);
    } catch (error: unknown) {
      if (showLoading) toast.error(extractErrorMessage(error, '读取海报回填状态失败'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  useEffect(() => {
    const interval = status.status === 'RUNNING' || status.status === 'PAUSED' ? 3000 : 10000;
    const timer = window.setInterval(() => {
      void loadStatus(false);
    }, interval);
    return () => window.clearInterval(timer);
  }, [loadStatus, status.status]);

  const runAction = async (type: 'start' | 'pause') => {
    setAction(type);
    try {
      const response = type === 'start'
        ? await posterBackupApi.start()
        : await posterBackupApi.pause();
      if (response.data?.code !== 200 || !response.data.data) {
        throw new Error(response.data?.message || (type === 'start' ? '启动回填失败' : '暂停回填失败'));
      }
      setStatus(response.data.data);
      toast.success(type === 'start' ? '海报回填已启动' : '已请求暂停，当前图片完成后生效');
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, type === 'start' ? '启动回填失败' : '暂停回填失败'));
    } finally {
      setAction(null);
    }
  };

  const isRunning = status.status === 'RUNNING';
  const isPaused = status.status === 'PAUSED';
  const progress = Math.min(100, Math.max(0, status.progressPercent));
  const statusIcon = isRunning
    ? <Loader2 className="size-3.5 animate-spin" />
    : isPaused
      ? <CirclePause className="size-3.5" />
      : status.status === 'COMPLETED'
        ? <CheckCircle2 className="size-3.5" />
        : status.status === 'ERROR'
          ? <AlertTriangle className="size-3.5" />
          : <Play className="size-3.5" />;
  const statusClass = isRunning
    ? 'border-primary/25 bg-primary/10 text-primary'
    : isPaused
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : status.status === 'COMPLETED'
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : status.status === 'ERROR'
          ? 'border-destructive/25 bg-destructive/10 text-destructive'
          : 'border-border bg-muted/60 text-muted-foreground';

  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
            <div className="absolute -right-3 -top-3 size-8 rounded-full bg-primary/15 blur-md" />
            <CloudDownload className="relative size-5" />
          </div>
          <div>
            <CardTitle className="text-foreground">历史海报本地化</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              将爬虫原始海报流式保存到本地，前台优先读取本地副本；失败项目会保留待处理状态并自动重试。
            </CardDescription>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}>
            {statusIcon}
            {STATUS_LABELS[status.status]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="刷新海报回填状态"
            onClick={() => {
              setAction('refresh');
              void loadStatus(true).finally(() => setAction(null));
            }}
            disabled={action !== null}
          >
            <RefreshCw className={action === 'refresh' ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">回填进度</p>
              <p className="mt-1 text-sm text-foreground">
                已备份 <span className="font-semibold">{formatCount(status.succeeded)}</span>
                <span className="mx-1 text-muted-foreground">/</span>
                {formatCount(status.total)} 张
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{progress.toFixed(1)}%</p>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-background shadow-inner"
            role="progressbar"
            aria-label="历史海报本地化进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-emerald-400 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>待处理 {formatCount(status.pending)} 张</span>
            <span>最近更新 {formatTime(status.updatedAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="已处理" value={formatCount(status.processed)} />
          <Stat label="已成功" value={formatCount(status.succeeded)} tone="success" />
          <Stat label="失败待重试" value={formatCount(status.failed)} tone="warning" />
          <Stat label="本轮剩余" value={formatCount(status.pending)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
          <div className="min-w-0 rounded-xl border border-border/70 bg-background/60 px-3.5 py-3">
            <p className="text-xs text-muted-foreground">当前处理</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {status.currentTitle || (isPaused ? '已暂停，等待继续' : status.status === 'COMPLETED' ? '全部本地化完成' : '等待任务开始')}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {status.currentContentType
                ? `${CONTENT_TYPE_LABELS[status.currentContentType] || status.currentContentType} #${status.currentId ?? '—'}`
                : `开始时间 ${formatTime(status.startedAt)}${status.completedAt ? ` · 完成于 ${formatTime(status.completedAt)}` : ''}`}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            {isRunning && (
              <Button
                variant="outline"
                onClick={() => void runAction('pause')}
                disabled={action !== null || loading}
              >
                {action === 'pause' ? <Loader2 className="size-4 animate-spin" /> : <Pause className="size-4" />}
                暂停
              </Button>
            )}
            {!isRunning && (
              <Button
                onClick={() => void runAction('start')}
                disabled={action !== null || loading}
              >
                {action === 'start' ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                {isPaused ? '继续回填' : status.status === 'ERROR' ? '重试回填' : '开始回填'}
              </Button>
            )}
          </div>
        </div>

        {status.lastError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span><span className="font-medium">最近提示：</span>{status.lastError}</span>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            下载限流：每 {status.rateLimitWindowSeconds} 秒最多 {status.maxRequestsPerWindow} 张
          </span>
          <span>图片采用流式写盘，不设置文件大小上限</span>
        </div>
      </CardContent>
    </Card>
  );
}
