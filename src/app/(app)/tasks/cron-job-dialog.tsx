"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Save, Bot, Clock, Globe, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CronJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: any;
  onSuccess: () => void;
}

export function CronJobDialog({ open, onOpenChange, job, onSuccess }: CronJobDialogProps) {
  const { client, connected } = useGateway();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [scheduleKind, setScheduleKind] = useState<"cron" | "every">("cron");
  const [cronExpr, setCronExpr] = useState("0 9 * * *");
  const [everySeconds, setEverySeconds] = useState(3600);
  const [payloadKind, setPayloadKind] = useState<"agentTurn" | "systemEvent">("agentTurn");
  const [agentId, setAgentId] = useState("");
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("");
  const [deliver, setDeliver] = useState(true);
  const [channel, setChannel] = useState("");
  const [to, setTo] = useState("");

  // Load agents
  useEffect(() => {
    if (open && connected && client) {
      client.request("agents.list").then((res: any) => {
        const list = res.agents || [];
        setAgents(list);
        if (!agentId && list.length > 0) {
            setAgentId(res.defaultId || list[0].id);
        }
      });
    }
  }, [open, connected, client]);

  // Reset form
  useEffect(() => {
    if (open) {
      if (job) {
        setName(job.name || "");
        setDescription(job.description || "");
        setEnabled(job.enabled !== false);
        if (job.schedule?.kind === "every") {
          setScheduleKind("every");
          setEverySeconds(Math.round((job.schedule.everyMs || 0) / 1000));
        } else {
          setScheduleKind("cron");
          setCronExpr(job.schedule?.expr || "0 9 * * *");
        }
        if (job.payload?.kind === "systemEvent") {
          setPayloadKind("systemEvent");
          setMessage(job.payload.text || "");
          setChannel("");
          setTo("");
        } else {
          setPayloadKind("agentTurn");
          setAgentId(job.agentId || job.payload?.agentId || "");
          setMessage(job.payload?.message || "");
          setModel(job.payload?.model || "");
          setDeliver(job.payload?.deliver !== false);
          setChannel(job.payload?.channel || job.delivery?.channel || "");
          setTo(job.payload?.to || job.delivery?.to || "");
        }
      } else {
        setName("");
        setDescription("");
        setEnabled(true);
        setScheduleKind("cron");
        setCronExpr("0 9 * * *");
        setPayloadKind("agentTurn");
        setMessage("");
        setModel("");
        setDeliver(false); // New jobs default to false or we can keep it true
        setChannel("");
        setTo("");
      }
    }
  }, [open, job]);

  const handleSave = async () => {
    if (!client) return;
    if (!name.trim()) {
        toast({ title: "请填写任务名称", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
      const schedule = scheduleKind === "cron" 
        ? { kind: "cron", expr: cronExpr } 
        : { kind: "every", everyMs: everySeconds * 1000 };
      
      const payload = payloadKind === "agentTurn" 
        ? { 
            kind: "agentTurn", 
            message, 
            model: model || undefined, 
            deliver,
            channel: deliver ? (channel || undefined) : undefined,
            to: deliver ? (to || undefined) : undefined,
          }
        : { kind: "systemEvent", text: message };

      const data: any = {
        name,
        description,
        enabled,
        schedule,
        payload,
        // 系统事件必须发送到 main 会话，agentTurn 默认使用 isolated
        sessionTarget: payloadKind === "systemEvent" ? "main" : (job?.sessionTarget || "isolated"),
        wakeMode: job?.wakeMode || "next-heartbeat",
        agentId: payloadKind === "agentTurn" ? agentId : undefined,
        delivery: deliver ? {
           mode: "announce",
           channel: channel || undefined,
           to: to || undefined,
        } : { mode: "none" }
      };

      if (job) {
        await client.request("cron.update", { id: job.id, patch: data });
        toast({ title: "任务已更新" });
      } else {
        await client.request("cron.add", data);
        toast({ title: "任务已创建" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "保存失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client || !job) return;
    setLoading(true);
    try {
        await client.request("cron.remove", { id: job.id });
        toast({ title: "任务已删除" });
        onSuccess();
        onOpenChange(false);
    } catch (err: any) {
        toast({ title: "删除失败", description: err.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-border/50 shadow-2xl">
        <DialogTitle className="sr-only">{job ? "编辑任务" : "新建任务"}</DialogTitle>
        <div className="flex h-[550px] sm:h-[600px]">
          <Tabs defaultValue="general" className="flex w-full h-full">
             <div className="w-[180px] sm:w-[220px] border-r border-border/50 bg-muted/20 p-4 sm:p-6 flex flex-col gap-6 shrink-0">
                <div className="select-none">
                    <h3 className="font-bold text-base sm:text-lg tracking-tight">{job ? "编辑作业" : "新建作业"}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">配置自动化流水线</p>
                </div>
                <TabsList className="flex flex-col h-auto bg-transparent space-y-1 sm:space-y-2 p-0 w-full border-0">
                   <TabsTrigger value="general" className="w-full justify-start gap-2.5 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted font-medium transition-colors text-xs sm:text-sm">
                      <Globe className="size-3.5 sm:size-4" /> 基础属性
                   </TabsTrigger>
                   <TabsTrigger value="schedule" className="w-full justify-start gap-2.5 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted font-medium transition-colors text-xs sm:text-sm">
                      <Clock className="size-3.5 sm:size-4" /> 调度规则
                   </TabsTrigger>
                   <TabsTrigger value="payload" className="w-full justify-start gap-2.5 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted font-medium transition-colors text-xs sm:text-sm">
                      <Bot className="size-3.5 sm:size-4" /> 任务指令
                   </TabsTrigger>
                </TabsList>
                
                {job && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleDelete} 
                      disabled={loading}
                      className="mt-auto text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-2 justify-start px-4 h-10 font-bold"
                    >
                        <Trash2 className="size-4" /> 删除作业
                    </Button>
                )}
             </div>

             <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                  <TabsContent value="general" className="m-0 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">任务名称</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：每日进化报告" className="rounded-xl sm:rounded-2xl bg-muted/20" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">描述信息</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="可选，简要说明任务用途" className="rounded-xl sm:rounded-2xl bg-muted/20" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="space-y-0.5">
                          <div className="text-xs sm:text-sm font-bold">启用状态</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">控制此任务是否按计划自动执行</div>
                        </div>
                        <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-green-500" />
                    </div>
                  </TabsContent>

                  <TabsContent value="schedule" className="m-0 space-y-6">
                      <div className="space-y-5">
                          <div className="flex p-1 bg-muted/30 rounded-xl">
                              <button onClick={() => setScheduleKind("cron")} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", scheduleKind === "cron" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Cron 表达式</button>
                              <button onClick={() => setScheduleKind("every")} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", scheduleKind === "every" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>间隔循环</button>
                          </div>

                          {scheduleKind === "cron" ? (
                              <div className="space-y-4">
                                  <div className="space-y-2">
                                      <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground ml-1">表达式 (Cron Expression)</Label>
                                      <Input value={cronExpr} onChange={e => setCronExpr(e.target.value)} className="font-mono text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-muted/50" />
                                  </div>
                                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-[10px] sm:text-xs leading-relaxed text-muted-foreground space-y-1">
                                      <p>标准 Cron 格式：分 时 日 月 周。</p>
                                      <p>· <code className="text-primary font-bold">0 9 * * *</code> 表示每天早上 9:00。</p>
                                      <p>· <code className="text-primary font-bold">*/30 * * * *</code> 表示每隔 30 分钟。</p>
                                  </div>
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground ml-1">循环间隔 (秒)</Label>
                                  <Input type="number" value={everySeconds} onChange={e => setEverySeconds(parseInt(e.target.value) || 0)} className="font-mono text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-muted/50" />
                                  <p className="text-[10px] text-muted-foreground mt-2 ml-1">例如 3600 代表每一小时运行一次。</p>
                              </div>
                          )}
                      </div>
                  </TabsContent>

                  <TabsContent value="payload" className="m-0 space-y-6">
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground ml-1">任务指令 / 载荷内容</Label>
                              <Textarea 
                                  value={message} 
                                  onChange={e => setMessage(e.target.value)} 
                                  placeholder="输入要执行的指令或事件内容..." 
                                  className="text-xs sm:text-sm min-h-[160px] sm:min-h-[220px] rounded-2xl bg-muted/20"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground ml-1">执行主体 (Agent)</Label>
                                <Select 
                                    value={agentId} 
                                    onValueChange={(val) => {
                                        setAgentId(val);
                                        if (val === "__system__") setPayloadKind("systemEvent");
                                        else setPayloadKind("agentTurn");
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl border-input bg-muted/20 h-10 text-xs sm:text-sm">
                                        <SelectValue placeholder="选择执行代理" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50">
                                        <SelectGroup>
                                            <SelectLabel className="text-[10px] uppercase tracking-tighter opacity-50">智能代理</SelectLabel>
                                            {agents.map(a => (
                                                <SelectItem key={a.id} value={a.id} className="text-xs sm:text-sm rounded-lg">
                                                    {a.identity?.name || a.name || a.id}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectSeparator />
                                        <SelectGroup>
                                            <SelectLabel className="text-[10px] uppercase tracking-tighter opacity-50">高级</SelectLabel>
                                            <SelectItem value="__system__" className="text-xs sm:text-sm rounded-lg font-bold text-primary italic">
                                                系统原生事件 (System Event)
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex flex-col justify-end">
                              <div className="flex items-center justify-between p-2.5 bg-primary/5 rounded-xl border border-primary/10 h-10">
                                  <div className="text-[11px] font-bold">送达响应</div>
                                  <Switch checked={deliver} onCheckedChange={setDeliver} disabled={agentId === "__system__"} />
                              </div>
                            </div>
                          </div>

                          {deliver && agentId !== "__system__" && (
                              <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-4 animate-in slide-in-from-top-1 duration-200">
                                  <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                          <Label className="text-[10px] font-bold text-muted-foreground ml-1">频道 (Channel)</Label>
                                          <Input value={channel} onChange={e => setChannel(e.target.value)} placeholder="wechat / lark / last" className="text-xs rounded-xl bg-muted/20 h-9" />
                                      </div>
                                      <div className="space-y-1.5">
                                          <Label className="text-[10px] font-bold text-muted-foreground ml-1">接收人 (To)</Label>
                                          <Input value={to} onChange={e => setTo(e.target.value)} placeholder="群 ID 或帐号 ID" className="text-xs rounded-xl bg-muted/20 h-9" />
                                      </div>
                                  </div>
                                  <p className="text-[9px] text-muted-foreground ml-1 leading-relaxed opacity-70">
                                      * 开启后，AI 执行完指令会将结果回传。默认为 <code className="text-primary">last</code>。
                                  </p>
                              </div>
                          )}
                      </div>
                  </TabsContent>
                </div>

                <div className="p-4 sm:p-6 bg-background border-t border-border/50 flex justify-end gap-3 shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 h-10 text-xs sm:text-sm">取消</Button>
                    <Button onClick={handleSave} disabled={loading} className="rounded-xl px-8 shadow-lg shadow-primary/20 gap-2 h-10 text-xs sm:text-sm font-bold">
                        {loading ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {job ? "保存修改" : "创建作业"}
                    </Button>
                </div>
             </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
