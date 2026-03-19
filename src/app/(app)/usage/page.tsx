"use client";
import { useEffect, useState, useMemo } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Coins, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper functions for formatting
const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);
const formatTokens = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};
const formatCost = (num: number) => {
  return "$" + num.toFixed(4);
};

export default function UsagePage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [sessionsData, setSessionsData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  
  const [days] = useState(7); // default 7 days

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [days]);

  const fetchUsage = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      // Date Interpretation logic similar to original UI
      const offsetMinutes = new Date().getTimezoneOffset();
      const sign = -offsetMinutes >= 0 ? "+" : "-";
      const absMinutes = Math.abs(offsetMinutes);
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;
      const utcOffset = `UTC${sign}${hours}${mins === 0 ? "" : ":" + String(mins).padStart(2, '0')}`;
      
      const reqArgs = {
        startDate,
        endDate,
        mode: "specific",
        utcOffset,
      };

      const [sessionsRes, costRes] = await Promise.all([
        client.request("sessions.usage", { ...reqArgs, limit: 100, includeContextWeight: true }).catch(err => {
          // Fallback if legacy Gateway doesn't support mode/utcOffset
          if (err.message && String(err.message).includes("mode")) {
             return client.request("sessions.usage", { startDate, endDate, limit: 100 });
          }
          throw err;
        }),
        client.request("usage.cost", reqArgs).catch(err => {
          if (err.message && String(err.message).includes("mode")) {
             return client.request("usage.cost", { startDate, endDate });
          }
          throw err;
        })
      ]);

      setSessionsData(sessionsRes);
      setCostData(costRes);
    } catch (err: any) {
      toast({
        title: "获取使用情况失败",
        description: err.message || "拉取 usage.cost 或 sessions.usage 失败",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [client, connected, startDate, endDate]);

  const totals = costData?.totals || sessionsData?.totals || { totalTokens: 0, totalCost: 0, input: 0, output: 0, cacheRead: 0 };
  const daily = costData?.daily || [];
  const sessions = sessionsData?.sessions || [];
  
  // Calculate max daily token usage for the bar chart
  const maxDailyTokens = Math.max(...daily.map((d: any) => d.totalTokens || 0), 100);

  return (
    <div className="flex flex-col h-full p-6 gap-6 max-w-7xl mx-auto overflow-y-auto animate-in fade-in duration-300 custom-scrollbar">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">使用情况 (Usage)</h1>
          <p className="text-muted-foreground mt-1">全局大模型消耗统计 ({startDate} ~ {endDate})</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchUsage} disabled={loading} className="gap-2">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card className="p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50 text-blue-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Database className="size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">总计 Token 消耗</p>
            <div className="text-3xl font-bold tracking-tight text-foreground">{formatNumber(totals.totalTokens)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-blue-500 font-medium">输入 {formatTokens(totals.input)}</span> · 
              输出 {formatTokens(totals.output)}
            </p>
          </div>
        </Card>
        
        <Card className="p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50 text-green-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Coins className="size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">估算金额花费</p>
            <div className="text-3xl font-bold tracking-tight text-foreground">{formatCost(totals.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
              基于配置的模型单价计算
            </p>
          </div>
        </Card>
        
        <Card className="p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50 text-orange-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Layers className="size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Cache 命中量</p>
            <div className="text-3xl font-bold tracking-tight text-foreground">{formatNumber(totals.cacheRead)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-orange-500 font-medium">{totals.totalTokens > 0 ? ((totals.cacheRead / totals.totalTokens) * 100).toFixed(1) : 0}%</span> 缓存命中率
            </p>
          </div>
        </Card>
        
        <Card className="p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-50 text-purple-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Activity className="size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">活跃会话数</p>
            <div className="text-3xl font-bold tracking-tight text-foreground">{formatNumber(sessions.length)}</div>
            <p className="text-xs text-muted-foreground mt-2 opacity-70">
               本周期的激活对话
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        {/* Daily Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 p-6 border-border/50 bg-background/50 flex flex-col min-h-[300px]">
          <h2 className="text-lg font-bold tracking-tight mb-6">每日消耗走势 (近 7 天)</h2>
          <div className="flex items-end gap-3 flex-1 pb-2">
            {daily.length === 0 && !loading ? (
              <div className="w-full text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl h-full flex items-center justify-center">
                暂无使用数据
              </div>
            ) : daily.map((d: any, i: number) => {
              const heightPct = Math.max((d.totalTokens / maxDailyTokens) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center h-[200px] items-end">
                    <div 
                      className="w-full max-w-[40px] bg-primary/20 hover:bg-primary/40 rounded-t-md transition-all relative"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                        {formatTokens(d.totalTokens)} tks
                      </div>
                      <div 
                         className="absolute bottom-0 w-full bg-blue-500/50 rounded-t-sm" 
                         style={{ height: `${(d.input / (d.totalTokens || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-full px-1">
                    {d.date.substring(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Sessions */}
        <Card className="col-span-1 p-6 border-border/50 bg-background/50 flex flex-col min-h-[300px]">
           <h2 className="text-lg font-bold tracking-tight mb-4 text-foreground">Top 会话算力榜单</h2>
           <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
             {sessions.length === 0 && !loading ? (
               <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                 无会话记录
               </div>
             ) : (
               sessions.slice(0, 8).map((session: any, i: number) => (
                 <div key={session.key || i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                   <div className="flex flex-col min-w-0 pr-3">
                     <span className="text-sm font-semibold truncate text-foreground">{session.label || session.sessionId || session.key}</span>
                     <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate bg-muted w-fit px-1.5 py-0.5 rounded">{session.model || "Unknown Model"}</span>
                   </div>
                   <div className="flex flex-col items-end shrink-0">
                     <span className="text-sm font-bold text-primary">{formatTokens(session.usage?.totalTokens || 0)}</span>
                     <span className="text-[10px] text-muted-foreground mt-0.5">{formatCost(session.usage?.totalCost || 0)}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
        </Card>
      </div>
    </div>
  );
}
