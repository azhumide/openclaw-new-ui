"use client";

import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wand2, Plus, CheckCircle2, ChevronRight, 
  Info, AlertCircle, RefreshCw, Layers,
  LayoutGrid, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentSkillPanelProps {
  agentId: string;
}

export function AgentSkillPanel({ agentId }: AgentSkillPanelProps) {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [skills, setSkills] = useState<any[]>([]);
  const [installedSkills, setInstalledSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchData = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      // 1. Fetch global skills status
      const skillRes = await client.request("skills.status");
      setSkills(skillRes.skills || []);

      // 2. Fetch agent's TOOLS.md content to check installed skills
      const fileRes = await client.request("agents.files.get", { agentId, name: "TOOLS.md" });
      const content = fileRes.file?.content || "";
      
      // Parse skill IDs from content like "- Skill: wechat"
      const matches = Array.from(content.matchAll(/- Skill:\s*([a-zA-Z0-9_\-]+)/g)) as any[];
      const installed = matches.map(m => m[1]);
      setInstalledSkills(installed);
    } catch (e: any) {
      console.error("Failed to fetch agent skill data", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = async (skillId: string, isInstalled: boolean) => {
    if (!client || !connected) return;
    setSyncing(skillId);
    try {
      const fileRes = await client.request("agents.files.get", { agentId, name: "TOOLS.md" });
      let content = fileRes.file?.content || "";
      
      if (isInstalled) {
        // Remove skill
        const regex = new RegExp(`^- Skill:\\s*${skillId}\\r?\\n?`, "m");
        content = content.replace(regex, "");
      } else {
        // Add skill
        if (!content.trim()) content = "# Tools & Skills\n\n";
        content += `- Skill: ${skillId}\n`;
      }
      
      await client.request("agents.files.set", { agentId, name: "TOOLS.md", content });
      
      toast({
        title: isInstalled ? "已卸载技能" : "已成功挂载技能",
        description: `${skillId} 已从您的代理逻辑中同步。`,
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "同步失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [agentId, client, connected]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">可用技能库</h3>
            <p className="text-xs text-muted-foreground font-medium">挂载技能后，Agent 可以在对话中识别并调用对应的工具能力。</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl h-8 gap-2 border-border/40">
           <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
           刷新库
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.length === 0 ? (
           <div className="col-span-full py-16 text-center text-muted-foreground opacity-40 bg-muted/5 rounded-2xl border-2 border-dashed border-border/50">
             <Layers className="size-10 mx-auto mb-3" strokeWidth={1} />
             <p className="text-sm font-medium">未发现可用技能集</p>
           </div>
        ) : (
           skills.map(skill => {
              const sid = skill.skillKey || skill.name;
              const isInstalled = installedSkills.includes(sid);
              const isBusy = syncing === sid;
              
              return (
                 <Card key={sid} className={cn(
                    "p-5 border-border/50 bg-background/50 backdrop-blur-sm rounded-2xl relative overflow-hidden transition-all group",
                    isInstalled ? "border-primary/30 ring-1 ring-primary/10" : "hover:border-primary/20"
                 )}>
                    {isInstalled && (
                       <div className="absolute top-0 right-0 p-2 opacity-20 text-primary">
                          <CheckCircle2 className="size-16 -mr-4 -mt-4 rotate-12" />
                       </div>
                    )}
                    
                    <div className="flex items-start justify-between relative z-10">
                       <div className={cn(
                          "p-3 rounded-xl border transition-all",
                          isInstalled ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border/50 text-muted-foreground group-hover:bg-primary/5 group-hover:border-primary/10"
                       )}>
                          <Wand2 className="size-5" />
                       </div>
                       
                       <Button 
                          variant={isInstalled ? "secondary" : "default"} 
                          size="sm" 
                          disabled={isBusy}
                          onClick={() => toggleSkill(sid, isInstalled)}
                          className={cn(
                             "h-8 px-4 text-[10px] sm:text-xs font-bold rounded-lg transition-all",
                             isInstalled ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border" : "shadow-lg shadow-primary/20"
                          )}
                       >
                          {isBusy ? <RefreshCw className="size-3.5 animate-spin mr-1.5" /> : (isInstalled ? <Trash2 className="size-3.5 mr-1.5" /> : <Plus className="size-3.5 mr-1.5" />)}
                          {isInstalled ? "移除技能" : "挂载到代理"}
                       </Button>
                    </div>

                    <div className="mt-5 space-y-2 relative z-10">
                       <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm tracking-tight">{skill.name}</h4>
                          {isInstalled && <CheckCircle2 className="size-3.5 text-primary" />}
                       </div>
                       <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 min-h-8">
                          {skill.description || `增强 ${agentId} 处理能力的 ${skill.name} 单元。`}
                       </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between relative z-10 text-[9px] font-mono opacity-40 uppercase">
                       <span>{sid}</span>
                       <span className="flex items-center gap-1">
                          <Info className="size-3" />
                          DETAILS
                       </span>
                    </div>
                 </Card>
              );
           })
        )}
      </div>
    </div>
  );
}
