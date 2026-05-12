'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  username: string;
  nickname?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// 不需要登录的页面
const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查是否是公开页面
    if (PUBLIC_PATHS.includes(pathname)) {
      setLoading(false);
      return;
    }

    // 从 localStorage 获取 token
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!savedToken) {
      // 未登录，跳转到登录页
      router.push('/login');
      return;
    }

    // 验证 token 是否有效
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) {
          setUser(data.data);
          setToken(savedToken);
        } else {
          // token 无效，清除并跳转登录
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  // 公开页面直接显示（不检查登录状态）
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return <AuthContext.Provider value={{ user, token, logout, loading: false }}>{children}</AuthContext.Provider>;
  }

  // 加载中显示
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录不显示内容
  if (!user || !token) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, token, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
