"use client";
import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bug, Play, RefreshCw, Activity, 
  Heart, Zap, BrainCircuit, ListTree, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const COMMON_METHODS = [
  "status", "health", "last-heartbeat", "models.list", 
  "node.list", "device.pair.list", "config.get", 
  "cron.list", "skills.status", "gateway.auth.sessions"
];

function JsonView({ json }: { json: any }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(json, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-border/50 bg-[#1e1e1e] shadow-inner shadow-black/20 max-h-[400px] flex flex-col">
      <div className="absolute top-2 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-7 w-7 bg-white/10 hover:bg-white/20 text-white backdrop-blur border-white/10"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <div className="text-[11px] sm:text-xs font-mono leading-relaxed overflow-y-auto custom-scrollbar-dark flex-1">
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{ 
            margin: 0, 
            padding: '1rem', 
            background: 'transparent',
            fontSize: 'inherit',
            lineHeight: 'inherit'
          }}
        >
          {text}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default function DebugPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<any>({ status: null, health: null, heartbeat: null });
  const [models, setModels] = useState<any[]>([]);
  const [rpcMethod, setRpcMethod] = useState("");
  const [rpcParams, setRpcParams] = useState("{}");
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  const fetchData = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const [status, health, modelsRes, heartbeat] = await Promise.all([
        client.request("status", {}),
        client.request("health", {}),
        client.request("models.list", {}),
        client.request("last-heartbeat", {})
      ]);
      setSnapshots({ status, health, heartbeat });
      setModels((modelsRes as any)?.models || []);
    } catch (err: any) {
      toast({ title: "采集快照失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, connected]);

  const handleCall = async () => {
    if (!client || !rpcMethod) return;
    setCalling(true);
    setRpcResult(null);
    setRpcError(null);
    try {
      const params = rpcParams.trim() ? JSON.parse(rpcParams) : {};
      const res = await client.request(rpcMethod, params);
      setRpcResult(res);
      toast({ title: "调用成功", description: `已执行 ${rpcMethod}` });
    } catch (err: any) {
      setRpcError(err.message);
      toast({ title: "执行失败", description: err.message, variant: "destructive" });
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-red-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Bug className="size-4 sm:size-6 text-red-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">状态调试</h1>
            <p className="hidden sm:block text-muted-foreground mt-1">
              执行指令，清理缓存，发起 RPC 测试。
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-8 sm:h-9 text-[10px] sm:text-xs rounded-lg sm:rounded-xl px-4 border-border/50 w-full sm:w-auto">
          <RefreshCw className={cn("size-3.5 sm:size-4 mr-1.5 sm:mr-2", loading && "animate-spin")} />
          全局快照采集
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Right Column: Actions (Top on Mobile) */}
        <div className="order-first lg:order-last space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-8 border-primary/20 bg-primary/5 shadow-xl shadow-primary/5 rounded-xl sm:rounded-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2.5 bg-primary/10 rounded-lg sm:rounded-xl text-primary font-mono text-[10px] sm:text-sm">RPC</div>
                <h3 className="font-bold text-sm sm:text-lg">手动 RPC 调用器</h3>
              </div>
              <Badge variant="outline" className="scale-75 sm:scale-100 opacity-60">ADMIN</Badge>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-xs font-bold text-muted-foreground tracking-widest uppercase">Method / 指令名</label>
                <div className="flex gap-2">
                  <Input 
                    value={rpcMethod} 
                    onChange={(e) => setRpcMethod(e.target.value)}
                    placeholder="例如: status" 
                    className="h-8 sm:h-10 text-xs font-mono bg-background border-border/50 rounded-lg sm:rounded-xl"
                  />
                  <div className="relative">
                    <select 
                      onChange={(e) => setRpcMethod(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    >
                      <option value="">常用指令...</option>
                      {COMMON_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <Button variant="secondary" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl"><ListTree className="size-3.5 sm:size-4" /></Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-xs font-bold text-muted-foreground tracking-widest uppercase">Params (JSON) / 参数对</label>
                <textarea 
                  value={rpcParams}
                  onChange={(e) => setRpcParams(e.target.value)}
                  className="w-full h-24 sm:h-32 p-3 sm:p-4 font-mono text-[10px] sm:text-xs rounded-lg sm:rounded-xl bg-background border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none transition-all"
                  placeholder="{}"
                />
              </div>

              <Button 
                onClick={handleCall} 
                disabled={calling || !rpcMethod} 
                className="w-full rounded-xl sm:rounded-2xl h-10 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-base shadow-lg shadow-primary/20"
              >
                {calling ? <RefreshCw className="size-4 sm:size-5 animate-spin" /> : <Play className="size-4 sm:size-5 mr-1.5 sm:mr-3" />}
                执行远程过程调用
              </Button>

              {(rpcResult || rpcError) && (
                <div className="space-y-2 pt-2 sm:pt-4">
                  <label className="text-[9px] sm:text-xs font-bold text-muted-foreground tracking-widest uppercase">Execution Result / 执行结果</label>
                  {rpcError ? (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] sm:text-xs font-mono">
                      {rpcError}
                    </div>
                  ) : (
                    <JsonView json={rpcResult} />
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border-border/50 overflow-hidden rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg sm:rounded-xl">
                <BrainCircuit className="size-4 sm:size-5 text-purple-500" />
              </div>
              <h3 className="font-bold text-sm sm:text-lg">模型目录 (Models)</h3>
            </div>
            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {models.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-[10px] sm:text-sm text-muted-foreground opacity-50 border border-dashed rounded-xl sm:rounded-2xl">
                  暂无在线模型。
                </div>
              ) : (
                <JsonView json={{ count: models.length, list: models }} />
              )}
            </div>
          </Card>
        </div>

        {/* Left Column: Snapshots (Bottom on Mobile) */}
        <div className="order-last lg:order-first space-y-4 sm:space-y-6">
          <Card className="p-3 sm:p-6 border-border/50 bg-muted/5 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[10px] sm:text-sm font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">
              <Activity className="size-3.5 sm:size-4" /> 系统快照 (Status)
            </div>
            <JsonView json={snapshots.status || { loading: true }} />
          </Card>

          <Card className="p-3 sm:p-6 border-border/50 bg-muted/5 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[10px] sm:text-sm font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">
              <Zap className="size-3.5 sm:size-4" /> 健康自检 (Health)
            </div>
            <JsonView json={snapshots.health || { loading: true }} />
          </Card>

          <Card className="p-3 sm:p-6 border-border/50 bg-muted/5 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 text-[10px] sm:text-sm font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">
              <Heart className="size-3.5 sm:size-4" /> 心跳追踪 (Heartbeat)
            </div>
            <JsonView json={snapshots.heartbeat || { loading: true }} />
          </Card>
        </div>
      </div>
    </div>
  );
}
