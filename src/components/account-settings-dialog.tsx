"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Shield, Activity, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_VERSION } from "@/config/version";

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const handleApply = () => {
    toast({
      title: "设置已保存",
      description: "您的连接和安全设置已更新。即将尝试重新连接网关。",
    });
    // In a real implementation this would write to gatewayContext / config store
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl border border-border/50 shadow-2xl">
        <DialogTitle className="sr-only">账户设置</DialogTitle>
        <div className="flex h-[550px]">
          {/* Side Tabs navigation */}
          <Tabs defaultValue="connection" className="flex w-full h-full" orientation="vertical">
            <div className="w-[200px] border-r border-border/50 bg-muted/20 p-6 flex flex-col gap-6">
              <div className="select-none">
                <h3 className="font-bold text-lg tracking-tight text-foreground">偏好设置</h3>
                <p className="text-xs text-muted-foreground mt-1">全局选项与控制面板</p>
              </div>
              <TabsList className="flex flex-col h-auto bg-transparent space-y-2 p-0 rounded-none w-full border-0">
                <TabsTrigger
                  value="connection"
                  className="w-full justify-start gap-3 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted font-medium transition-colors"
                >
                  <Globe className="size-4" /> 网关连接
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="w-full justify-start gap-3 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted font-medium transition-colors"
                >
                  <Shield className="size-4" /> 安全中心
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="w-full justify-start gap-3 rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted font-medium transition-colors"
                >
                  <Activity className="size-4" /> 高级功能
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-background relative custom-scrollbar">
              <TabsContent value="connection" className="m-0 focus-visible:outline-none h-full flex flex-col">
                <div className="flex-1 space-y-8">
                  <div>
                    <h4 className="text-xl font-bold tracking-tight mb-2">连接配置</h4>
                    <p className="text-sm text-muted-foreground">修改当前连接的网关底层通信参数。修改并应用后会重新连接网关实例。</p>
                  </div>
                  <div className="space-y-6 max-w-sm">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gateway 地址</Label>
                      <Input defaultValue="wss://openclaw.aitell.vip" className="font-mono text-sm bg-muted/50" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">通讯鉴权口令 (Token)</Label>
                      <Input defaultValue="a84961089..." type="password" placeholder="输入访问密钥" className="bg-muted/50" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">连接协议 (Protocol)</Label>
                      <Input defaultValue={`v${APP_VERSION}`} className="font-mono text-sm bg-muted/50" disabled />
                      <p className="text-[10px] text-muted-foreground leading-snug">此参数为当前客户端硬编码强制绑定的版本。后续可通过此覆盖旧版本代理节点协议。</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="m-0 focus-visible:outline-none h-full flex flex-col">
                <div className="flex-1 space-y-8">
                  <div>
                    <h4 className="text-xl font-bold tracking-tight mb-2">安全中心</h4>
                    <p className="text-sm text-muted-foreground">管理您的存储凭据、登录行为和设备安全配置。</p>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 space-y-4">
                      <div className="font-medium">会话缓存持有期</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">如果关闭此项，退出浏览器或刷新后将强制清除所有本地令牌和聊天上下文记录，增强隐私性。</p>
                      <div className="flex items-center gap-3 pt-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10">清除当前所有缓存</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="m-0 focus-visible:outline-none h-full flex flex-col">
                <div className="flex-1 space-y-8">
                  <div>
                    <h4 className="text-xl font-bold tracking-tight mb-2">高级功能</h4>
                    <p className="text-sm text-muted-foreground">修改一些底层特性。修改此模块需具备网关的特权操作权限。</p>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <div className="p-5 bg-orange-500/5 rounded-2xl border border-orange-500/20 space-y-4">
                      <div className="font-medium text-orange-600 dark:text-orange-400">开发者模式 (Debug Layer)</div>
                      <p className="text-sm text-orange-600/70 dark:text-orange-400/70 leading-relaxed">允许在控制台打印原始心跳包、WebSocket 握手握签以及错误堆栈日志。</p>
                      <Button variant="outline" size="sm" className="rounded-xl border-orange-500/30 text-orange-600 hover:bg-orange-500/10">启用 Debug Mode</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Bottom Sticky Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border/50 flex justify-end gap-3 z-10">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6">取消</Button>
                <Button onClick={handleApply} className="rounded-xl px-8 shadow-lg shadow-primary/20 gap-2">
                  <Save className="size-4" /> 应用修改
                </Button>
              </div>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
