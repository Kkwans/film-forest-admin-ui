import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 从 API 错误中提取可读的错误消息 */
export function extractErrorMessage(e: unknown, fallback: string = '操作失败'): string {
  if (typeof e === 'object' && e !== null) {
    const err = e as { response?: { data?: { message?: string; msg?: string } }; message?: string };
    return err.response?.data?.message || err.response?.data?.msg || err.message || fallback;
  }
  return fallback;
}
