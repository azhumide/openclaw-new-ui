"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { RefreshCcw, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCharacters } from "@/components/ui/animated-characters";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

const gatewaySchema = z.object({
  websocketUrl: z.string().url({ message: "请输入有效的 WebSocket URL。" }),
  gatewayToken: z.string().min(1, { message: "请输入网关令牌。" }),
  password: z.string().optional().or(z.literal("")),
  sessionSecret: z.string().min(1, { message: "请输入默认会话密钥。" }),
});


type GatewayFormValues = {
  websocketUrl: string;
  gatewayToken: string;
  password?: string;
  sessionSecret: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");



  const gatewayForm = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      websocketUrl: "",
      gatewayToken: "",
      password: "",
      sessionSecret: "agent:main:main",
    },
  });

  // Load saved settings on mount
  useEffect(() => {
    const rawSettings = localStorage.getItem("openclaw.control.settings.v1");
    if (rawSettings) {
      try {
        const settings = JSON.parse(rawSettings);
        gatewayForm.reset({
          websocketUrl: settings.gatewayUrl || "",
          gatewayToken: sessionStorage.getItem("openclaw.control.token.v1") || "",
          password: "",
          sessionSecret: settings.sessionKey || "agent:main:main",
        });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []); // Only run on mount to prevent resetting user edits during re-renders

  const gatewayPassword = gatewayForm.watch("password");
  const websocketUrl = gatewayForm.watch("websocketUrl");

  // Auto-extract token from URL if present
  useEffect(() => {
    if (websocketUrl && websocketUrl.includes("token=")) {
      try {
        const urlObj = new URL(websocketUrl.replace("ws://", "http://").replace("wss://", "https://"));
        const token = urlObj.searchParams.get("token");
        if (token) {
          gatewayForm.setValue("gatewayToken", token);
          urlObj.searchParams.delete("token");
          // Re-construct the protocol original protocol
          const protocol = websocketUrl.startsWith("wss://") ? "wss://" : "ws://";
          const newUrl = protocol + urlObj.host + urlObj.pathname + urlObj.search;
          gatewayForm.setValue("websocketUrl", newUrl);
        }
      } catch (e) {
        // Fallback for non-standard URLs
        const match = websocketUrl.match(/[?&]token=([^&]+)/);
        if (match && match[1]) {
          gatewayForm.setValue("gatewayToken", match[1]);
          const newUrl = websocketUrl.replace(/[?&]token=[^&]+/, "").replace(/\?$/, "");
          gatewayForm.setValue("websocketUrl", newUrl);
        }
      }
    }
  }, [websocketUrl, gatewayForm]);

  const persistSettings = (data: any) => {
    const KEY = "openclaw.control.settings.v1";
    const settings = {
      gatewayUrl: data.websocketUrl || "",
      sessionKey: data.sessionSecret || "main",
      lastActiveSessionKey: "main",
      theme: "system",
      chatFocusMode: false,
      chatShowThinking: true,
      splitRatio: 0.6,
      navCollapsed: false,
      navGroupsCollapsed: {},
      locale: "zh-CN",
    };
    localStorage.setItem(KEY, JSON.stringify(settings));
    
    if (data.gatewayToken) {
      sessionStorage.setItem("openclaw.control.token.v1", data.gatewayToken);
    }
  };



  const onGatewaySubmit = async (values: GatewayFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      console.log("Gateway Login:", values);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      persistSettings(values);
      router.push("/dashboard");
      toast({ 
        title: "网关连接成功", 
        description: "已成功建立 WebSocket 链接。",
        duration: 2000 
      });
    } catch (err: any) {
      setError(err.message || "网关连接失败。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden grid lg:grid-cols-2">
      {/* Left Content Section with Animated Characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 dark:from-white/90 dark:via-white/80 dark:to-white/70 p-12 text-white dark:text-gray-900 border-r border-border/50">
        <div className="relative z-20">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-bold"
          >
            <div className="size-9 p-0.5 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="lobster-gradient-login" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4d4d"/>
                    <stop offset="100%" stopColor="#991b1b"/>
                  </linearGradient>
                </defs>
                <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient-login)"/>
                <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient-login)"/>
                <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient-login)"/>
                <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="45" cy="35" r="6" fill="#050810"/>
                <circle cx="75" cy="35" r="6" fill="#050810"/>
                <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
                <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
              </svg>
            </div>
            <span>OpenClaw New UI</span>
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={
              focusedField === "token" ? showToken :
              focusedField === "password" ? showPassword :
              true
            }
            passwordLength={
              focusedField === "token" ? (gatewayForm.watch("gatewayToken")?.length || 0) :
              focusedField === "password" ? (gatewayForm.watch("password")?.length || 0) :
              0
            }
          />
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-gray-600 dark:text-gray-700">
          <Link 
            href="/privacy"
            className="hover:text-gray-900 dark:hover:text-black transition-colors cursor-pointer"
          >
            隐私政策
          </Link>
          <Link 
            href="/terms"
            className="hover:text-gray-900 dark:hover:text-black transition-colors cursor-pointer"
          >
            服务条款
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-gray-400/20 dark:bg-gray-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-gray-300/20 dark:bg-gray-200/20 rounded-full blur-3xl" />
      </div>

      {/* Right Login Section */}
      <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-[420px] py-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 text-lg font-bold mb-8">
            <div className="size-9 p-0.5 rounded-xl bg-background border border-border/40 flex items-center justify-center">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="lobster-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff4d4d"/>
                    <stop offset="100%" stopColor="#991b1b"/>
                  </linearGradient>
                </defs>
                <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient-mobile)"/>
                <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient-mobile)"/>
                <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient-mobile)"/>
                <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="45" cy="35" r="6" fill="#050810"/>
                <circle cx="75" cy="35" r="6" fill="#050810"/>
                <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
                <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
              </svg>
            </div>
            <span>OpenClaw</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">网关访问</h1>
            <p className="text-muted-foreground text-sm font-medium">连接您的 OpenClaw 网关</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-muted-foreground">请输入网关连接的位置及其身份验证方式。</p>
          </div>
          <form onSubmit={gatewayForm.handleSubmit(onGatewaySubmit)} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="websocketUrl" className="text-sm font-medium">WebSocket URL</Label>
                <div className="relative">
                  <Input 
                    id="websocketUrl" 
                    placeholder="ws://example.com:18789"
                    autoComplete="off"
                    {...gatewayForm.register("websocketUrl")} 
                    onFocus={() => { setIsTyping(true); setFocusedField("url"); }}
                    onBlur={() => { setIsTyping(false); setFocusedField(null); }}
                    className="h-11 border-border/60 rounded-xl" 
                  />
                </div>
              {gatewayForm.formState.errors.websocketUrl && <p className="text-xs text-destructive">{gatewayForm.formState.errors.websocketUrl.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gatewayToken" className="text-sm font-medium">网关令牌</Label>
                <div className="relative">
                  <Input 
                    id="gatewayToken" 
                    type={showToken ? "text" : "password"}
                    autoComplete="off"
                    placeholder="your-secret-token"
                    {...gatewayForm.register("gatewayToken")} 
                    onFocus={() => { setIsTyping(true); setFocusedField("token"); }}
                    onBlur={() => { setIsTyping(false); setFocusedField(null); }}
                    className="h-11 border-border/60 rounded-xl pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gatewayPassword" className="text-sm font-medium">密码 (不存储)</Label>
                <div className="relative">
                  <Input 
                    id="gatewayPassword" 
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="system password" 
                    {...gatewayForm.register("password")} 
                    onFocus={() => { setIsTyping(true); setFocusedField("password"); }}
                    onBlur={() => { setIsTyping(false); setFocusedField(null); }}
                    className="h-11 border-border/60 rounded-xl pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sessionSecret" className="text-sm font-medium">默认会话密钥</Label>
              <Input 
                id="sessionSecret" 
                autoComplete="off"
                {...gatewayForm.register("sessionSecret")} 
                onFocus={() => { setIsTyping(true); setFocusedField("session"); }}
                onBlur={() => { setIsTyping(false); setFocusedField(null); }}
                className="h-11 border-border/60 rounded-xl" 
              />
            </div>

            {error && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">{error}</div>}

            <div className="flex gap-3 pt-4">
              <InteractiveHoverButton type="submit" text={isLoading ? "正在连接..." : "连 接"} className="flex-1 h-12 text-base font-medium" disabled={isLoading} />
              <Button type="button" variant="outline" className="h-12 w-12 px-0 rounded-2xl" onClick={() => gatewayForm.reset()}>
                <RefreshCcw className="size-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
