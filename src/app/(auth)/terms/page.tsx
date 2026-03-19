"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background p-8 md:p-12 lg:p-20 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-black tracking-tight">服务条款</h1>
        </div>

        <section className="space-y-6 text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. 接受协议</h2>
            <p>
              欢迎使用 OpenClaw！本协议是您与 OpenClaw 之间关于使用 OpenClaw 软件服务所订立的协议。通过访问或使用我们的服务，您同意受本协议约束。
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. 软件许可</h2>
            <p>
              OpenClaw 是一款开源（Open Source）的私有化部署控制台工具。我们授予您一项全球性的、不可转让的、非独占的、可撤销的软件许可，允许您按照相关的开源许可协议条款使用该软件。
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. 使用规则</h2>
            <p>
              鉴于 OpenClaw 是一个灵活的网关管理工具，您必须独立承担因使用本软件所产生的全部法律责任。
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2">
              <li>不得利用本软件从事任何违法违规的行为。</li>
              <li>不得破解、篡改或反编译本软件的任何部分（除非相关法律或许可协议明确授权）。</li>
              <li>您必须对您所有网关的安全性负责。</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">4. 免责声明</h2>
            <p className="font-bold underline">
              本软件按“原样”提供。由各开源维护者在不保证其针对任何特定用途的适用性或其连贯性的前提下发布。我们不保证服务在任何时候都不会中断。
            </p>
          </div>

          <div className="space-y-4 pt-8 border-t border-border/50">
            <p className="text-sm">本协议最后更新日期：2026-03-19</p>
          </div>
        </section>

        <div className="pt-10">
          <Link href="/login">
            <Button variant="outline" className="rounded-2xl px-8 h-12 font-medium">
              我已阅读并返回
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
