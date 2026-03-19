"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 lg:p-20 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-black tracking-tight">隐私政策</h1>
        </div>

        <section className="space-y-6 text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. 关于隐私政策</h2>
            <p>
              OpenClaw 尊重并保护所有使用服务用户的个人隐私权。为了给您提供更准确、更有个性化的服务，OpenClaw 会按照本隐私政策的规定使用和披露您的个人信息。
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. 我们如何使用数据</h2>
            <p>
              OpenClaw 本身是一个**私有化部署**的工具，我们不存储、不收集任何您的对话数据、网关令牌或连接信息。所有的访问信息都存储在您的浏览器本地（localStorage/sessionStorage）中。
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>网关地址和会话密钥：仅用于建立与您指定网关的 WebSocket 链接。</li>
              <li>令牌/密码：仅在当前会话窗口有效，关闭后即销毁。</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. 信息安全</h2>
            <p>
              由于数据完全存储在本地并由您控制的后端进行处理，因此您的数据安全由您的私有部署端点保障。请确保您的 OpenClaw 网关地址处于安全的网络环境中。
            </p>
          </div>

          <div className="space-y-4 pt-8 border-t border-border/50">
            <p className="text-sm">最后更新日期：2026-03-19</p>
            <p className="text-sm italic">OpenClaw，让连接更简单。 </p>
          </div>
        </section>

        <div className="pt-10">
          <Link href="/login">
            <Button variant="outline" className="rounded-2xl px-8 h-12 font-medium">
              返回登入
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
