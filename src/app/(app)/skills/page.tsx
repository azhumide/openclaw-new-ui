"use client";
import { useEffect, useState, useMemo } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, RefreshCw, Search, Box, Info, AlertTriangle, 
  CheckCircle2, Download, ShieldCheck, Key, ExternalLink,
  ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";



export default function SkillsPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "built-in": true,
    "workspace": false
  });

  const fetchData = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const res = await client.request("skills.status", {});
      setReport(res);
    } catch (err: any) {
      toast({ title: "加载技能失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, connected]);

  const skills = useMemo(() => {
    const list = report?.skills || [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((item: any) => 
      item.name.toLowerCase().includes(s) || 
      item.description.toLowerCase().includes(s) || 
      item.skillKey.toLowerCase().includes(s)
    );
  }, [report, search]);

  const groups = useMemo(() => {
    const map: Record<string, { label: string, items: any[] }> = {
      "workspace": { label: "工作区技能 (Workspace)", items: [] },
      "managed": { label: "托管技能 (Managed)", items: [] },
      "built-in": { label: "内置技能 (Built-in)", items: [] },
      "other": { label: "其他技能 (Other)", items: [] }
    };

    skills.forEach((skill: any) => {
      const source = skill.source || "";
      if (source.startsWith("workspace")) map["workspace"].items.push(skill);
      else if (source.startsWith("openclaw-managed")) map["managed"].items.push(skill);
      else if (source.startsWith("openclaw-bundled")) map["built-in"].items.push(skill);
      else map["other"].items.push(skill);
    });

    return Object.entries(map).filter(([_, group]) => group.items.length > 0);
  }, [skills]);

  const toggleSkill = async (skillKey: string, currentDisabled: boolean) => {
    if (!client) return;
    setBusyKey(skillKey);
    try {
      await client.request("skills.update", { skillKey, enabled: currentDisabled });
      toast({ title: currentDisabled ? "已开启该技能" : "已停用该技能" });
      fetchData();
    } catch (err: any) {
      toast({ title: "操作失败", description: err.message, variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  };

  const saveKey = async (skillKey: string) => {
    if (!client) return;
    const apiKey = edits[skillKey];
    if (apiKey === undefined) return;
    setBusyKey(skillKey);
    try {
      await client.request("skills.update", { skillKey, apiKey });
      toast({ title: "配置已保存", description: "API Key 已成功更新。" });
      fetchData();
    } catch (err: any) {
      toast({ title: "保存失败", description: err.message, variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  };

  const installSkill = async (skill: any) => {
    if (!client) return;
    setBusyKey(skill.skillKey);
    try {
      const option = skill.install[0];
      const res: any = await client.request("skills.install", {
        name: skill.name,
        installId: option.id,
        timeoutMs: 120000
      });
      toast({ title: "安装成功", description: res.message || "技能依赖已安装。" });
      fetchData();
    } catch (err: any) {
      toast({ title: "安装失败", description: err.message, variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">扩展技能 (Skills)</h1>
          <p className="text-muted-foreground mt-1">
            总览并调整当前所有开启的扩展插件及三方工具 (Tools)。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="搜索技能名称或描述..." 
              className="pl-9 w-[280px] bg-background/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="rounded-xl">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {groups.length === 0 && !loading && (
          <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-muted/20 opacity-60">
            <Zap className="size-12 mx-auto mb-4 stroke-1" />
            <p>未找到符合条件的技能</p>
          </div>
        )}

        {groups.map(([id, group]) => (
          <div key={id} className="space-y-4">
            <button 
              onClick={() => setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }))}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 hover:text-foreground transition-colors group"
            >
              {collapsedGroups[id] ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
              {group.label}
              <span className="ml-2 bg-muted px-1.5 py-0.5 rounded text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">
                {group.items.length}
              </span>
            </button>
            
            {!collapsedGroups[id] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((skill: any) => (
                  <Card key={skill.skillKey} className="group relative overflow-hidden bg-background/50 border-border/50 hover:border-primary/30 transition-all duration-300">
                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{skill.emoji || "🧩"}</span>
                            <h3 className="font-bold text-base truncate">{skill.name}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                            {skill.description}
                          </p>
                        </div>
                        <Switch 
                          checked={!skill.disabled} 
                          onCheckedChange={(checked) => toggleSkill(skill.skillKey, skill.disabled)}
                          disabled={busyKey === skill.skillKey}
                          className="data-[state=checked]:bg-emerald-500 scale-90"
                        />
                      </div>

                      {/* Status Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {skill.disabled ? (
                          <Badge variant="secondary" className="opacity-70">已停用</Badge>
                        ) : (
                          <Badge variant="success">已启用</Badge>
                        )}
                        {skill.bundled && <Badge variant="outline" className="text-[10px]">内置</Badge>}
                        {skill.eligible === false && <Badge variant="warning" className="text-[10px]">不可用</Badge>}
                        {skill.blockedByAllowlist && <Badge variant="destructive" className="text-[10px]">限制访问</Badge>}
                      </div>

                      {/* Requirements / Missing */}
                      {(skill.missing.bins.length > 0 || skill.missing.env.length > 0 || skill.missing.config.length > 0) && (
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-2">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-500 uppercase tracking-tight">
                            <AlertTriangle className="size-3" />
                            缺失配置或环境
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {skill.missing.bins.map((b: string) => <Badge key={b} variant="destructive" className="text-[9px] py-0 px-1.5">Bin: {b}</Badge>)}
                            {skill.missing.env.map((e: string) => <Badge key={e} variant="warning" className="text-[9px] py-0 px-1.5">ENV: {e}</Badge>)}
                            {skill.missing.config.map((c: string) => <Badge key={c} variant="destructive" className="text-[9px] py-0 px-1.5">Config: {c}</Badge>)}
                          </div>
                          {skill.install.length > 0 && skill.missing.bins.length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-7 text-[10px] gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-600"
                              onClick={() => installSkill(skill)}
                              disabled={busyKey === skill.skillKey}
                            >
                              <Download className="size-3" />
                              一键安装依赖
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Config Area (API Key) */}
                      {skill.primaryEnv && (
                        <div className="space-y-2 pt-2 border-t border-border/30">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">
                              {skill.primaryEnv} (API Key)
                            </label>
                            {skill.homepage && (
                              <a href={skill.homepage} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                                获取 <ExternalLink className="size-2" />
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input 
                              type="password" 
                              placeholder="贴入密钥..." 
                              className="h-8 text-xs bg-muted/30"
                              value={edits[skill.skillKey] ?? ""}
                              onChange={(e) => setEdits(prev => ({ ...prev, [skill.skillKey]: e.target.value }))}
                            />
                            <Button 
                              size="sm" 
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => saveKey(skill.skillKey)}
                              disabled={busyKey === skill.skillKey || edits[skill.skillKey] === undefined}
                            >
                              <Key className="size-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
