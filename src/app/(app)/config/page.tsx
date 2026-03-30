"use client";
import { useEffect, useState, useMemo } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, Save, Play, RefreshCw, Search, 
  Code, Layout, FileJson, AlertCircle, CheckCircle2,
  ChevronRight, ChevronLeft, Globe, Shield, MessageSquare, Zap, Cpu,
  Database, Bell, Terminal, Palette, Layers, Box, ChevronDown, Check
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";

const SECTIONS = [
  { id: "agents", label: "代理中心 (Agents)", icon: Cpu, desc: "管理多智能体身份、模型及心跳" },
  { id: "auth", label: "身份鉴权 (Auth)", icon: Shield, desc: "管理 API Key 与访问配置" },
  { id: "channels", label: "消息通道 (Channels)", icon: MessageSquare, desc: "配置微信、Discord、Telegram 等对接" },
  { id: "skills", label: "技能设置 (Skills)", icon: Zap, desc: "全局技能开关及环境路径" },
  { id: "gateway", label: "网关设置 (Gateway)", icon: Globe, desc: "端口、内网穿透及底层参数" },
  { id: "logging", label: "日志系统 (Logging)", icon: Terminal, desc: "调试等级及存储配置" },
  { id: "ui", label: "界面偏好 (UI)", icon: Palette, desc: "视觉主题、语言及交互属性" }
];

