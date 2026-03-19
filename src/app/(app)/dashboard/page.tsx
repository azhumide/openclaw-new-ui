"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGateway } from "@/context/gateway-context";
import { 
  Zap, CheckCircle2, Globe, Shield, 
  Settings2, Key, Languages, Palette,
  Activity, Monitor, Database, AlertTriangle
} from "lucide-react";

export default function OverviewPage() {
  const [settings, setSettings] = useState<any>(null);
  const { connected, snapshot, error, presence, health } = useGateway();

  useEffect(() => {
    const rawSettings = localStorage.getItem("openclaw.control.settings.v1");
    if (rawSettings) {
      setSettings(JSON.parse(rawSettings));
    }
  }, []);

  // 格式化运行时间
  const uptime = health?.uptime ? `${Math.floor(health.uptime / 3600)}h` : "N/A";
  
  // 模拟或提取系统指标 (OpenClaw 后端若提供这些数据则从 health 中获取)
  const cpuUsage = health?.cpuUsage || "24%";
  const latency = connected ? "45ms" : "---";
  const nodeCount = presence.length;

  return (
    <main className="p-8 space-y-8 bg-muted/5 min-h-full">
      <div className="max-w-7xl mx-auto space-y-10 pb-12">
        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-3xl flex items-center gap-4 text-destructive animate-in slide-in-from-top-4 duration-500">
            <AlertTriangle className="size-6 shrink-0" />
            <div>
                <p className="font-bold">连接出现问题</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">状态概览</h1>
            <p className="text-muted-foreground">底层运行指标与安全连接快照。</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all",
            connected ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
          )}>
            <div className={cn("size-2 rounded-full", connected ? "bg-green-500" : "bg-orange-500 animate-pulse")} />
            WebSocket {connected ? "已连接" : "未连接"}
          </div>
        </div>

        {/* Top Metric Cards - Based on Screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            icon={<Zap className="size-5 text-yellow-500" />} 
            label="系统资源" 
            value={cpuUsage} 
            sub="内存使用率正常" 
          />
          <MetricCard 
            icon={<CheckCircle2 className="size-5 text-green-500" />} 
            label="在线节点" 
            value={nodeCount.toString()} 
            sub="所有节点运行中" 
          />
          <MetricCard 
            icon={<Globe className="size-5 text-blue-500" />} 
            label="响应延迟" 
            value={latency} 
            sub="网络连接极佳" 
          />
          <MetricCard 
            icon={<Shield className="size-5 text-purple-500" />} 
            label="安全等级" 
            value="高" 
            sub="防火墙已开启" 
          />
        </div>

        {/* Connection Details Section - Based on Screenshot Table */}
        <div className="space-y-4">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold tracking-tight">连接详情</h2>
                <p className="text-sm text-muted-foreground">当前活动的网关连接配置信息</p>
            </div>
            
            <Card className="border-border/50 shadow-sm overflow-hidden bg-background">
                <CardContent className="p-0">
                    <div className="flex flex-col">
                        <DetailRow icon={<Activity />} label="网关地址" value={settings?.gatewayUrl || "---"} isMono />
                        <DetailRow icon={<Key />} label="会话密钥" value="agent:main:main" isMono />
                        <DetailRow icon={<Languages />} label="语言环境" value="zh-CN" />
                        <DetailRow icon={<Palette />} label="主题模式" value="system" isLast />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* System Logs / Extra Modules (Optional placeholders) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-border/50 shadow-sm bg-background">
                 <CardHeader className="p-6 border-b border-border/30 bg-muted/5 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">实例心跳记录</CardTitle>
                        <CardDescription>最近十分钟内的节点活跃状态</CardDescription>
                    </div>
                    <Database className="size-5 text-muted-foreground/40" />
                 </CardHeader>
                 <CardContent className="p-0 overflow-auto max-h-72">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                            <tr>
                                <th className="px-6 py-4">时间</th>
                                <th className="px-6 py-4">实例</th>
                                <th className="px-6 py-4">状态</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {presence.map((p, i) => (
                                <tr key={i} className="hover:bg-muted/20">
                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground italic">刚刚</td>
                                    <td className="px-6 py-4 font-semibold">{p.client?.name || p.id}</td>
                                    <td className="px-6 py-4 text-green-500">Success</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-background overflow-hidden flex flex-col">
                <CardHeader className="p-6 border-b border-border/30 bg-muted/5">
                    <CardTitle className="text-base">快速操作</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <Button variant="outline" className="w-full justify-start rounded-xl py-6 gap-3">
                        <Activity className="size-4 text-primary" />
                        <div className="text-left">
                            <div className="text-sm font-bold">同步会话快照</div>
                            <div className="text-[10px] text-muted-foreground">拉取当前最新的会话状态</div>
                        </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start rounded-xl py-6 gap-3">
                        <Monitor className="size-4 text-primary" />
                        <div className="text-left">
                            <div className="text-sm font-bold">切换节点模式</div>
                            <div className="text-[10px] text-muted-foreground">更改全局节点的分配逻辑</div>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) {
  return (
    <Card className="border-border/50 shadow-sm hover:border-primary/20 transition-all bg-background group">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
            {icon}
        </div>
        <div className="flex-1 space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ icon, label, value, isMono = false, isLast = false }: { icon: any, label: string, value: string, isMono?: boolean, isLast?: boolean }) {
    return (
        <div className={cn(
            "px-8 py-5 flex items-center justify-between hover:bg-muted/5 transition-colors",
            !isLast && "border-b border-border/30"
        )}>
            <div className="flex items-center gap-4 text-muted-foreground">
                <span className="opacity-40">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
            </div>
            <div className={cn(
                "px-3 py-1 bg-muted/40 rounded-lg text-[11px] font-bold border border-border/50",
                isMono ? "font-mono" : ""
            )}>
                {value}
            </div>
        </div>
    );
}

function Button({ children, variant = "default", className, ...props }: any) {
    const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    const variants: any = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
        outline: "border border-border/50 bg-background hover:bg-muted/50"
    };
    return (
        <button className={cn(base, variants[variant], className)} {...props}>
            {children}
        </button>
    );
}
