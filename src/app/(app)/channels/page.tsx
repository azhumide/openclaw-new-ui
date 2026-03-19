"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { useGateway } from "@/context/gateway-context";
import { 
  Radio, AlertTriangle, CheckCircle2, 
  RefreshCw, Power, Settings2, Key,
  MessageSquare, Send, Globe, ShieldAlert,
  Zap, Clock, XCircle, MoreVertical, LogOut,
  RefreshCcw, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppLoginModal } from "@/components/whatsapp-login-modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// 获取频道品牌的辅助函数
const getChannelBrand = (id: string) => {
  const mid = id.toLowerCase();
  if (mid.includes("whatsapp")) return { name: "WhatsApp", color: "text-green-500", bg: "bg-green-500/10", icon: Send };
  if (mid.includes("telegram")) return { name: "Telegram", color: "text-blue-500", bg: "bg-blue-500/10", icon: Send };
  if (mid.includes("discord")) return { name: "Discord", color: "text-indigo-500", bg: "bg-indigo-500/10", icon: MessageSquare };
  if (mid.includes("feishu") || mid.includes("lark")) return { name: "Feishu", color: "text-blue-400", bg: "bg-blue-400/10", icon: MessageSquare };
  if (mid.includes("slack")) return { name: "Slack", color: "text-purple-500", bg: "bg-purple-500/10", icon: MessageSquare };
  if (mid.includes("wechat")) return { name: "WeChat", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Radio };
  if (mid.includes("nostr")) return { name: "Nostr", color: "text-orange-500", bg: "bg-orange-500/10", icon: Globe };
  return { name: id, color: "text-primary", bg: "bg-primary/10", icon: Radio };
};

