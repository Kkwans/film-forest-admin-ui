import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const ADMIN_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || '';

const adminClient = axios.create({
  baseURL: ADMIN_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动添加 token
adminClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器：401 时跳转登录
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.data?.code === 500 && error.response?.data?.message?.includes('未登录')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** 内容提交数据（创建/更新通用） */
export interface ContentSubmitData {
  title: string;
  year?: number | null;
  scoreDouban?: number | null;
  scoreImdb?: number | null;
  scoreRt?: number | null;
  genre?: string | null;   // JSON array string
  region?: string | null;   // JSON array string
  language?: string | null;
  director?: string | null;
  writer?: string | null;
  actor?: string | null;
  storyline?: string | null;
  duration?: number | null;
  releaseDate?: string | null;
  alias?: string | null;
  status?: number;
  type?: string;
  posterUrl?: string;
}

/** 保存爬虫配置请求体 */
export type SaveScheduleData = Partial<Omit<CrawlerSchedule, 'id' | 'status' | 'lastRunTime' | 'nextRunTime' | 'totalRuns' | 'totalItems' | 'createdAt' | 'updatedAt'>>;

/** 保存磁力资源请求体 */
export interface SaveMagnetData {
  id?: number;
  contentType: string;
  contentId: number;
  title?: string;
  magnetUrl: string;
  resolution?: string;
  hasSubtitle?: boolean;
  isSpecialSub?: boolean;
  sort?: number;
}

/** 保存网盘资源请求体 */
export interface SaveCloudData {
  id?: number;
  contentType: string;
  contentId: number;
  title?: string;
  diskType: string;
  url: string;
  password?: string;
  sort?: number;
}

/** 保存资源来源请求体 */
export interface SaveSourceData {
  id?: number;
  name: string;
  url: string;
  type?: string;
  enabled?: boolean;
}

export const crawlerApi = {
  /** 获取所有定时配置 */
  listSchedules: () => adminClient.get('/api/crawler/schedules'),

  /** 获取单个配置 */
  getSchedule: (id: number) => adminClient.get(`/api/crawler/schedule/${id}`),

  /** 保存/更新配置 */
  saveSchedule: (data: SaveScheduleData) => adminClient.post('/api/crawler/schedule', data),

  /** 删除配置 */
  deleteSchedule: (id: number) => adminClient.delete(`/api/crawler/schedule/${id}`),

  /** 启动爬虫 */
  start: (id: number) => adminClient.post(`/api/crawler/start/${id}`),

  /** 停止爬虫 */
  stop: (id: number) => adminClient.post(`/api/crawler/stop/${id}`),

  /** 切换启用状态 */
  toggleEnabled: (id: number, enabled: boolean) =>
    adminClient.post(`/api/crawler/toggle/${id}?enabled=${enabled}`),

  /** 获取任务日志 */
  listLogs: (scheduleId?: number) =>
    adminClient.get('/api/crawler/logs', { params: scheduleId ? { scheduleId } : {} }),

  /** 获取状态概览 */
  getStatus: () => adminClient.get('/api/crawler/status'),

  /** 获取资源来源列表 */
  listSources: () => adminClient.get('/api/crawler/sources'),
};

export interface CrawlerSchedule {
  id: number;
  name: string;
  contentType: string;
  sourceSite: string;
  enabled: number;
  cronExpression: string;
  batchSize: number;
  rateLimitMs: number;
  priority: string;
  genreFilter: string | null;
  status: string;
  lastRunTime: string | null;
  nextRunTime: string | null;
  totalRuns: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrawlerTaskLog {
  id: number;
  scheduleId: number;
  scheduleName: string;
  contentType: string;
  status: string;
  itemsCrawled: number;
  itemsAdded: number;
  itemsUpdated: number;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: string;
  finishedAt: string | null;
}

export const resourceApi = {
  // 资源统计
  getStats: () => adminClient.get('/api/admin/resources/stats'),
  // 在线资源列表
  listOnline: (contentType?: string, contentId?: number) =>
    adminClient.get('/api/admin/resources/online', { params: { contentType, contentId } }),
  // 磁力资源列表（分页）
  listMagnet: (params?: { page?: number; size?: number; contentType?: string; contentId?: number; keyword?: string }) =>
    adminClient.get('/api/admin/resources/magnet', { params }),
  // 磁力资源 CRUD
  saveMagnet: (data: SaveMagnetData) => adminClient.post('/api/admin/resources/magnet', data),
  deleteMagnet: (id: number) => adminClient.delete(`/api/admin/resources/magnet/${id}`),
  // 网盘资源列表（分页）
  listCloud: (params?: { page?: number; size?: number; contentType?: string; contentId?: number; keyword?: string }) =>
    adminClient.get('/api/admin/resources/cloud', { params }),
  // 网盘资源 CRUD
  saveCloud: (data: SaveCloudData) => adminClient.post('/api/admin/resources/cloud', data),
  deleteCloud: (id: number) => adminClient.delete(`/api/admin/resources/cloud/${id}`),

  // 资源来源 CRUD
  listSources: () => adminClient.get('/api/admin/resources/sources'),
  saveSource: (data: SaveSourceData) => adminClient.post('/api/admin/resources/sources', data),
  deleteSource: (id: number) => adminClient.delete(`/api/admin/resources/sources/${id}`),
  toggleSource: (id: number, enabled: boolean) =>
    adminClient.post(`/api/admin/resources/sources/${id}/toggle?enabled=${enabled}`),
};

// 内容管理 API（管理端）
export const contentApi = {
  // 电影
  listMovies: (params: { page?: number; size?: number; year?: number; keyword?: string }) =>
    adminClient.get('/api/content/movies', { params }),
  getMovie: (id: number) => adminClient.get(`/api/content/movies/${id}`),
  createMovie: (data: ContentSubmitData) => adminClient.post('/api/content/movies', data),
  updateMovie: (id: number, data: ContentSubmitData) => adminClient.put(`/api/content/movies/${id}`, data),
  deleteMovie: (id: number) => adminClient.delete(`/api/content/movies/${id}`),

  // 剧集
  listDramas: (params: { page?: number; size?: number; year?: number; keyword?: string }) =>
    adminClient.get('/api/content/dramas', { params }),
  getDrama: (id: number) => adminClient.get(`/api/content/dramas/${id}`),
  createDrama: (data: ContentSubmitData) => adminClient.post('/api/content/dramas', data),
  updateDrama: (id: number, data: ContentSubmitData) => adminClient.put(`/api/content/dramas/${id}`, data),
  deleteDrama: (id: number) => adminClient.delete(`/api/content/dramas/${id}`),

  // 综艺
  listVarieties: (params: { page?: number; size?: number; year?: number; keyword?: string }) =>
    adminClient.get('/api/content/varieties', { params }),
  getVariety: (id: number) => adminClient.get(`/api/content/varieties/${id}`),
  createVariety: (data: ContentSubmitData) => adminClient.post('/api/content/varieties', data),
  updateVariety: (id: number, data: ContentSubmitData) => adminClient.put(`/api/content/varieties/${id}`, data),
  deleteVariety: (id: number) => adminClient.delete(`/api/content/varieties/${id}`),

  // 动漫
  listAnimes: (params: { page?: number; size?: number; year?: number; keyword?: string }) =>
    adminClient.get('/api/content/animes', { params }),
  getAnime: (id: number) => adminClient.get(`/api/content/animes/${id}`),
  createAnime: (data: ContentSubmitData) => adminClient.post('/api/content/animes', data),
  updateAnime: (id: number, data: ContentSubmitData) => adminClient.put(`/api/content/animes/${id}`, data),
  deleteAnime: (id: number) => adminClient.delete(`/api/content/animes/${id}`),

  // 短剧
  listShortDramas: (params: { page?: number; size?: number; year?: number; keyword?: string }) =>
    adminClient.get('/api/content/short-dramas', { params }),
  getShortDrama: (id: number) => adminClient.get(`/api/content/short-dramas/${id}`),
  createShortDrama: (data: ContentSubmitData) => adminClient.post('/api/content/short-dramas', data),
  updateShortDrama: (id: number, data: ContentSubmitData) => adminClient.put(`/api/content/short-dramas/${id}`, data),
  deleteShortDrama: (id: number) => adminClient.delete(`/api/content/short-dramas/${id}`),

  // 合并列表
  listAll: (params: { type?: string; page?: number; size?: number }) =>
    adminClient.get('/api/content/all', { params }),

  // 统计
  getStats: () => adminClient.get('/api/content/stats'),

  // Genre 列表（爬虫配置用）
  getGenres: (contentType: string) => adminClient.get('/api/content/genres', { params: { contentType } }),
};

// 系统设置 API
export const settingsApi = {
  /** 获取所有设置 */
  getSettings: () => adminClient.get('/api/settings'),
  /** 批量保存设置 */
  saveSettings: (data: Record<string, string>) => adminClient.put('/api/settings', data),
  /** 获取单个设置 */
  getSetting: (key: string, defaultValue?: string) =>
    adminClient.get(`/api/settings/${key}`, { params: { defaultValue } }),
};

export default client;