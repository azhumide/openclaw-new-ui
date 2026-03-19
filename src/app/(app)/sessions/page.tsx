"use client";

import { useEffect, useState } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGateway } from "@/context/gateway-context";
import { 
  MessageSquare, Clock, Globe, Hash, 
  Trash2, ExternalLink, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SessionsPage() {
  const { connected, client } = useGateway();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    if (!connected || !client) return;
    setLoading(true);
    try {
      const res = await client.request("sessions.list", { limit: 100 });
      setSessions(res.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [connected, client]);

  return (
    <main className="p-8 space-y-8 bg-muted/5">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">会话管理</h1>
                <p className="text-muted-foreground">查看并管理网关跟踪的所有会话上下文。</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading} className="rounded-xl gap-2">
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                刷新列表
            </Button>
        </div>

        <div className="space-y-4">
          {sessions.length === 0 && !loading ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl bg-background/50">
              <MessageSquare className="size-12 mb-4 opacity-10" />
              <p className="text-muted-foreground font-medium">当前没有公开会话</p>
            </div>
          ) : (
            sessions.map((s, i) => (
              <SessionItem key={i} data={s} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function SessionItem({ data }: { data: any }) {
  return (
    <Card className="border-border/50 shadow-sm hover:border-primary/20 transition-all bg-background overflow-hidden">
      <div className="flex items-center p-6 gap-6">
        <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
            <Hash className="size-6 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
                <span className="font-bold text-lg truncate">{data.label || data.key}</span>
                <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {data.scope || "global"}
                </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="size-3" />
                    {new Date(data.updatedAtMs || 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 uppercase font-bold tracking-widest text-[9px]">
                    <Globe className="size-3" />
                    {data.thinkingLevel || "normal"}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl">
                <ExternalLink className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5">
                <Trash2 className="size-4" />
            </Button>
        </div>
      </div>
    </Card>
  );
}
