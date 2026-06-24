"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Route Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-muted p-4 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-xl font-bold mb-2">页面加载失败</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || "该页面遇到了意外错误"}
        {error.digest && (
          <span className="block text-xs mt-1 opacity-60">
            错误ID: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          重试
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => (window.location.href = "/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          返回首页
        </Button>
      </div>
    </div>
  );
}
