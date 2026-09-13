const TOKEN_KEY = 'token';

/** 未勾选“记住登录状态”时只放在 sessionStorage，关闭浏览器即结束会话。 */
export function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(TOKEN_KEY);
}

export function storeAdminToken(token: string, rememberMe: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  (rememberMe ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearStoredAdminSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem('user');
  window.sessionStorage.removeItem('user');
}
