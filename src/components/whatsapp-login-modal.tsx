"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGateway } from "@/context/gateway-context";
import { QrCode, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppLoginModal({ open, onOpenChange }: WhatsAppLoginModalProps) {
  const { connected, client } = useGateway();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "waiting" | "logged-in" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const startLogin = async () => {
    if (!client || !connected) return;
    setStatus("loading");
    setMessage("正在初始化 WhatsApp 登录...");
    try {
      const res = await client.request("web.login.start", { force: true, timeoutMs: 30000 });
      if (res.qrDataUrl) {
        setQrCode(res.qrDataUrl);
        setStatus("waiting");
        setMessage("请使用 WhatsApp 扫描二维码。");
        // 开始轮询状态
        waitLogin();
      } else {
        setMessage(res.message || "初始化失败");
        setStatus("error");
      }
    } catch (e: any) {
      console.error(e);
      setMessage(e.message || "请求出错了");
      setStatus("error");
    }
  };

  const waitLogin = async () => {
    if (!client || !connected) return;
    try {
      const res = await client.request("web.login.wait", { timeoutMs: 120000 });
      if (res.connected) {
        setStatus("logged-in");
        setMessage("登录成功！");
        setQrCode(null);
        setTimeout(() => onOpenChange(false), 2000);
      } else {
        setMessage(res.message || "登录未完成");
      }
    } catch (e: any) {
        if (open) {
            console.error(e);
            setMessage("等待超时，请重试");
            setStatus("error");
        }
    }
  };

  useEffect(() => {
    if (open) {
      startLogin();
    } else {
      setQrCode(null);
      setStatus("idle");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl overflow-hidden border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            WhatsApp 登录
          </DialogTitle>
          <DialogDescription>
            扫描屏幕上的二维码启动您的 WhatsApp 通道。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
          <div className="size-64 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-center relative overflow-hidden group">
            {qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className="size-full p-2" />
            ) : status === "loading" ? (
                <Loader2 className="size-12 text-primary animate-spin opacity-20" />
            ) : status === "logged-in" ? (
                <CheckCircle2 className="size-24 text-green-500 animate-in zoom-in duration-500" />
            ) : (
                <XCircle className="size-12 text-destructive opacity-20" />
            )}
            
            {status === "waiting" && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="outline" size="sm" onClick={startLogin} className="rounded-xl">刷新二维码</Button>
                </div>
            )}
          </div>
          
          <div className="text-center">
            <p className={cn(
              "text-sm font-medium",
              status === "error" ? "text-destructive" : "text-muted-foreground"
            )}>
              {message}
            </p>
          </div>
        </div>

        <DialogFooter className="bg-muted/5 p-4 border-t border-border/50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">取消</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
