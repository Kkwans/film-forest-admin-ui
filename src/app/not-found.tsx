"use client";

import Link from "next/link";
import { Film, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Film className="h-20 w-20 text-muted-foreground/30" />
            <span className="absolute -top-2 -right-2 text-4xl font-bold text-destructive">
              ?
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-xl text-muted-foreground">页面未找到</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          抱歉，您访问的页面不存在。可能是链接有误，或页面已被移除。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-8 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Home className="h-4 w-4" />
            返回首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 h-8 px-4 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
