import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import PageTitle from "@/components/PageTitle";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "影视森林 - 管理后台",
  description: "影视森林内容管理/爬虫任务管理/数据维护",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full bg-background text-foreground`}>
        <ThemeProvider>
          <Providers>
            <AuthProvider>
              <PageTitle />
              <div className="flex h-screen overflow-hidden">
                <AdminSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <AdminHeader />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                  </main>
                </div>
              </div>
            </AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
