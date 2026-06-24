"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** 可选的 fallback 渲染函数 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** 错误发生时的回调（可用于上报） */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 显示的模块名称 */
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 通用错误边界组件
 *
 * 用法：
 * <ErrorBoundary moduleName="内容管理">
 *   <ContentTable />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary] ${this.props.moduleName || "组件"} 发生错误:`,
      error,
      errorInfo
    );
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {this.props.moduleName || "组件"}加载失败
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error.message || "发生了未知错误，请尝试刷新"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
