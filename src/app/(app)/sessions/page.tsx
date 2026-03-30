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
  Trash2, ExternalLink, RefreshCw,
  Users, User, MessageCircle, Activity,
  AlertTriangle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";


// Generate consistent color from agentId
const getAgentColor = (agentId: string) => {
  if (agentId === "main") return "hsl(224, 76%, 48%)"; // Indigo Blue for system main
  
  const colors = [
    "hsl(262, 83%, 58%)", // Violet
    "hsl(199, 89%, 48%)", // Sky
    "hsl(162, 94%, 30%)", // Emerald
    "hsl(339, 90%, 51%)", // Pink
    "hsl(35, 92%, 50%)",  // Orange
    "hsl(11, 80%, 55%)",  // Red
  ];
  const hash = agentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function SessionsPage() {
  const { connected, client } = useGateway();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSessions = async () => {
    if (!connected || !client) return;
    setLoading(true);
    try {
      const res = await client.request("sessions.list", { limit: 100, includeDerivedTitles: true });
      setSessions(res.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (key: string) => {
    if (!client) return;
    try {
      setIsDeleting(true);
      await client.request("sessions.delete", { key });
      setSessionToDelete(null);
      loadSessions();
    } catch (e) {
      console.error("Failed to delete session", e);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [connected, client]);

  // Group sessions by agent prefix
  const grouped = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
    const agentPrefix = s.key?.startsWith("agent:") ? s.key.split(":")[1] : "main";
    if (!acc[agentPrefix]) acc[agentPrefix] = [];
    acc[agentPrefix].push(s);
    return acc;
  }, {});

  return (
    <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-muted/5">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-8 sm:pb-12">
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5 sm:gap-1">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">会话管理</h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground">查看并管理网关跟踪的所有会话上下文。</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading} className="rounded-xl gap-1.5 sm:gap-2 h-8 sm:h-9">
                <RefreshCw className={cn("size-3.5 sm:size-4", loading && "animate-spin")} />
                <span className="text-[10px] sm:text-sm">刷新列表</span>
            </Button>
        </div>

        <div className="space-y-6">
          {Object.keys(grouped).length === 0 && !loading ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl bg-background/50">
              <MessageSquare className="size-12 mb-4 opacity-10" />
              <p className="text-muted-foreground font-medium">当前没有公开会话</p>
            </div>
          ) : (
            Object.entries(grouped).map(([agentId, agentSessions]) => {
              const color = getAgentColor(agentId);
              return (
                <div key={agentId} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                    <div className="size-2.5 sm:size-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[11px] sm:text-sm font-black uppercase tracking-widest" style={{ color }}>{agentId}</span>
                    <div className="flex-1 h-px bg-border/20 sm:bg-border/30" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{agentSessions.length} 个会话</span>
                  </div>
                  {agentSessions.map((s: any, i: number) => (
                    <SessionItem key={i} data={s} color={color} onDelete={() => setSessionToDelete(s.key)} />
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Unified Deletion Confirm Dialog */}
      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && !isDeleting && setSessionToDelete(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border-border/40 p-0 overflow-hidden bg-background">
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="mx-auto size-20 rounded-full bg-destructive/10 flex items-center justify-center animate-in zoom-in duration-300">
               <AlertTriangle className="size-10 text-destructive animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight">确认删除会话？</DialogTitle>
              <DialogDescription className="text-muted-foreground text-[0.95rem] leading-relaxed">
                此操作将永久清除该会话的所有上下文记录和交互历史，操作不可撤销。
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 bg-muted/30 border-t border-border/20">
            <Button 
                variant="outline" 
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="flex-1 rounded-2xl h-12 font-semibold hover:bg-muted/80 transition-all"
            >
              取消
            </Button>
            <Button 
                variant="destructive" 
                onClick={() => sessionToDelete && deleteSession(sessionToDelete)}
                disabled={isDeleting}
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-destructive/20 active:scale-95 transition-all"
            >
              {isDeleting ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              立即删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SessionItem({ data, color, onDelete }: { data: any; color: string; onDelete: () => void }) {
  const isGroup = data.kind === "group";

  return (
    <Card className="group relative border-border/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-background/40 backdrop-blur-sm overflow-hidden hover:-translate-y-1 rounded-xl sm:rounded-[2rem] border-l-[4px]" style={{ borderLeftColor: color }}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 size-32 opacity-5 blur-3xl pointer-events-none transition-opacity group-hover:opacity-10" style={{ background: color }} />
      
      <div className="flex items-center p-3 sm:p-5 gap-3.5 sm:gap-6 relative z-10">
        {/* Avatar Icon */}
        <div className="size-10 sm:size-12 rounded-[0.9rem] sm:rounded-[1rem] flex items-center justify-center shrink-0 border border-border/50 shadow-inner group-hover:scale-105 transition-transform duration-300" style={{ backgroundColor: `${color}15` }}>
            {isGroup ? (
                <Users className="size-5 sm:size-6" style={{ color }} />
            ) : (
                <User className="size-5 sm:size-6" style={{ color }} />
            )}
        </div>

        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
            <div className="flex items-center gap-2 sm:gap-4">
                <h3 className="font-bold text-sm sm:text-[1rem] truncate tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                    {data.displayName || data.derivedTitle || data.label || data.key.split(":").pop()}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-border/30 bg-background/50 text-muted-foreground shadow-sm">
                        {data.scope || "global"}
                    </div>
                    <div className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest border shadow-sm",
                        isGroup 
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-500" 
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}>
                        {isGroup ? "群组会话" : "个人会话"}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-5 text-muted-foreground/70">
                <div className="flex items-center gap-1 font-mono text-[9px] sm:text-[11px] font-semibold bg-muted/20 px-2 py-0.5 rounded-full">
                    <Clock className="size-3 sm:size-3.5 opacity-60" />
                    {(() => {
                      const ts = data.updatedAtMs || data.updatedAt || data.createdAt || data.timestamp || 0;
                      const d = new Date(ts);
                      return isNaN(d.getTime()) ? "未知" : d.toLocaleString("zh-CN", { hour12: false });
                    })()}
                </div>
                
                <div className="flex items-center gap-1.5 uppercase font-black tracking-widest text-[8px] sm:text-[9px] opacity-80">
                    <Activity className="size-3 sm:size-3.5" style={{ color }} />
                    <span style={{ color }}>{data.thinkingLevel || "normal"}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold opacity-60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    CONNECTED
                </div>
            </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="size-8 sm:size-10 rounded-lg sm:rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 group-hover:scale-110 transition-all">
                <ExternalLink className="size-4 sm:size-4.5" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDelete}
                className="size-8 sm:size-10 rounded-lg sm:rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent transition-all"
            >
                <Trash2 className="size-4 sm:size-4.5" />
            </Button>
        </div>
      </div>
    </Card>
  );
}

