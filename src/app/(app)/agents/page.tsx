"use client";
import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, RefreshCw, Cpu, Box, Fingerprint, 
  ChevronLeft, ChevronRight, Plus, Trash2, Shield, 
  FileText, Zap, Brain, MessageSquare, 
  Globe, LayoutGrid, Terminal, ExternalLink,
  Search, Wand2, Star, CheckCircle2, AlertTriangle,
  History, Clock, MoreVertical, Sliders
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateAgentDialog } from "@/components/create-agent-dialog";
import { AgentConfigEditor } from "@/components/agent-config-editor";
import { AgentSkillPanel } from "@/components/agent-skill-panel";
import { AgentLogPanel } from "@/components/agent-log-panel";

interface SkillItem {
  name: string;
  id: string;
  description?: string;
  source?: string;
}

export default function AgentsPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [agentsList, setAgentsList] = useState<any>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);

  const fetchAgents = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const res = await client.request("agents.list");
      setAgentsList(res);
      if (!selectedAgentId && res?.agents?.length > 0) {
        setSelectedAgentId(res.defaultId || res.agents[0].id);
      }
    } catch (err: any) {
      toast({
        title: "无法获取代理列表",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    if (!client || !connected) return;
    try {
      const res = await client.request("skills.status");
      setSkills(res.skills || []);
    } catch (e) {
      console.error("Failed to fetch skills", e);
    }
  };

  const handleDeleteAgent = async () => {
    if (!client || !selectedAgentId) return;
    if (selectedAgentId === agentsList?.defaultId) {
      toast({ title: "删除失败", description: "默认代理不允许删除。", variant: "destructive" });
      return;
    }
    if (!confirm(`确定要永久删除代理 ${selectedAgentId} 吗？\n该操作将移除其配置文件和所有上下文。`)) return;

    setDeleting(true);
    try {
      await client.request("agents.delete", { agentId: selectedAgentId });
      toast({ title: "删除成功", description: `代理 ${selectedAgentId} 已被移除。` });
      setSelectedAgentId(null);
      fetchAgents();
    } catch (err: any) {
      toast({ title: "删除失败", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchSkills();
  }, [client, connected]);

  const agents = agentsList?.agents || [];
  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);

  return (
    <div className="flex flex-col md:flex-row h-full p-3 sm:p-6 gap-3 sm:gap-6 max-w-7xl mx-auto animate-in fade-in duration-300 overflow-hidden text-foreground">
      {/* Sidebar: Agents List */}
      <Card className={cn(
        "w-full md:w-80 flex flex-col shrink-0 border-border/50 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm",
        selectedAgentId && "hidden md:flex"
      )}>
        <div className="p-3 sm:p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <div className="flex flex-col">
            <h2 className="font-bold tracking-tight text-sm sm:text-base">智能代理列表</h2>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-black opacity-60 tracking-wider ">{agents.length} AGENTS ONLINE</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={fetchAgents} disabled={loading} className="size-8 rounded-full hover:bg-background shadow-sm hover:rotate-180 transition-transform duration-500">
                <RefreshCw className={cn("size-3.5 sm:size-4 text-muted-foreground", loading && "animate-spin")} />
            </Button>
            <Button variant="default" size="icon" onClick={() => setCreateDialogOpen(true)} className="size-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-primary-foreground">
                <Plus className="size-3.5 sm:size-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2 custom-scrollbar">
          {agents.length === 0 && !loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              暂无代理节点
            </div>
          ) : (
             agents.map((agent: any) => {
               const isSelected = selectedAgentId === agent.id;
               const isDefault = agentsList?.defaultId === agent.id;
               const title = agent.identity?.name || agent.name || agent.id;
               const subtitle = agent.identity?.theme || "Agent workspace";
               
               return (
                 <button
                   key={agent.id}
                   onClick={() => setSelectedAgentId(agent.id)}
                   className={cn(
                     "w-full flex items-start gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-xl transition-all text-left border border-transparent",
                     isSelected 
                       ? "bg-primary/10 border-primary/20 shadow-sm"
                       : "hover:bg-muted/50"
                   )}
                 >
                   <div className={cn(
                     "size-8 sm:size-10 rounded-full flex items-center justify-center shrink-0 border",
                     isSelected ? "bg-primary text-primary-foreground border-primary/20" : "bg-muted border-border/50"
                   )}>
                     <Bot className="size-4 sm:size-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-1.5 sm:gap-2">
                       <span className={cn("font-semibold truncate text-[12px] sm:text-sm", isSelected ? "text-primary" : "text-foreground")}>{title}</span>
                       {isDefault && (
                         <span className="px-1 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20 shrink-0">Def</span>
                       )}
                     </div>
                     <p className="text-[10px] sm:text-xs text-muted-foreground truncate opacity-80 mt-0.5">{subtitle}</p>
                   </div>
                 </button>
               );
             })
          )}
        </div>
      </Card>

      {/* Main Area: Agent Details */}
      <div className={cn(
          "flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar md:pr-1",
          !selectedAgentId && "hidden md:block"
      )}>
        {!selectedAgent ? (
           <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 p-6">
             <Bot className="size-16 mb-4 opacity-20" />
             <p className="text-sm text-center">请在左侧选择一个智能代理以查看详情</p>
           </div>
        ) : (
           <div className="h-full flex flex-col space-y-2.5 sm:space-y-6 animate-in slide-in-from-right-4 duration-300">
             {selectedAgentId && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedAgentId(null)} className="md:hidden w-fit h-6 text-[10px] px-1 gap-1 -ml-1 text-muted-foreground font-semibold">
                    <ChevronLeft className="size-3.5" />
                    返回列表
                </Button>
             )}
             
             <Card className="p-3 sm:p-6 border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20 relative overflow-hidden rounded-xl sm:rounded-2xl">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />
                
                <div className="flex items-center sm:items-start gap-3 sm:gap-5 relative z-10">
                  <div className="size-10 sm:size-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 shrink-0 border border-primary/50">
                    <Bot className="size-5 sm:size-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                       <h1 className="text-base sm:text-2xl font-bold tracking-tight truncate">{selectedAgent.identity?.name || selectedAgent.name || selectedAgent.id}</h1>
                       {agentsList?.defaultId === selectedAgent.id && (
                          <span className="sm:hidden inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-orange-500/10 text-orange-600 border border-orange-500/20">默认</span>
                       )}
                    </div>
                    <p className="hidden sm:block text-sm text-muted-foreground mt-1 truncate">{selectedAgent.identity?.theme || "Agent workspace and routing."}</p>
                    <div className="flex items-center gap-2 mt-1 sm:mt-3">
                      <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-xs font-mono font-medium bg-muted border border-border/50 text-foreground">
                        {selectedAgent.id}
                      </span>
                      {agentsList?.defaultId === selectedAgent.id && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
                          默认代理
                        </span>
                      )}
                    </div>
                  </div>
                </div>
             </Card>
             
             <div className="flex-1 min-h-0 flex flex-col">
               <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                  <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-8 sm:h-12 p-0 space-x-4 sm:space-x-8">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-1 sm:py-3 px-1 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all">概览</TabsTrigger>
                    <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-1 sm:py-3 px-1 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all">工作空间</TabsTrigger>
                    <TabsTrigger value="skills" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-1 sm:py-3 px-1 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all">技能库</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-1 sm:py-3 px-1 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all">调试与日志</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="flex-1 mt-3 sm:mt-6 space-y-4 focus-visible:outline-none overflow-y-auto pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                      <Card className="p-4 sm:p-6 border-border/50 space-y-3 bg-background/50 rounded-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Shield className="size-16" />
                         </div>
                         <div className="flex items-center gap-2 text-primary">
                           <LayoutGrid className="size-4" />
                           <h3 className="font-bold text-[10px] uppercase tracking-widest">身份与作用域</h3>
                         </div>
                         <div className="space-y-2 relative z-10">
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">作用域</span>
                                <span className="font-mono font-bold uppercase">{selectedAgent.scope || "Isolated"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">身份名</span>
                                <span className="font-bold">{selectedAgent.identity?.name || "未指定"}</span>
                            </div>
                         </div>
                      </Card>

                      <Card className="p-4 sm:p-6 border-border/50 space-y-3 bg-background/50 rounded-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Brain className="size-16 text-emerald-500" />
                         </div>
                         <div className="flex items-center gap-2 text-emerald-500">
                           <Zap className="size-4" />
                           <h3 className="font-bold text-[10px] uppercase tracking-widest">计算模型</h3>
                         </div>
                         <div className="space-y-2 relative z-10">
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">基础模型</span>
                                <span className="font-mono text-[10px] sm:text-xs font-bold truncate max-w-[120px]">{selectedAgent.model || "Default Model"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">思考等级</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-bold uppercase italic text-[11px]">Fully Powered</span>
                                </div>
                            </div>
                         </div>
                      </Card>

                      <Card className="p-4 sm:p-6 border-border/50 space-y-3 bg-background/50 rounded-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Box className="size-16 text-indigo-500" />
                         </div>
                         <div className="flex items-center gap-2 text-indigo-500">
                           <Globe className="size-4" />
                           <h3 className="font-bold text-[10px] uppercase tracking-widest">网关连接</h3>
                         </div>
                         <div className="space-y-2 relative z-10">
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">主网关</span>
                                <span className="font-mono font-bold uppercase">{agentsList?.mainKey || "MAIN"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">状态</span>
                                <span className="font-bold text-indigo-500 flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    Active
                                </span>
                            </div>
                         </div>
                      </Card>
                    </div>

                    <Card className="p-6 sm:p-10 border-border/50 bg-muted/10 overflow-hidden relative rounded-2xl group">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                          <div className="space-y-2">
                             <h4 className="font-black text-xs uppercase tracking-[0.2em] opacity-40">Agent Workspace</h4>
                             <p className="text-sm font-medium opacity-80 leading-relaxed font-mono truncate max-w-[400px]">
                                {selectedAgent.workspace || "Auto-resolved from gateway configuration"}
                             </p>
                          </div>
                          <div className="flex items-center gap-3">
                             <Button variant="outline" className="rounded-xl font-bold text-xs gap-2 border-border/40 hover:bg-background">
                                <ExternalLink className="size-3.5" />
                                打开目录
                             </Button>
                          </div>
                       </div>
                    </Card>

                    <div className="pt-6 border-t border-border/20">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="size-4" />
                                    危险操作区
                                </h4>
                                <p className="text-[11px] text-muted-foreground">删除此代理将清除其所有在网关上的配置以及工作空间文件。</p>
                            </div>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                disabled={deleting}
                                onClick={handleDeleteAgent}
                                className="rounded-xl font-bold px-5 shadow-lg shadow-destructive/20 active:scale-95 transition-all"
                            >
                                {deleting ? <RefreshCw className="size-3.5 animate-spin mr-2" /> : <Trash2 className="size-3.5 mr-2" />}
                                彻底移除代理
                            </Button>
                        </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="files" className="flex-1 mt-3 sm:mt-6 focus-visible:outline-none h-full overflow-hidden">
                    <AgentConfigEditor agentId={selectedAgent.id} />
                  </TabsContent>
                  
                  <TabsContent value="skills" className="flex-1 mt-3 sm:mt-6 focus-visible:outline-none h-full overflow-hidden">
                    <AgentSkillPanel agentId={selectedAgent.id} />
                  </TabsContent>
                  
                  <TabsContent value="activity" className="flex-1 mt-3 sm:mt-6 focus-visible:outline-none h-full overflow-hidden">
                    <AgentLogPanel agentId={selectedAgent.id} />
                  </TabsContent>
               </Tabs>
             </div>
           </div>
        )}
      </div>

      <CreateAgentDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onCreated={fetchAgents} 
      />
    </div>
  );
}
