"use client";
import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, RefreshCw, Cpu, Box, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [agentsList, setAgentsList] = useState<any>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

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
        description: err.message || "请求 agents.list 失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [client, connected]);

  const agents = agentsList?.agents || [];
  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);

  return (
    <div className="flex h-full p-6 gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Sidebar: Agents List */}
      <Card className="w-80 flex flex-col shrink-0 border-border/50 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="font-bold tracking-tight">智能代理列表</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{agents.length} 个配置单元</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAgents} disabled={loading} className="size-8 rounded-full">
            <RefreshCw className={cn("size-4 text-muted-foreground", loading && "animate-spin")} />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
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
                     "w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left border border-transparent",
                     isSelected 
                       ? "bg-primary/10 border-primary/20 shadow-sm"
                       : "hover:bg-muted/50"
                   )}
                 >
                   <div className={cn(
                     "size-10 rounded-full flex items-center justify-center shrink-0 border",
                     isSelected ? "bg-primary text-primary-foreground border-primary/20" : "bg-muted border-border/50"
                   )}>
                     <Bot className="size-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className={cn("font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>{title}</span>
                       {isDefault && (
                         <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20 shrink-0">Default</span>
                       )}
                     </div>
                     <p className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">{subtitle}</p>
                     <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">{agent.id}</p>
                   </div>
                 </button>
               );
             })
          )}
        </div>
      </Card>

      {/* Main Area: Agent Details */}
      <div className="flex-1 min-w-0">
        {!selectedAgent ? (
           <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
             <Bot className="size-16 mb-4 opacity-20" />
             <p>请在左侧选择一个智能代理以查看详情</p>
           </div>
        ) : (
           <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-right-4 duration-300">
             <Card className="p-6 border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none" />
                
                <div className="flex items-start gap-5 relative z-10">
                  <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 shrink-0 border border-primary/50">
                    <Bot className="size-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">{selectedAgent.identity?.name || selectedAgent.name || selectedAgent.id}</h1>
                    <p className="text-muted-foreground mt-1">{selectedAgent.identity?.theme || "Agent workspace and routing."}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-muted border border-border/50 text-foreground">
                        {selectedAgent.id}
                      </span>
                      {agentsList?.defaultId === selectedAgent.id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
                          默认代理
                        </span>
                      )}
                    </div>
                  </div>
                </div>
             </Card>
             
             <div className="flex-1 min-h-0 flex flex-col">
               <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                 <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-12 p-0 space-x-6">
                   <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-medium">概览 (Overview)</TabsTrigger>
                   <TabsTrigger value="files" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-medium">配置与提示词 (Files)</TabsTrigger>
                   <TabsTrigger value="tools" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-medium">工具 (Tools)</TabsTrigger>
                   <TabsTrigger value="skills" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 font-medium">专属技能 (Skills)</TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="overview" className="flex-1 mt-6 space-y-6 focus-visible:outline-none">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <Card className="p-5 border-border/50 space-y-4 hover:border-primary/20 transition-colors bg-background/50">
                        <div className="flex items-center gap-2 text-primary">
                          <Fingerprint className="size-4" />
                          <h3 className="font-semibold text-foreground">身份标识名 (Identity)</h3>
                        </div>
                        <div className="text-sm">{selectedAgent.identity?.name || selectedAgent.name || selectedAgent.id}</div>
                     </Card>
                     <Card className="p-5 border-border/50 space-y-4 hover:border-primary/20 transition-colors bg-background/50">
                        <div className="flex items-center gap-2 text-blue-500">
                          <Cpu className="size-4" />
                          <h3 className="font-semibold text-foreground">默认工具权限 (Tool Scope)</h3>
                        </div>
                        <div className="text-sm capitalize">{selectedAgent.scope === "isolated" ? "独立隔离 (Isolated)" : (selectedAgent.scope || "完全隔离 (Isolated)")}</div>
                     </Card>
                     <Card className="p-5 border-border/50 space-y-4 hover:border-primary/20 transition-colors bg-background/50">
                        <div className="flex items-center gap-2 text-green-500">
                          <Box className="size-4" />
                          <h3 className="font-semibold text-foreground">网关核心分配 (Gateway Core)</h3>
                        </div>
                        <div className="text-sm font-mono text-muted-foreground">{agentsList?.mainKey || "未分配"}</div>
                     </Card>
                   </div>
                   <Card className="p-6 border-border/50 border-dashed bg-muted/10 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[150px]">
                     <p className="text-sm">模型选择器 (Model Fallbacks) 面板正在组装</p>
                   </Card>
                 </TabsContent>
                 
                 <TabsContent value="files" className="flex-1 mt-6 focus-visible:outline-none">
                   <Card className="p-12 border-border/50 border-dashed bg-muted/10 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                     <Box className="size-8 opacity-20 mb-3" />
                     <p className="text-sm font-medium">配置与提示词修改模块开发中</p>
                     <p className="text-xs mt-1">未来可在此直接热更 MEMORY.md 与工作流协议</p>
                   </Card>
                 </TabsContent>
                 
                 <TabsContent value="tools" className="flex-1 mt-6 focus-visible:outline-none">
                   <Card className="p-12 border-border/50 border-dashed bg-muted/10 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                     <Cpu className="size-8 opacity-20 mb-3" />
                     <p className="text-sm font-medium">专属工具挂载面板开发中</p>
                     <p className="text-xs mt-1">控制此代理授权使用哪些底层核心工具箱</p>
                   </Card>
                 </TabsContent>
                 
                 <TabsContent value="skills" className="flex-1 mt-6 focus-visible:outline-none">
                   <Card className="p-12 border-border/50 border-dashed bg-muted/10 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                     <Fingerprint className="size-8 opacity-20 mb-3" />
                     <p className="text-sm font-medium">外挂专属技能库开发中</p>
                     <p className="text-xs mt-1">将全局技能库中的特定技能 (如电影资源搜索) 桥接到此代理</p>
                   </Card>
                 </TabsContent>
               </Tabs>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
