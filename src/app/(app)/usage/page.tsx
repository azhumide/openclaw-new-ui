"use client";
import { useEffect, useState, useMemo } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Coins, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper functions for formatting
const formatNumber = (num: number) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};
const formatTokens = formatNumber;
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
    <div className="flex flex-col h-full p-4 sm:p-6 gap-4 sm:gap-6 max-w-7xl mx-auto overflow-y-auto animate-in fade-in duration-300 custom-scrollbar">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">使用情况 (Usage)</h1>
          <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">全局大模型消耗统计 ({startDate} ~ {endDate})</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 font-mono">
          <Button variant="outline" size="sm" onClick={fetchUsage} disabled={loading} className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
            <RefreshCw className={cn("size-3.5 sm:size-4", loading && "animate-spin")} />
            <span className="text-[10px] sm:text-sm">刷新</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        <Card className="p-3.5 sm:p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-30 sm:opacity-50 text-blue-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Database className="size-8 sm:size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">总计 Token 消耗</p>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{formatNumber(totals.totalTokens)}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
              <span className="text-blue-500 font-medium">输入 {formatTokens(totals.input)}</span> · 
              输出 {formatTokens(totals.output)}
            </p>
          </div>
        </Card>
        
        <Card className="p-3.5 sm:p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-30 sm:opacity-50 text-green-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Coins className="size-8 sm:size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">估算金额花费</p>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{formatCost(totals.totalCost)}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 opacity-70">
              基于模型单价计算
            </p>
          </div>
        </Card>
        
        <Card className="p-3.5 sm:p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-30 sm:opacity-50 text-orange-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Layers className="size-8 sm:size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">Cache 命中量</p>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{formatNumber(totals.cacheRead)}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
              <span className="text-orange-500 font-medium">{totals.totalTokens > 0 ? ((totals.cacheRead / totals.totalTokens) * 100).toFixed(1) : 0}%</span> 命中率
            </p>
          </div>
        </Card>
        
        <Card className="p-3.5 sm:p-5 border-border/50 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-30 sm:opacity-50 text-purple-500 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Activity className="size-8 sm:size-10" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">活跃会话数</p>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{formatNumber(sessions.length)}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 opacity-70">
               周期内激活对话
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0">
        {/* Daily Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 p-4 sm:p-6 border-border/50 bg-background/50 flex flex-col h-[400px] lg:h-[500px]">
          <h2 className="text-sm sm:text-lg font-bold tracking-tight mb-4 sm:mb-6">每日消耗走势 (近 7 天)</h2>
          <div className="flex items-end gap-3 flex-1 pb-2">
            {daily.length === 0 && !loading ? (
              <div className="w-full text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl h-full flex items-center justify-center">
                暂无使用数据
              </div>
            ) : daily.map((d: any, i: number) => {
              const heightPct = Math.max((d.totalTokens / maxDailyTokens) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
                  <div className="relative w-full flex justify-center items-end flex-1 min-h-0">
                    <div 
                      className="w-full max-w-[32px] sm:max-w-[40px] bg-primary/20 hover:bg-primary/40 rounded-t-lg transition-all relative group/bar"
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
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-full px-1 pt-1">
                    {d.date.substring(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Sessions */}
        <Card className="col-span-1 p-4 sm:p-6 border-border/50 bg-background/50 flex flex-col h-[400px] lg:h-[500px]">
           <h2 className="text-sm sm:text-lg font-bold tracking-tight mb-3 sm:mb-4 text-foreground">Top 会话算力榜单</h2>
           <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
             {sessions.length === 0 && !loading ? (
               <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                 无会话记录
               </div>
             ) : (
               sessions.slice(0, 8).map((session: any, i: number) => {
                 const displayName = session.displayName || session.label || session.subject || session.firstUserMessage;
                 const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.sessionId);
                 const displayId = isUUID ? session.sessionId.slice(0, 8) : session.sessionId;
                 const finalName = displayName || displayId || session.key;

                 return (
                   <div key={session.key || i} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors group">
                     <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                       <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                         {i + 1}
                       </div>
                       <div className="flex flex-col min-w-0">
                         <span className="text-xs sm:text-sm font-semibold truncate text-foreground" title={displayName || session.sessionId}>
                           {finalName}
                         </span>
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] text-muted-foreground truncate">
                             {session.model || 'Unknown Model'}
                           </span>
                         </div>
                       </div>
                     </div>
                     <div className="flex flex-col items-end shrink-0">
                       <span className="text-xs sm:text-sm font-bold text-primary">{formatTokens(session.usage?.totalTokens || 0)}</span>
                       <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">{formatCost(session.usage?.totalCost || 0)}</span>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
        </Card>
      </div>
    </div>
  );
}
