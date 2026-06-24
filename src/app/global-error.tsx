"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <style>{`
          :root {
            --err-bg: #fafafa;
            --err-fg: #1a1a1a;
            --err-card: #f0f0f0;
            --err-muted: #666;
            --err-accent: #2563eb;
            --err-accent-fg: #fff;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --err-bg: #0a0a0a;
              --err-fg: #e5e5e5;
              --err-card: #1a1a1a;
              --err-muted: #999;
              --err-accent: #2563eb;
              --err-accent-fg: #fff;
            }
          }
          .dark {
            --err-bg: #0a0a0a;
            --err-fg: #e5e5e5;
            --err-card: #1a1a1a;
            --err-muted: #999;
            --err-accent: #2563eb;
            --err-accent-fg: #fff;
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "var(--err-bg)",
          color: "var(--err-fg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "var(--err-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2.5rem",
            }}
          >
            💥
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            管理后台发生严重错误
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--err-muted)",
              marginBottom: "1.5rem",
              maxWidth: "24rem",
            }}
          >
            {error.message || "应用遇到了意外错误，请尝试刷新页面"}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "var(--err-accent)",
              color: "var(--err-accent-fg)",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            刷新页面
          </button>
        </div>
      </body>
    </html>
  );
}
