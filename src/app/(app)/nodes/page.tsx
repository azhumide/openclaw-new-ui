"use client";
import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Server, Shield, Smartphone, RefreshCw, Activity, 
  CheckCircle2, XCircle, Clock, Globe, Cpu, 
  Plus, RotateCw, Trash2, ShieldAlert, Key, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NodesPage() {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [devices, setDevices] = useState<any>({ pending: [], paired: [] });
  const [activeTab, setActiveTab] = useState("monitor");

  const fetchData = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const [nodesRes, devicesRes] = await Promise.all([
        client.request("node.list", {}),
        client.request("device.pair.list", {})
      ]);
      setNodes((nodesRes as any)?.nodes || []);
      setDevices({
        pending: Array.isArray((devicesRes as any)?.pending) ? (devicesRes as any).pending : [],
        paired: Array.isArray((devicesRes as any)?.paired) ? (devicesRes as any).paired : []
      });
    } catch (err: any) {
      toast({ title: "加载数据失败", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client, connected]);

  const handleApprove = async (requestId: string) => {
    if (!client) return;
    try {
      await client.request("device.pair.approve", { requestId });
      toast({ title: "配对成功", description: "该设备已成功接入。 " });
      fetchData();
    } catch (err: any) {
      toast({ title: "审批失败", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (requestId: string) => {
    if (!client) return;
    if (!window.confirm("确定拒绝并删除此配对请求吗？")) return;
    try {
      await client.request("device.pair.reject", { requestId });
      toast({ title: "已拒绝请求" });
      fetchData();
    } catch (err: any) {
      toast({ title: "操作失败", description: err.message, variant: "destructive" });
    }
  };

  const handleRevoke = async (deviceId: string, role: string) => {
    if (!client) return;
    if (!window.confirm(`确定要撤销设备 ${deviceId} 的 ${role} 权限吗？`)) return;
    try {
      await client.request("device.token.revoke", { deviceId, role });
      toast({ title: "权限已撤销" });
      fetchData();
    } catch (err: any) {
      toast({ title: "撤销失败", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">集群节点 (Nodes)</h1>
          <p className="text-muted-foreground mt-1">
            实时监控目前连接到主控制网关的所有代理工作节点及受控设备。
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2 rounded-xl">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          刷新状态
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 p-1 border border-border/50 rounded-2xl">
          <TabsTrigger value="monitor" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="size-4 mr-2" />
            监控面板
          </TabsTrigger>
          <TabsTrigger value="pairing" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="size-4 mr-2" />
            设备配对 {devices.pending.length > 0 && <Badge variant="destructive" className="ml-2 px-1.5 h-4 min-w-4 flex items-center justify-center">{devices.pending.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.length === 0 && !loading && (
              <Card className="col-span-full p-12 text-center border-dashed bg-muted/20 opacity-60">
                <Server className="size-12 mx-auto mb-4 stroke-1" />
                <p>暂无在线节点</p>
              </Card>
            )}
            {nodes.map(node => (
              <Card key={node.nodeId} className="group relative overflow-hidden bg-background/50 border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate mb-1">
                        {node.displayName || node.nodeId}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground opacity-60">
                        <Globe className="size-3" />
                        {node.nodeId}
                      </div>
                    </div>
                    <Badge variant={node.connected ? "success" : "destructive"} className="animate-in fade-in zoom-in">
                      {node.connected ? "在线" : "离线"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">内网地址</p>
                      <p className="font-mono font-medium">{node.remoteIp || "未知"}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">版本</p>
                      <p className="font-mono font-medium">{node.version || "n/a"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">支持能力 (Caps)</p>
                    <div className="flex flex-wrap gap-1">
                      {node.caps?.map((cap: string) => (
                        <Badge key={cap} variant="secondary" className="text-[9px] py-0 px-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pairing" className="mt-8 space-y-8">
          {/* Pending Requests */}
          {devices.pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-500" />
                等待审批的配对 ({devices.pending.length})
              </h2>
              <div className="space-y-2">
                {devices.pending.map((req: any) => (
                  <Card key={req.requestId} className="p-4 bg-amber-500/5 border-amber-500/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                          <Smartphone className="size-5" />
                        </div>
                        <div>
                          <p className="font-bold">{req.displayName || req.deviceId}</p>
                          <p className="text-xs text-muted-foreground font-mono">{req.deviceId} · {req.remoteIp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl" onClick={() => handleApprove(req.requestId)}>
                          批准接入
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleReject(req.requestId)}>
                          拒绝
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Paired Devices */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">
              已授权设备 ({devices.paired.length})
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {devices.paired.length === 0 && (
                <div className="p-12 text-center rounded-2xl bg-muted/10 opacity-60 border border-dashed">
                  <ShieldCheck className="size-12 mx-auto mb-4 stroke-1" />
                  <p>无已授权设备</p>
                </div>
              )}
              {devices.paired.map((device: any) => (
                <Card key={device.deviceId} className="p-5 border-border/50 bg-background/30">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                          <Smartphone className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">{device.displayName || "未知名称"}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{device.deviceId} {device.remoteIp && `· ${device.remoteIp}`}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {device.roles?.map((role: string) => <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>)}
                        {device.scopes?.map((scope: string) => <Badge key={scope} variant="secondary" className="text-[10px] bg-muted/50">{scope}</Badge>)}
                      </div>
                    </div>
                    
                    <div className="lg:w-[400px] border-t lg:border-t-0 lg:border-l border-border/50 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1.5">
                        <Key className="size-3" />
                        权限令牌 (Tokens)
                      </p>
                      <div className="space-y-2">
                        {device.tokens?.map((token: any) => (
                          <div key={token.role} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs border border-border/30">
                            <span className="font-semibold">{token.role}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={token.revokedAtMs ? "destructive" : "success"} className="scale-75 origin-right">
                                {token.revokedAtMs ? "已撤销" : "活跃"}
                              </Badge>
                              {!token.revokedAtMs && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-full"
                                  onClick={() => handleRevoke(device.deviceId, token.role)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
