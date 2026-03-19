"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGateway } from "@/context/gateway-context";
import { Cpu, Globe, Monitor, Shield, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstancesPage() {
  const { presence } = useGateway();

  return (
    <main className="p-8 space-y-8 bg-muted/5">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">实例管理</h1>
          <p className="text-muted-foreground">监控当前连接到网关的所有活跃实例。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presence.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl bg-background/50">
              <Cpu className="size-12 mb-4 opacity-10" />
              <p className="text-muted-foreground font-medium">当前没有活跃实例</p>
            </div>
          ) : (
            presence.map((p, i) => (
              <InstanceCard key={i} data={p} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function InstanceCard({ data }: { data: any }) {
  const isOnline = data.status === "online" || !data.status; // Default to online if connected
  
  return (
    <Card className="border-border/50 shadow-sm hover:border-primary/20 transition-all bg-background overflow-hidden flex flex-col">
      <CardHeader className="p-6 bg-muted/5 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              isOnline ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
            )}>
              {isOnline ? "Online" : "Away"}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{data.id?.slice(0, 8) || "N/A"}</span>
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="size-5 text-primary" />
            {data.client?.name || "未知客户端"}
        </CardTitle>
        <CardDescription className="truncate">
            {data.client?.version || "0.1.0"} • {data.client?.platform || "Web"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Globe className="size-3.5" />} label="区域" value={data.location || "Global"} />
            <InfoItem icon={<Shield className="size-3.5" />} label="角色" value={data.role || "Operator"} />
            <InfoItem icon={<Zap className="size-3.5" />} label="模式" value={data.client?.mode || "standard"} />
            <InfoItem icon={<Clock className="size-3.5" />} label="心跳" value="刚刚" />
        </div>
        
        {data.client?.userAgent && (
            <div className="pt-4 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">User Agent</span>
                <p className="text-[10px] font-mono text-muted-foreground/80 line-clamp-2 leading-relaxed">
                    {data.client.userAgent}
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-semibold truncate">{value}</p>
        </div>
    );
}