export default function ConfigPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"form" | "raw">("form");
  const [activeSection, setActiveSection] = useState("agents");
  const [rawConfig, setRawConfig] = useState("");
  const [originalRaw, setOriginalRaw] = useState("");
  const [configObj, setConfigObj] = useState<any>({});
  const [snapshot, setSnapshot] = useState<any>(null);
  const [models, setModels] = useState<{ label: string, value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchData = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const [res, modelRes]: any[] = await Promise.all([
        client.request("config.get", {}),
        client.request("models.list", {})
      ]);
      setSnapshot(res);
      const raw = res.raw || JSON.stringify(res.config || {}, null, 2);
      setRawConfig(raw);
      setOriginalRaw(raw);
      setConfigObj(res.config || {});
      
      if (modelRes && modelRes.models) {
        const uniqueModels = new Map();
        modelRes.models.forEach((m: any) => {
          if (!uniqueModels.has(m.id)) {
            uniqueModels.set(m.id, {
              label: `${m.name || m.id} (${m.provider || "local"})`,
              value: m.id
            });
          }
        });
        setModels(Array.from(uniqueModels.values()));
      }
    } catch (err: any) {
      toast({ title: "加载配置失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, connected]);

  const isDirty = rawConfig !== originalRaw;

  const handleSave = async () => {
    console.log("[Config] handleSave called", { client: !!client, snapshot: !!snapshot, isDirty, rawConfigLength: rawConfig.length });
    if (!client || !connected) {
      toast({ title: "保存失败", description: "网关未连接，请检查连接状态", variant: "destructive" });
      return;
    }
    if (!snapshot) {
      toast({ title: "保存失败", description: "配置数据未加载，请先刷新页面", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const baseHash = snapshot.hash ?? "";
      console.log("[Config] Sending config.set request");
      await client.request("config.set", {
        raw: rawConfig,
        baseHash,
      });
      toast({ title: "保存成功", description: "配置已保存到磁盘" });
      fetchData();
    } catch (err: any) {
      toast({ title: "保存失败", description: err.message, variant: "destructive" });
      console.error("[Config] Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!client || !connected) {
      toast({ title: "应用失败", description: "网关未连接，请检查连接状态", variant: "destructive" });
      return;
    }
    if (!snapshot) {
      toast({ title: "应用失败", description: "配置数据未加载，请先刷新页面", variant: "destructive" });
      return;
    }
    setApplying(true);
    try {
      const baseHash = snapshot.hash ?? "";
      await client.request("config.apply", {
        raw: rawConfig,
        baseHash,
        sessionKey: (window as any)._applySessionKey || "default-session"
      });
      toast({ title: "应用成功", description: "配置已应用，系统已重新加载" });
      fetchData();
    } catch (err: any) {
      toast({ title: "应用失败", description: err.message, variant: "destructive" });
      console.error("[Config] Apply failed:", err);
    } finally {
      setApplying(false);
    }
  };

  const handleFormUpdate = (path: string, value: any) => {
    const next = { ...configObj };
    const parts = path.split(".");
    let current = next;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    setConfigObj(next);
    setRawConfig(JSON.stringify(next, null, 2));
  };

  const renderField = (label: string, path: string, type: "string" | "number" | "boolean" | "select", description?: string, options?: { label: string, value: any }[]) => {
    let rawValue = path.split(".").reduce((o, i) => o?.[i], configObj);
    
    // Handle object values like { primary: "..." } for models
    const displayValue = (typeof rawValue === 'object' && rawValue !== null) 
      ? (rawValue.primary || JSON.stringify(rawValue)) 
      : (rawValue ?? "");

    return (
      <div className="group space-y-1.5 sm:space-y-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all">
        <div className="flex items-center justify-between">
          <label className="text-[11px] sm:text-sm font-semibold">{label}</label>
          {type === "boolean" ? (
            <Switch 
              checked={!!rawValue} 
              onCheckedChange={(v) => handleFormUpdate(path, v)}
              className="scale-75 sm:scale-90"
            />
          ) : null}
        </div>
        
        {description && <p className="hidden sm:block text-[11px] text-muted-foreground leading-relaxed">{description}</p>}
        
        {type === "select" && options ? (
          <Select value={displayValue || ""} onValueChange={(v: string) => handleFormUpdate(path, v)}>
            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm bg-background/50 border-border/50 focus:ring-primary/20">
              <SelectValue placeholder="请选择..." />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-xl">
              {/* If current value is not in options, show it as a special item to avoid blank display */}
              {displayValue && !options.some(o => o.value === displayValue) && (
                <SelectItem key="current-val" value={displayValue} className="text-xs sm:text-sm rounded-lg opacity-60">
                  {displayValue} (当前使用)
                </SelectItem>
              )}
              {options.map((opt, idx) => (
                <SelectItem key={`${opt.value}-${idx}`} value={opt.value} className="text-xs sm:text-sm rounded-lg focus:bg-primary/10 focus:text-primary">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type !== "boolean" && (
          <Input 
            value={displayValue} 
            type={type === "number" ? "number" : "text"}
            onChange={(e) => {
              const val = type === "number" ? Number(e.target.value) : e.target.value;
              // If it was an object, we update the primary field to keep structure, or just overwrite if it's simpler
              if (typeof rawValue === 'object' && rawValue !== null && 'primary' in rawValue) {
                handleFormUpdate(path, { ...rawValue, primary: val });
              } else {
                handleFormUpdate(path, val);
              }
            }}
            className="h-8 sm:h-9 text-xs sm:text-sm bg-background/50 border-border/50 focus:border-primary/30"
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      {/* Top Header */}
      <div className="px-2 sm:px-8 py-1.5 sm:py-4 border-b bg-background/50 backdrop-blur-xl flex items-center justify-between gap-1.5 sm:gap-4 shrink-0">
        <div className="flex items-center gap-1 sm:gap-4 min-w-0">
          {activeSection && (
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 -ml-1 text-muted-foreground" onClick={() => setActiveSection("")}>
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <div className="p-1 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl shrink-0">
            <Settings className="size-3.5 sm:size-5 text-primary" />
          </div>
          <h1 className="text-xs sm:text-xl font-bold truncate">配置</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex bg-muted/40 p-0.5 rounded-lg border">
            <button 
              onClick={() => setMode("form")}
              className={cn("px-1.5 sm:px-4 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all flex items-center gap-1", mode === "form" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Layout className="size-3" /> <span className="hidden sm:inline">可视</span>
            </button>
            <button 
              onClick={() => setMode("raw")}
              className={cn("px-1.5 sm:px-4 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all flex items-center gap-1", mode === "raw" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Code className="size-3" /> <span className="hidden sm:inline">源码</span>
            </button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="h-7 w-7 sm:h-9 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl border-border/50">
              <RefreshCw className={cn("size-3 sm:size-3.5", loading && "animate-spin")} />
              <span className="hidden sm:inline ml-2">重载</span>
            </Button>
            <Button 
              size="icon" 
              disabled={!isDirty || saving} 
              onClick={handleSave}
              className="h-7 w-7 sm:h-9 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Save className="size-3 sm:size-3.5" />
              <span className="hidden sm:inline ml-2">保存</span>
            </Button>
            <Button 
              size="icon" 
              disabled={!isDirty || applying} 
              onClick={handleApply}
              className="h-7 w-7 sm:h-9 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="size-3 sm:size-3.5" />
              <span className="hidden sm:inline ml-2">应用</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={cn(
          "w-full md:w-72 border-r bg-muted/10 overflow-y-auto p-2 sm:p-4 space-y-1 shrink-0",
          activeSection && "hidden md:block"
        )}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full flex items-center md:items-start gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-2xl transition-all group relative overflow-hidden",
                activeSection === s.id 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "hover:bg-muted/50 border border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <s.icon className={cn("size-4 sm:size-5", activeSection === s.id ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground")} />
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold truncate">{s.label}</p>
                <p className="hidden sm:block text-[10px] opacity-70 leading-tight mt-0.5 line-clamp-1">{s.desc}</p>
              </div>
              <ChevronRight className="md:hidden size-3 text-muted-foreground/40" />
            </button>
          ))}
          <div className="pt-4 sm:pt-8 px-2 sm:px-4">
            <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase">
                <AlertCircle className="size-2.5 sm:size-3" /> 注意事项
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">
                部分配置可能需要系统重新加载。
              </p>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden bg-background">
          {mode === "raw" ? (
            <div className="h-full relative font-mono text-xs group">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={rawConfig}
                theme="vs-dark"
                onChange={(v) => setRawConfig(v || "")}
                options={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    fontFamily: "'Fira Code', 'Monaco', monospace",
                    padding: { top: 8 },
                    lineNumbers: "on",
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    cursorStyle: "line",
                    automaticLayout: true,
                    minimap: { enabled: false },
                    bracketPairColorization: { enabled: true },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    renderLineHighlight: "all",
                    tabSize: 2,
                    folding: true,
                }}
              />
              <div className="absolute top-2 right-4 flex items-center gap-1 z-10 scale-[0.6] origin-right opacity-50 hover:opacity-100 transition-opacity">
                <Badge variant="outline" className="bg-background/80 backdrop-blur border-primary/20 text-primary uppercase">JSON</Badge>
                {isDirty && <Badge variant="warning">Dirty</Badge>}
              </div>
            </div>
          ) : (
            <div className={cn(
              "h-full overflow-y-auto p-4 sm:p-12 space-y-6 sm:space-y-12 max-w-4xl",
              !activeSection && "hidden md:block"
            )}>
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl">
                    {(() => {
                      const Icon = SECTIONS.find(s => s.id === activeSection)?.icon || Box;
                      return <Icon className="size-4 sm:size-6 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-2xl font-bold">{SECTIONS.find(s => s.id === activeSection)?.label}</h2>
                    <p className="hidden sm:block text-muted-foreground">{SECTIONS.find(s => s.id === activeSection)?.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {activeSection === "agents" && (
                    <>
                      {renderField("默认模型", "agents.defaults.model", "select", "系统全局默认使用的 AI 模型 ID", models)}
                      {renderField("上下文窗口", "agents.defaults.contextTokens", "number", "单次对话允许注入的最大 Token 数")}
                      {renderField("推理默认等级", "agents.defaults.thinkingDefault", "select", "决定模型生成回复时的思考深度", [
                        { label: "禁用 (off)", value: "off" },
                        { label: "极简 (minimal)", value: "minimal" },
                        { label: "低 (low)", value: "low" },
                        { label: "中 (medium)", value: "medium" },
                        { label: "高 (high)", value: "high" },
                        { label: "极高 (xhigh)", value: "xhigh" },
                        { label: "自动适配 (adaptive)", value: "adaptive" }
                      ])}
                      {renderField("并发上限", "agents.defaults.maxConcurrent", "number", "全局允许同时运行的 Agent 任务数")}
                    </>
                  )}
                  {activeSection === "auth" && (
                    <>
                      {renderField("网关 Token", "gateway.auth.token", "string", "控制台访问的鉴权密钥")}
                      {renderField("允许注册", "gateway.auth.allowSignup", "boolean", "是否允许新节点自助加入集群")}
                      {renderField("强制 HTTPS", "gateway.auth.forceHttps", "boolean", "所有流量均要求 SSL 加密")}
                    </>
                  )}
                  {activeSection === "gateway" && (
                    <>
                      {renderField("监听端口", "gateway.port", "number", "网关服务运行的 TCP 端口 (1-65535)")}
                      {renderField("启用穿透", "gateway.tunnel.enabled", "boolean", "是否开启 Built-in 域名穿透服务")}
                      {renderField("穿透前缀", "gateway.tunnel.subdomain", "string", "分配的二级域名子域")}
                    </>
                  )}
                  {activeSection === "logging" && (
                    <>
                      {renderField("日志等级", "logging.level", "string", "系统输出等级 (trace/debug/info/warn/error)")}
                      {renderField("保存到文件", "logging.toFile", "boolean", "是否在 data/logs 中持久化存储")}
                      {renderField("染色输出", "logging.colors", "boolean", "控制台日志是否显示 ANSI 颜色")}
                    </>
                  )}
                  {activeSection === "skills" && (
                    <>
                      {renderField("工作区路径", "skills.workspaceDir", "string", "自定义扩展插件的扫描根目录")}
                      {renderField("核心隔离自启", "skills.isolated", "boolean", "是否将关键技能运行在沙箱容器中")}
                    </>
                  )}
                  {activeSection === "ui" && (
                    <>
                      {renderField("深色模式", "ui.darkMode", "boolean", "全局强制使用暗黑系主题")}
                      {renderField("紧凑布局", "ui.compact", "boolean", "大幅缩减组件间距，提高单页信息密度")}
                      {renderField("动画增强", "ui.animations", "boolean", "开启高级转场与微交互动效")}
                    </>
                  )}
                </div>

                <div className="mt-8 sm:mt-12 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-dashed border-border/50 flex flex-col items-center text-center space-y-2 sm:space-y-4 opacity-40 hover:opacity-100 transition-opacity">
                  <FileJson className="size-6 sm:size-8 text-muted-foreground stroke-1" />
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium">配置深层参数？</p>
                    <p className="hidden sm:block text-xs text-muted-foreground italic">表单仅展示常用项。</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setMode("raw")} className="h-7 sm:h-9 text-[10px] sm:text-xs rounded-lg sm:rounded-xl px-4">
                    进入源码编辑
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