export default function ChannelsPage() {
  const { connected, client } = useGateway();
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  const [fullConfig, setFullConfig] = useState<any>(null);
  const [configHash, setConfigHash] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadChannels = async (probe = false) => {
    if (!connected || !client) return;
    setLoading(true);
    try {
      const res = await client.request("channels.status", { probe, timeoutMs: 8000 });
      setSnapshot(res);
    } catch (e: any) {
      toast({ title: "加载失败", description: e.message || "无法获取频道列表", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogin = (channelId: string) => {
    setActiveChannelId(channelId);
    setLoginModalOpen(true);
  };

  const handleOpenConfig = async (channelId: string) => {
    if (!client || !connected) return;
    setActiveChannelId(channelId);
    setLoading(true);
    try {
        const res: any = await client.request("config.get", {});
        setFullConfig(res.config);
        setConfigHash(res.hash);
        setConfigModalOpen(true);
    } catch (e: any) {
        toast({ title: "加载配置失败", description: e.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleSaveConfig = async (updatedChannelConfig: any) => {
    if (!client || !fullConfig || !activeChannelId) return;
    setSavingConfig(true);
    try {
        const nextConfig = { ...fullConfig };
        if (!nextConfig.channels) nextConfig.channels = {};
        nextConfig.channels[activeChannelId] = updatedChannelConfig;

        await client.request("config.set", {
            raw: JSON.stringify(nextConfig, null, 2),
            baseHash: configHash
        });
        
        toast({ title: "配置已保存", description: `频道 ${activeChannelId} 的设置已更新。` });
        loadChannels();
        setConfigModalOpen(false);
    } catch (e: any) {
        toast({ title: "保存失败", description: e.message, variant: "destructive" });
    } finally {
        setSavingConfig(false);
    }
  };

  const handleLogout = async (channelId: string) => {
    if (!client || !connected) return;
    try {
      await client.request("channels.logout", { channel: channelId });
      toast({ title: "已注销", description: `频道 ${channelId} 已安全退出` });
      loadChannels();
    } catch (e: any) {
      toast({ title: "注销失败", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    loadChannels();
  }, [connected, client]);

  // 平铺展示所有账号
  const flattenedAccounts = useMemo(() => {
    if (!snapshot?.channelAccounts) return [];
    const accounts: any[] = [];
    const order = snapshot.channelOrder || Object.keys(snapshot.channelAccounts);
    
    order.forEach((channelId: string) => {
        const channelData = snapshot.channelAccounts[channelId] || [];
        const legacyStatus = snapshot.channels?.[channelId] || {};

        if (channelData.length === 0) {
            // 如果没有账号数据，回退到 legacy channels 数据展示一个虚拟账号
            accounts.push({
                accountId: "default",
                running: legacyStatus.running,
                connected: legacyStatus.connected,
                lastError: legacyStatus.lastError,
                channelId,
                brand: getChannelBrand(channelId)
            });
            return;
        }

        channelData.forEach((acc: any) => {
            accounts.push({
                ...acc,
                // 状态回退逻辑
                running: acc.running ?? legacyStatus.running,
                connected: acc.connected ?? legacyStatus.connected,
                channelId,
                brand: getChannelBrand(channelId)
            });
        });
    });
    return accounts;
  }, [snapshot]);

  return (
    <main className="p-8 min-h-full bg-muted/5 @container">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">频道管理</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <Zap className="size-3.5 text-orange-500" />
                    配置并监控与外部平台的通信连接状态及账号健康度。
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => loadChannels(true)} disabled={loading} className="rounded-full gap-2 px-6 h-10 border-border/50 bg-background/80 backdrop-blur shadow-sm hover:bg-primary/5 hover:text-primary transition-all active:scale-95">
                    <Radio className={cn("size-4", loading && "animate-pulse")} />
                    探测连接
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadChannels(false)} disabled={loading} className="rounded-full gap-2 px-6 h-10 border-border/50 bg-background shadow-sm hover:border-primary/20 transition-all active:scale-95">
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                    刷新列表
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flattenedAccounts.length > 0 ? (
            flattenedAccounts.map((account: any, i: number) => (
              <ChannelAccountCard 
                key={`${account.channelId}-${account.accountId}-${i}`} 
                data={account} 
                onLogin={() => handleOpenLogin(account.channelId)}
                onLogout={() => handleLogout(account.channelId)} 
                onConfig={() => handleOpenConfig(account.channelId)}
                onRefresh={() => loadChannels(false)}
              />
            ))
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-border/30 rounded-[2.5rem] bg-background/40 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
              <div className="size-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-border/50">
                <Radio className="size-10 opacity-20" />
              </div>
              <p className="text-muted-foreground font-medium text-lg">{loading ? "正在同步活跃频道..." : "暂未探测到活跃频道"}</p>
              {!loading && (
                <Button variant="link" className="text-primary mt-2" onClick={() => loadChannels(true)}>点此触发全网探测</Button>
              )}
            </div>
          )}
        </div>
      </div>

      <WhatsAppLoginModal 
        open={loginModalOpen} 
        onOpenChange={setLoginModalOpen} 
      />

      {/* 频道配置 Modal */}
      <ChannelConfigModal 
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        channelId={activeChannelId || ""}
        config={fullConfig?.channels?.[activeChannelId || ""] || {}}
        onSave={handleSaveConfig}
        loading={savingConfig}
      />
    </main>
  );
}

function ChannelConfigModal({ open, onOpenChange, channelId, config, onSave, loading }: any) {
    const [localConfig, setLocalConfig] = useState<any>(config);
    const [mode, setMode] = useState<"form" | "json">("form");

    useEffect(() => {
        if (open) setLocalConfig(config);
    }, [open, config]);

    const updateField = (field: string, value: any) => {
        setLocalConfig({ ...localConfig, [field]: value });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-border/40 shadow-2xl overflow-hidden p-0">
                <div className="bg-gradient-to-br from-primary/10 via-background/50 to-background p-8 border-b border-border/40">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Settings2 className="size-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <DialogTitle className="text-2xl font-bold">频道高级配置</DialogTitle>
                                    <DialogDescription className="text-sm font-medium opacity-60">正在修改 {channelId} 协议的基础运行参数</DialogDescription>
                                </div>
                            </div>
                            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
                                <Button variant={mode === "form" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("form")} className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3">可视化</Button>
                                <Button variant={mode === "json" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("json")} className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider px-3">源码</Button>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {mode === "form" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/30">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">同步开关 (Enabled)</p>
                                    <p className="text-[10px] text-muted-foreground">控制该通信协议是否随网关自动初始化</p>
                                </div>
                                <Switch checked={!!localConfig.enabled} onCheckedChange={(v) => updateField("enabled", v)} />
                            </div>

                            {Object.entries(localConfig).map(([key, val]) => {
                                if (key === "enabled") return null;
                                if (typeof val === "object" && val !== null) return null; // 简单表单暂不处理对象

                                return (
                                    <div key={key} className="space-y-2 p-4 rounded-2xl border border-border/30 bg-background/50 focus-within:ring-2 ring-primary/10 transition-all">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">{key}</label>
                                        <Input 
                                            value={String(val ?? "")} 
                                            onChange={(e) => updateField(key, e.target.value)}
                                            className="h-9 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                                        />
                                    </div>
                                );
                            })}
                            
                            <div className="col-span-full mt-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3">
                                <AlertTriangle className="size-4 text-orange-500 shrink-0" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    配置修改后需点击下方“保存应用”并触发网关重载方能生效。错误配置可能导致该频道掉线。
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea 
                                value={JSON.stringify(localConfig, null, 2)}
                                onChange={(e) => {
                                    try {
                                        setLocalConfig(JSON.parse(e.target.value));
                                    } catch(err) {}
                                }}
                                className="w-full h-64 p-4 rounded-3xl bg-muted/30 font-mono text-xs focus:ring-1 ring-primary/20 outline-none border border-border/40"
                                spellCheck={false}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-muted/5 p-6 border-t border-border/40">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full px-6">取消</Button>
                    <Button 
                        disabled={loading} 
                        onClick={() => onSave(localConfig)}
                        className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                        {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                        保存应用
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ChannelAccountCard({ data, onLogin, onLogout, onConfig, onRefresh }: { data: any, onLogin: () => void, onLogout: () => void, onConfig: () => void, onRefresh: () => void }) {
  const isHealthy = data.connected === true && data.running;
  const isWarning = data.running && (data.connected === false || data.connected === undefined);
  const isOffline = !data.running;
  const isWhatsApp = data.channelId?.toLowerCase().includes("whatsapp");
  const recentActivity = data.lastInboundAt && (Date.now() - data.lastInboundAt < 10 * 60 * 1000);
  
  const statusLabel = isHealthy ? "Online" : recentActivity ? "Active" : data.running ? "Syncing" : "Offline";
  
  const BrandIcon = data.brand.icon;

  return (
    <Card className="group border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 bg-background overflow-hidden relative rounded-[2rem]">
      {/* 状态指示条 */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1",
        isHealthy ? "bg-green-500" : isWarning ? "bg-orange-500" : "bg-red-500"
      )} />
      
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                    "size-14 rounded-2xl flex items-center justify-center border border-border/50 shrink-0 transition-transform group-hover:scale-110 duration-300",
                    data.brand.bg
                )}>
                    <BrandIcon className={cn("size-7", data.brand.color)} />
                </div>
                <div className="min-w-0">
                    <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors capitalize">
                        {(!data.name || data.name.toLowerCase() === "default") ? data.brand.name : data.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn(
                            "text-[9px] h-4 rounded-full border-none px-2 uppercase tracking-tight font-black",
                            isHealthy ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : 
                            (recentActivity || data.running) ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : 
                            "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        )}>
                            {statusLabel}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">
                            {data.brand.name.toLowerCase() !== data.channelId.toLowerCase() && `${data.channelId} · `}
                            {data.accountId}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                {isWhatsApp && !isHealthy && (
                    <Button variant="ghost" size="icon" onClick={onLogin} className="size-8 rounded-full border border-green-500/20 text-green-600 hover:bg-green-500/10 shadow-sm">
                        <Key className="size-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:bg-muted"><MoreVertical className="size-4" /></Button>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 pt-2 space-y-6">
        <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block mb-1">运行状态</span>
                <p className={cn("text-xs font-bold", data.running ? "text-foreground" : "text-muted-foreground")}>
                    {data.running ? "正在后台运行" : "已停止运行"}
                </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/20 border border-border/30 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block mb-1">网关连接</span>
                <p className={cn(
                    "text-xs font-bold", 
                    data.connected === true ? "text-green-500" : 
                    data.running ? "text-blue-500" : "text-destructive"
                )}>
                    {data.connected === true ? "连接正常" : 
                     data.running ? "连接就绪" : "尚未连接"}
                </p>
            </div>
        </div>

        {data.lastError && (
            <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-start gap-2">
                <ShieldAlert className="size-3.5 text-destructive shrink-0 mt-0.5" />
                <div className="min-w-0">
                    <span className="text-[10px] font-bold text-destructive uppercase tracking-wider block mb-0.5">最近报错信息</span>
                    <p className="text-[10px] text-destructive/80 font-medium leading-relaxed truncate" title={data.lastError}>{data.lastError}</p>
                </div>
            </div>
        )}

        <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>最近活动记录</span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="size-3" /> 最后上报时间</span>
                    <span className="font-mono text-foreground/80">{data.lastInboundAt ? new Date(data.lastInboundAt).toLocaleTimeString() : "-"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Send className="size-3" /> 最后发出消息</span>
                    <span className="font-mono text-foreground/80">{data.lastOutboundAt ? new Date(data.lastOutboundAt).toLocaleTimeString() : "-"}</span>
                </div>
            </div>
        </div>

        <div className="pt-2 flex gap-2">
            {isWhatsApp && isHealthy && (
                <Button variant="outline" size="sm" onClick={onLogout} className="flex-1 rounded-full text-[11px] font-bold h-9 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40 transition-all gap-1.5">
                    <LogOut size={14} /> 安全退出
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={onConfig} className="flex-1 rounded-full text-[11px] font-bold h-9 border-border/50 hover:bg-muted transition-all flex items-center gap-1.5">
                <Settings2 size={14} /> 频道配置
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

