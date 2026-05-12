import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 - 影视森林管理后台",
  description: "影视森林管理后台登录",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
