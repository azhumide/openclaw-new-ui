"use client";
import { useEffect, useState, useRef } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bug, Play, RefreshCw, Terminal, Activity, 
  Database, ShieldAlert, Cpu, Heart, Code2,
  Lock, Search, Trash2, Zap, BrainCircuit, ListTree
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const COMMON_METHODS = [
  "status", "health", "last-heartbeat", "models.list", 
  "node.list", "device.pair.list", "config.get", 
  "cron.list", "skills.status", "gateway.auth.sessions"
];

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

  const renderJson = (json: any) => (
    <div className="rounded-xl overflow-hidden border border-border/50 text-[11px]">
      <SyntaxHighlighter
        language="json"
        style={atomDark}
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
      >
        {JSON.stringify(json, null, 2)}
      </SyntaxHighlighter>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <Bug className="size-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">状态调试 (Debug)</h1>
            <p className="text-muted-foreground mt-1">
              执行底层调试指令，清理缓存、发起 JSON/RPC 诊断包测试。
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl px-4 border-border/50">
          <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
          全局快照采集
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Snapshots */}
        <div className="space-y-6">
          <Card className="p-6 border-border/50 bg-muted/5">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <Activity className="size-4" /> 系统快照 (Status)
            </div>
            {renderJson(snapshots.status || { loading: true })}
          </Card>

          <Card className="p-6 border-border/50 bg-muted/5">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <Zap className="size-4" /> 健康自检 (Health)
            </div>
            {renderJson(snapshots.health || { loading: true })}
          </Card>

          <Card className="p-6 border-border/50 bg-muted/5">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <Heart className="size-4" /> 心跳追踪 (Heartbeat)
            </div>
            {renderJson(snapshots.heartbeat || { loading: true })}
          </Card>
        </div>

        {/* Right Column: RPC & Models */}
        <div className="space-y-6">
          <Card className="p-8 border-primary/20 bg-primary/5 shadow-xl shadow-primary/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-mono text-sm">JSON</div>
                <h3 className="font-bold text-lg">手动 RPC 调用器</h3>
              </div>
              <Badge variant="outline" className="opacity-60">ADMIN ONLY</Badge>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Method / 指令名</label>
                <div className="flex gap-2">
                  <Input 
                    value={rpcMethod} 
                    onChange={(e) => setRpcMethod(e.target.value)}
                    placeholder="例如: status" 
                    className="font-mono bg-background border-border/50 rounded-xl"
                  />
                  <div className="relative">
                    <select 
                      onChange={(e) => setRpcMethod(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    >
                      <option value="">常用指令...</option>
                      {COMMON_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <Button variant="secondary" size="icon" className="rounded-xl"><ListTree className="size-4" /></Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Params (JSON) / 参数对</label>
                <textarea 
                  value={rpcParams}
                  onChange={(e) => setRpcParams(e.target.value)}
                  className="w-full h-32 p-4 font-mono text-xs rounded-xl bg-background border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none transition-all"
                  placeholder="{}"
                />
              </div>

              <Button 
                onClick={handleCall} 
                disabled={calling || !rpcMethod} 
                className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20"
              >
                {calling ? <RefreshCw className="size-5 animate-spin p-0.5" /> : <Play className="size-5 mr-3" />}
                执行远程过程调用
              </Button>

              {(rpcResult || rpcError) && (
                <div className="space-y-2 pt-4">
                  <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Execution Result / 执行结果</label>
                  {rpcError ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono">
                      {rpcError}
                    </div>
                  ) : (
                    renderJson(rpcResult)
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-border/50 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <BrainCircuit className="size-5 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg">模型目录 (Models)</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {models.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground opacity-50 border border-dashed rounded-2xl">
                  暂无模型，请检查代理节点连接情况。
                </div>
              ) : (
                renderJson({ count: models.length, list: models })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
