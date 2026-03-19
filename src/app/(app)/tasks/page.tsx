"use client";
import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, Clock, Settings, FileText, CheckCircle2, XCircle, AlertCircle, CalendarClock, Zap, Power, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const formatRelativeTime = (ms: number | null) => {
  if (!ms) return "未知";
  const diff = ms - Date.now();
  const absDiff = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });

  if (absDiff < 60000) return rtf.format(Math.round(diff / 1000), "second");
  if (absDiff < 3600000) return rtf.format(Math.round(diff / 60000), "minute");
  if (absDiff < 86400000) return rtf.format(Math.round(diff / 3600000), "hour");
  return rtf.format(Math.round(diff / 86400000), "day");
};

const formatSchedule = (schedule: any) => {
  if (!schedule) return "无规则";
  if (schedule.kind === "cron") return `Cron: ${schedule.expr}`;
  if (schedule.kind === "every") return `每 ${schedule.everyMs / 1000} 秒`;
  if (schedule.kind === "at") return `在 ${new Date(schedule.at).toLocaleString()}`;
  return "未知规则";
};

export default function TasksPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  const [runsLoading, setRunsLoading] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);

  const fetchData = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        client.request("cron.status", {}),
        client.request("cron.list", { limit: 100, offset: 0 })
      ]);
      setStatus(statusRes);
      setJobs((listRes as any).jobs || []);
    } catch (err: any) {
      toast({ title: "加载 Cron 数据失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async (jobId: string) => {
    if (!client || !connected) return;
    setRunsLoading(true);
    try {
      const runsRes = await client.request("cron.runs", { scope: "job", id: jobId, limit: 50 });
      setRuns((runsRes as any).runs || []);
    } catch (err: any) {
      toast({ title: "加载执行记录失败", description: err.message, variant: "destructive" });
    } finally {
      setRunsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, connected]);

  useEffect(() => {
    if (selectedJobId) {
      fetchRuns(selectedJobId);
    } else {
      setRuns([]);
    }
  }, [selectedJobId]);

  const toggleJob = async (job: any, enabled: boolean) => {
    if (!client) return;
    try {
      await client.request("cron.update", { id: job.id, patch: { enabled } });
      toast({ title: enabled ? "任务已启用" : "任务已禁用" });
      fetchData();
    } catch (err: any) {
      toast({ title: "切换状态失败", description: err.message, variant: "destructive" });
    }
  };

  const forceRunJob = async (job: any) => {
    if (!client) return;
    setRunningJobId(job.id);
    try {
      await client.request("cron.run", { id: job.id, mode: "force" });
      toast({ title: "调度成功", description: `已强制触发任务: ${job.name}` });
      if (selectedJobId === job.id) fetchRuns(job.id);
    } catch (err: any) {
      toast({ title: "手动执行失败", description: err.message, variant: "destructive" });
    } finally {
      setRunningJobId(null);
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 shrink-0 border-b border-border/50 bg-background/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">定时任务 (CronJobs)</h1>
            <p className="text-muted-foreground mt-1">管理自动化工作流，调度 AI 助手定时运行的预配置作业。</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            刷新状态
          </Button>
        </div>

        <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card className="p-4 flex items-center gap-4 bg-muted/20 border-border/50 relative overflow-hidden">
             <div className="p-3 bg-primary/10 rounded-full text-primary">
               <Power className="size-5" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">全局 Cron 引擎</p>
               <p className="text-xl font-bold tracking-tight">
                 {status?.enabled ? <span className="text-green-500">运行中 (Enabled)</span> : <span className="text-red-500">已停用 (Disabled)</span>}
               </p>
             </div>
           </Card>
           
           <Card className="p-4 flex items-center gap-4 bg-muted/20 border-border/50">
             <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
               <Activity className="size-5" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">挂载任务总数</p>
               <p className="text-xl font-bold tracking-tight">{status?.jobs ?? 0}</p>
             </div>
           </Card>

           <Card className="p-4 flex items-center gap-4 bg-muted/20 border-border/50">
             <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
               <Clock className="size-5" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">引擎下一次唤醒</p>
               <p className="text-xl font-bold tracking-tight">
                 {status?.nextWakeAtMs ? formatRelativeTime(status.nextWakeAtMs) : "暂无调度"}
               </p>
             </div>
           </Card>
        </div>
      </div>

      {/* Main Workspace Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane - Job List */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-border/50 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-background/30">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">作业列表 ({jobs.length})</h2>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:text-primary">
               + 新建作业
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
             {jobs.length === 0 && !loading && (
                <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg border-border/50">无工作流，请新建作业</div>
             )}
             {jobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedJobId(job.id)}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 flex flex-col gap-2",
                    selectedJobId === job.id ? "bg-muted/50 border-primary/50 shadow-sm" : "border-transparent bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                     <span className="font-semibold text-sm truncate flex-1 pr-2">{job.name}</span>
                     <Switch 
                       checked={job.enabled} 
                       onCheckedChange={(checked: boolean) => toggleJob(job, checked)} 
                       onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                       className="data-[state=checked]:bg-green-500"
                     />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                     <div className="flex items-center gap-1.5 opacity-80">
                        <CalendarClock className="size-3" />
                        {formatSchedule(job.schedule)}
                     </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-primary/20 hover:text-primary rounded-full"
                        onClick={(e) => { e.stopPropagation(); forceRunJob(job); }}
                        disabled={runningJobId === job.id}
                        title="立即执行此任务"
                     >
                        <Zap className={cn("size-3", runningJobId === job.id && "animate-pulse")} />
                     </Button>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Pane - Details & Runs */}
        <div className="flex-1 overflow-y-auto bg-muted/10 p-6 custom-scrollbar">
          {!selectedJob ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-60">
               <CalendarClock className="size-16 stroke-1" />
               <p>在左侧选择一个 Cron Job 查看执行流水线</p>
            </div>
          ) : (
             <div className="max-w-4xl mx-auto space-y-6">
                <div>
                   <h2 className="text-2xl font-bold">{selectedJob.name}</h2>
                   <p className="text-muted-foreground mt-1">{selectedJob.description || "暂无描述"}</p>
                </div>
                
                <Tabs defaultValue="runs" className="w-full">
                  <TabsList className="bg-background border border-border/50">
                    <TabsTrigger value="runs" className="data-[state=active]:bg-muted">
                       <Activity className="size-4 mr-2" />
                       执行流水线
                    </TabsTrigger>
                    <TabsTrigger value="config" className="data-[state=active]:bg-muted">
                       <Settings className="size-4 mr-2" />
                       作业配置
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="runs" className="mt-4 space-y-4">
                     {runsLoading ? (
                        <div className="p-8 text-center text-muted-foreground animate-pulse">加载流水线中...</div>
                     ) : runs.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-border/50 rounded-xl text-muted-foreground bg-background/50">
                           此任务尚无执行记录
                        </div>
                     ) : (
                        <div className="space-y-3">
                           {runs.map((run: any) => (
                              <Card key={run.id} className="p-4 border-l-4 rounded-r-lg bg-background/50 transition-colors hover:bg-background border-y-border/50 border-r-border/50" style={{ borderLeftColor: run.status === 'ok' ? '#10b981' : run.status === 'skipped' ? '#f59e0b' : '#ef4444' }}>
                                 <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                       {run.status === 'ok' ? <CheckCircle2 className="size-4 text-emerald-500" /> : 
                                        run.status === 'skipped' ? <AlertCircle className="size-4 text-amber-500" /> :
                                        <XCircle className="size-4 text-red-500" />}
                                       <span className="font-semibold text-sm">
                                          {run.status === 'ok' ? '执行成功' : run.status === 'skipped' ? '已跳过' : '执行失败'}
                                       </span>
                                       {run.mode === 'force' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-2">手动触发</span>}
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">{new Date(run.startedAt).toLocaleString()}</span>
                                 </div>
                                 {(run.error || run.message) && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                       <p className="text-xs font-mono break-words whitespace-pre-wrap opacity-80">
                                          {run.error || run.message}
                                       </p>
                                    </div>
                                 )}
                              </Card>
                           ))}
                        </div>
                     )}
                  </TabsContent>
                  
                  <TabsContent value="config" className="mt-4">
                     <Card className="p-6 border-border/50 border-dashed bg-background/50 text-center text-muted-foreground min-h-[200px] flex flex-col items-center justify-center">
                        <Settings className="size-8 opacity-20 mb-4" />
                        编辑该 Job 的 Payload（代理节点、传递模型、角色指令）的表单即将在下一个版本释放。
                     </Card>
                  </TabsContent>
                </Tabs>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
