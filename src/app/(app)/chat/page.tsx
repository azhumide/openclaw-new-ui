"use client";

import { useEffect, useState, useRef, useMemo, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, User, Bot, Paperclip, ChevronDown, Check,
  Plus, Terminal, Wrench, BarChart2, SquareTerminal,
  MessagesSquare, Clock, XCircle, ChevronRight,
  MoreHorizontal, Trash2, Power, Settings2, Key,
  BarChart, ListTodo, FileText, Brain, ChevronDownCircle,
  RotateCcw, Box, StopCircle, Eye, Zap, Book, Download,
  Monitor, X, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGateway } from "@/context/gateway-context";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const SLASH_COMMANDS = [
  { name: "new", label: "新建会话", description: "开启一个全新的对话上下文", category: "session", icon: Plus },
  { name: "reset", label: "重置会话", description: "重置当前会话的上下文", category: "session", icon: RotateCcw },
  { name: "compact", label: "压缩上下文", description: "压缩当前对话的上下文以节省 Token", category: "session", icon: Box },
  { name: "clear", label: "清空历史", description: "清空当前页面的聊天记录", category: "session", icon: Trash2 },
  { name: "stop", label: "停止生成", description: "由于网关限制，此命令可能部分失效", category: "session", icon: StopCircle },
  
  { name: "model", label: "切换模型", description: "查看或设置当前使用的模型", args: "<name>", category: "model", icon: Brain },
  { name: "think", label: "思考等级", description: "设置模型思考深度 (off/low/mid/high)", args: "<level>", category: "model", icon: Brain },
  { name: "fast", label: "快速模式", description: "切换是否开启快速响应模式", args: "<on|off>", category: "model", icon: Zap },
  { name: "verbose", label: "详细输出", description: "调试模式：输出更多中间过程", args: "<on|off>", category: "model", icon: Terminal },

  { name: "status", label: "运行状态", description: "查看当前网关及会话健康度", category: "tools", icon: BarChart },
  { name: "usage", label: "用量统计", description: "查看当前 Token 消耗概览", category: "tools", icon: BarChart2 },
  { name: "help", label: "查看帮助", description: "显示所有可用的命令列表", category: "tools", icon: Book },
  { name: "export", label: "导出对话", description: "将对话导出为 Markdown 文件", category: "tools", icon: Download },

  { name: "agents", label: "智能体列表", description: "列出当前活跃的所有子智能体", category: "agents", icon: Monitor },
  { name: "kill", label: "终止智能体", description: "强制停止特定的子智能体运行", args: "<id|all>", category: "agents", icon: X },
  { name: "skill", label: "运行技能", description: "直接调用特定的插件技能", args: "<name>", category: "agents", icon: Zap },
];

const CATEGORY_LABELS: any = {
    session: "会话控制",
    model: "模型设置",
    tools: "工具与状态",
    agents: "多智能体"
};

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { generateUUID } from "@/lib/openclaw/uuid";

const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
            <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-xl my-4 text-xs"
                customStyle={{ background: 'transparent', padding: '1.2rem' }}
                {...props}
            >
                {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
        ) : (
            <code className={cn(inline ? "bg-muted px-1.5 py-0.5 rounded text-xs" : "bg-transparent", className)} {...props}>
                {children}
            </code>
        );
    },
    p: ({ children }: any) => <p className="leading-relaxed mb-3 last:mb-0">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
    a: ({ node, ...props }: any) => <a {...props} className="text-primary hover:underline font-bold" target="_blank" rel="noopener noreferrer" />,
    h1: ({ children }: any) => <h1 className="text-xl font-black mt-6 mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-black mt-5 mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-black mt-4 mb-2">{children}</h3>,
};

export default function ChatPage() {
  const { connected, client, health } = useGateway();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<any | null>(null);
  
  const [activeSession, setActiveSession] = useState("main");
  const [showDetails, setShowDetails] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Load settings from local storage on mount
  useEffect(() => {
    const raw = localStorage.getItem("openclaw.control.settings.v1");
    if (raw) {
      try {
        const settings = JSON.parse(raw);
        if (settings.sessionKey) setActiveSession(settings.sessionKey);
        if (settings.chatShowThinking !== undefined) setShowDetails(settings.chatShowThinking);
      } catch (e) {}
    }
  }, []);
  
  const [isCommandsOpen, setIsCommandsOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<string | null>(null);
  const [sessionUsage, setSessionUsage] = useState<any>(null);
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!client || !connected) return;
    try {
      const res: any = await client.request("sessions.list", { limit: 50, includeGlobal: true, includeUnknown: true });
      setSessions(res.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, [client, connected]);

  const fetchModels = useCallback(async () => {
    if (!client || !connected) return;
    try {
      const res: any = await client.request("models.list", {});
      setModels(res.models || []);
    } catch (e) {
      console.error("Failed to load models", e);
    }
  }, [client, connected]);

  const fetchConfig = useCallback(async () => {
    if (!client || !connected) return;
    try {
      const res: any = await client.request("config.get", {});
      if (res) {
          const actualConfig = res.config || res;
          setConfig(actualConfig);
          const modelCfg = actualConfig.agents?.defaults?.model;
          const defaultModelId = typeof modelCfg === "object" ? modelCfg.primary : modelCfg;
          if (defaultModelId && !selectedModel) setSelectedModel(defaultModelId);
      }
    } catch (e) {
      console.error("Failed to load config", e);
    }
  }, [client, connected, selectedModel]);

  const fetchHistory = useCallback(async (key: string) => {
    if (!client || !connected) return;
    try {
      const res: any = await client.request("chat.history", { sessionKey: key, limit: 100 });
      setMessages(res.messages || []);
      setIsTyping(false);
    } catch (e) {
      toast({ title: "加载历史失败", description: "无法同步漫游记录", variant: "destructive" });
    }
  }, [client, connected, toast]);

  const activeModelData = useMemo(() => {
    return models.find(m => m.id === selectedModel);
  }, [models, selectedModel]);


  const fetchUsage = async () => {
    if (!client || !connected) return;
    setUsageLoading(true);
    try {
      // Usage can be a heavy request, give it more time
      const res: any = await client.request("sessions.usage", { limit: 100 }, 60000);
      if (res.sessions && Array.isArray(res.sessions)) {
        setSessions(prev => {
            const next = [...prev];
            res.sessions.forEach((u: any) => {
                const idx = next.findIndex(s => s.key === u.key);
                if (idx !== -1) next[idx] = { ...next[idx], usage: u.usage };
            });
            return next;
        });
      }
    } catch (e) {
      console.error("Failed to load usage", e);
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    if (connected && client) {
      const init = async () => {
        await fetchConfig();
        await fetchSessions();
        await fetchModels();
        await fetchHistory(activeSession);
      };
      init();
    }
  }, [connected, client, activeSession]); // Added activeSession to dependencies for safety

  useEffect(() => {
    if (isUsageOpen) {
      fetchUsage();
    }
  }, [isUsageOpen, connected, client]);

  useEffect(() => {
    if (showModelMenu) {
      fetchModels();
    }
  }, [showModelMenu, connected, client]);

  useEffect(() => {
    if (!client) return;
    const handleEvent = (evt: any) => {
      if (evt.event === "chat") {
        const { state, message, sessionKey, errorMessage } = evt.payload;

        // Flexible session key check
        const normalizedActive = activeSession.startsWith("agent:") ? activeSession.split(":").pop() : activeSession;
        const normalizedEvent = (sessionKey || "").startsWith("agent:") ? sessionKey.split(":").pop() : sessionKey;

        if (sessionKey !== activeSession && normalizedEvent !== normalizedActive) {
            return;
        }

        if (state === "delta") {
            setStreamingMessage(message);
            setIsTyping(true);
            if (evt.payload.usage) {
                const usage = evt.payload.usage;
                setSessionUsage(usage);
                setSessions(prev => prev.map(s => s.key === sessionKey ? { ...s, usage } : s));
            }
        } else if (state === "final" || state === "after-final" || state === "aborted") {
            // Optimistic update: push final message to list immediately to prevent "flash" gap
            if (message && message.content) {
                setMessages(prev => {
                    // Check if message already exists to avoid duplication
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
            setStreamingMessage(null);
            setIsTyping(false);
            // Debounce history/sessions fetch for data consistency (background)
            setTimeout(() => {
              fetchHistory(activeSession);
              fetchSessions();
            }, 800);
            if (evt.payload.usage) {
                const usage = evt.payload.usage;
                setSessionUsage(usage);
                setSessions(prev => prev.map(s => s.key === sessionKey ? { ...s, usage } : s));
            }
        } else if (state === "error") {
            console.error("Chat error from gateway:", errorMessage);
            setStreamingMessage(null);
            setIsTyping(false);
            toast({ title: "对话错误", description: errorMessage || "网关处理消息时遇到错误", variant: "destructive" });
        }
      }
    };
    (client as any).opts.onEvent = handleEvent;
  }, [client, activeSession, fetchHistory, fetchSessions, toast]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "auto"
        });
        if (isInitialLoad && messages.length > 0) {
            setIsInitialLoad(false);
        }
    }
  }, [messages, streamingMessage, isTyping, isInitialLoad]);

  const handleOpenSidebar = useCallback((content: string) => {
    setSidebarContent(content);
    setSidebarOpen(true);
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => {
        const next = !prev;
        const raw = localStorage.getItem("openclaw.control.settings.v1");
        if (raw) {
            try {
                const settings = JSON.parse(raw);
                settings.chatShowThinking = next;
                localStorage.setItem("openclaw.control.settings.v1", JSON.stringify(settings));
            } catch (e) {}
        }
        return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;
    if (!client || !connected) return;

    const text = inputText;
    const currentFiles = [...selectedFiles];
    
    // Optimistic user message (UI only shows text currently, but we clear inputs)
    const userMessage = {
        id: generateUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setSelectedFiles([]);
    setIsTyping(true);

    try {
        // Convert files to Base64 attachments
        const attachments = await Promise.all(currentFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({
                fileName: file.name,
                mimeType: file.type,
                content: base64
              });
            };
            reader.readAsDataURL(file);
          });
        }));

        await client.request("chat.send", {
            sessionKey: activeSession,
            message: text,
            attachments: attachments.length > 0 ? attachments : undefined,
            idempotencyKey: userMessage.id
        });
    } catch (e: any) {
        setIsTyping(false);
        toast({ title: "发送失败", description: e.message, variant: "destructive" });
    }
  }, [inputText, selectedFiles, client, connected, activeSession, toast]);

  const handleSwitchSession = (key: string) => {
    setIsInitialLoad(true);
    setActiveSession(key);
    setStreamingMessage("");
    setInputText("");
    setSelectedFiles([]);
    setMessages([]);
    fetchHistory(key);
    setShowSessionMenu(false);
  };

  const handleNewSession = () => {
    const newKey = `s-${Math.random().toString(36).slice(2, 8)}`;
    handleSwitchSession(newKey);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Modern File Preview Component
  const FilePreviewItem = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const isImage = file.type.startsWith('image/');

    useEffect(() => {
      if (!isImage) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }, [file, isImage]);

    if (isImage) {
      return (
        <div className="relative group size-14 sm:size-16 rounded-xl overflow-hidden border border-primary/20 shadow-sm transition-all hover:scale-105 active:scale-95">
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
            className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
          >
            <XCircle className="size-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 group/file h-14 sm:h-16 max-w-[160px] animate-in zoom-in-95 duration-200">
        <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <FileText className="size-4 text-primary" />
        </div>
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-[10px] font-bold truncate text-foreground">{file.name}</span>
          <span className="text-[8px] font-medium opacity-40 uppercase">{(file.size / 1024).toFixed(1)} KB</span>
        </div>
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }} 
          className="hover:text-destructive transition-colors ml-1 cursor-pointer p-0.5 opacity-0 group-hover/file:opacity-100"
        >
          <XCircle className="size-4 fill-background" />
        </button>
      </div>
    );
  };

  const activeSessionData = useMemo(() => {
    const s = sessions.find(sess => sess.key === activeSession);
    if (s) return s;
    const label = activeSession.startsWith('agent:') ? activeSession.split(':').pop() || activeSession : activeSession;
    return { label, displayName: label };
  }, [sessions, activeSession]);

  const handleCommandClick = (cmd: any) => {
    setIsCommandsOpen(false);
    if (cmd.args) {
      setInputText(`/${cmd.name} `);
      // Give it a tiny timeout to ensure the modal closes and focus works
      setTimeout(() => {
        const input = document.querySelector('textarea');
        if (input) input.focus();
      }, 50);
    } else {
      const cmdText = `/${cmd.name}`;
      // Execute simple commands immediately
      const userMessage = { 
        id: generateUUID(), 
        role: "user", 
        content: cmdText,
        createdAt: new Date().toISOString() 
      };
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);
      client?.request("chat.send", { 
          sessionKey: activeSession, 
          message: cmdText, 
          idempotencyKey: userMessage.id
      }).catch(e => {
          setIsTyping(false);
          toast({ title: "命令执行失败", description: e.message, variant: "destructive" });
      });
    }
  };

  const renderCommandsModal = () => (
    <Dialog open={isCommandsOpen} onOpenChange={setIsCommandsOpen}>
      <DialogContent className="w-[96vw] sm:max-w-[600px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-[1.8rem] sm:rounded-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-black">
            <SquareTerminal className="size-5 sm:size-6 text-orange-500" /> 快捷命令控制台
          </DialogTitle>
          <p className="text-[10px] sm:text-xs text-muted-foreground opacity-50 mt-1 uppercase tracking-widest font-black">OpenClaw Mesh Command Center</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
          {Object.keys(CATEGORY_LABELS).map(cat => {
              const catCmds = SLASH_COMMANDS.filter(c => c.category === cat);
              if (catCmds.length === 0) return null;
              return (
                  <div key={cat} className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap">{CATEGORY_LABELS[cat]}</span>
                          <div className="h-px w-full bg-gradient-to-r from-muted-foreground/10 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {catCmds.map(cmd => (
                            <button 
                                key={cmd.name}
                                onClick={() => handleCommandClick(cmd)}
                                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-[1.2rem] bg-muted/20 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group text-left relative overflow-hidden active:scale-95"
                            >
                                <div className="size-8 sm:size-10 rounded-xl bg-background border border-border/50 flex items-center justify-center shrink-0 group-hover:text-primary transition-colors">
                                    <cmd.icon className="size-4 sm:size-5 stroke-[1.5]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <p className="text-xs sm:text-sm font-bold tracking-tight">/{cmd.name}</p>
                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-muted-foreground opacity-30 line-clamp-1">{cmd.label}</p>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed mt-0.5 sm:mt-1 line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity">{cmd.description}</p>
                                </div>
                                {cmd.args && (
                                    <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3">
                                        <div className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 text-[7px] sm:text-[8px] font-black uppercase tracking-widest">Args</div>
                                    </div>
                                )}
                            </button>
                        ))}
                      </div>
                  </div>
              )
          })}
        </div>
        <div className="p-4 bg-muted/20 border-t text-center">
            <p className="text-[10px] text-muted-foreground/40 font-medium">点击命令可直接执行或快速填入参数</p>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderUsageModal = () => (
    <Dialog open={isUsageOpen} onOpenChange={setIsUsageOpen}>
      <DialogContent className="w-[92vw] sm:max-w-[425px] rounded-[1.8rem] sm:rounded-2xl p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 uppercase tracking-tighter text-lg font-black">
            <BarChart2 className="size-5 text-green-500" /> 用量统计
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4 relative">
          {usageLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">正在计算中...</p>
            </div>
          )}
          <div className="space-y-3">
            {[
                { label: "输入 Token", value: activeSessionData.usage?.input || 0, color: "bg-blue-500" },
                { label: "输出 Token", value: activeSessionData.usage?.output || 0, color: "bg-green-500" }
            ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-xs font-bold flex items-center gap-2 uppercase opacity-60">
                        <div className={cn("size-2 rounded-full", row.color)} /> {row.label}
                    </span>
                    <span className="font-mono text-sm font-black">{formatContext(row.value)}</span>
                </div>
            ))}
          </div>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary/60">累计总计</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-primary">{formatContext((activeSessionData.usage?.input || 0) + (activeSessionData.usage?.output || 0))}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex h-full bg-muted/5 overflow-hidden">
        {mounted && document.getElementById('header-context-monitor-portal') && createPortal(
            <div className="shrink-0 flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 rounded-full bg-muted/20 border border-border/50 text-[9px] sm:text-[11px] font-medium tracking-widest text-muted-foreground/80 shadow-sm transition-all font-mono" title="当前上下文窗口状态">
                <div className={cn(
                    "size-1.5 rounded-full animate-pulse shrink-0",
                    ((activeSessionData?.totalTokens || health?.contextWeight || sessionUsage?.input || 0) / ((activeSessionData?.contextTokens || activeModelData?.contextWindow || config?.agents?.defaults?.contextTokens || health?.contextLimit || 128000) || 1)) > 0.8 ? "bg-red-500" : 
                    ((activeSessionData?.totalTokens || health?.contextWeight || sessionUsage?.input || 0) / ((activeSessionData?.contextTokens || activeModelData?.contextWindow || config?.agents?.defaults?.contextTokens || health?.contextLimit || 128000) || 1)) > 0.5 ? "bg-yellow-500" : "bg-emerald-500"
                )} />
                <span className="font-bold">{formatContext(activeSessionData?.totalTokens || health?.contextWeight || sessionUsage?.input || 0)}</span>
                <span className="opacity-30 text-[8px] sm:text-[10px]">/</span>
                <span className="opacity-40 font-bold text-[9px] sm:text-[11px]">{formatContext(activeSessionData?.contextTokens || activeModelData?.contextWindow || config?.agents?.defaults?.contextTokens || health?.contextLimit || 128000)}</span>
            </div>,
            document.getElementById('header-context-monitor-portal')!
        )}

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex-1 flex flex-col h-full overflow-hidden relative"
      >
        {renderCommandsModal()}
        {renderUsageModal()}
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-8 custom-scrollbar">
            <motion.div 
                key={activeSession}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-44 sm:pb-40"
            >
                {messages.length === 0 && !isTyping && !streamingMessage && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-40 opacity-20 select-none">
                        <Bot className="size-32 mb-6 stroke-[0.5]" />
                        <div className="text-center font-black uppercase tracking-[0.3em]">
                            <p className="text-2xl">OpenClaw Mesh</p>
                            <p className="text-[10px] mt-2 opacity-60">Gateway Connection Established</p>
                        </div>
                    </div>
                )}
                {useMemo(() => {
                  const allVisible = [...messages];
                  
                  // Phase 1: Thinking (Virtual message)
                  if (isTyping && !streamingMessage) {
                    allVisible.push({ id: 'current-ai-response', role: 'assistant', isThinking: true });
                  }
                  // Phase 2: Streaming (Only if not already finalized in Phase 3)
                  else if (streamingMessage) {
                    const stableId = streamingMessage.id || 'current-ai-response';
                    if (!messages.find(m => m.id === stableId)) {
                        allVisible.push({ ...streamingMessage, id: stableId, isStreaming: true });
                    }
                  }

                  return allVisible.map((m, i) => (
                    <MessageItem 
                      key={`msg-${i}`} 
                      {...m}
                      isStreaming={m.isStreaming || false}
                      isThinking={m.isThinking || false}
                      onOpenSidebar={handleOpenSidebar}
                      message={m}
                      agents={agents}
                      showDetails={showDetails}
                    />
                  ));
                }, [messages, streamingMessage, isTyping, agents, showDetails, handleOpenSidebar])}
                <div ref={bottomRef} className="h-4" />
            </motion.div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 px-4 pb-10 pt-8 sm:p-8 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none"
        >
            <div className="max-w-4xl mx-auto pointer-events-auto">
                <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-2 sm:mb-4">
                    <motion.div layout className="flex w-max items-center gap-1.5 sm:gap-3 px-1 sm:px-0 pb-1">
                        <div className="relative shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" size="sm"
                                        className="h-6 sm:h-8 rounded-full bg-background/80 backdrop-blur-sm border-border/50 text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all px-1.5 sm:px-4 shrink-0 focus-visible:ring-0"
                                    >
                                        <MessagesSquare className="size-2.5 sm:size-3.5 mr-1 sm:mr-1.5 opacity-50 shrink-0" />
                                        <span className="max-w-[40px] sm:max-w-[120px] truncate">{activeSessionData.displayName || activeSessionData.label || activeSession}</span>
                                        <ChevronDown className={cn("size-2.5 ml-1 sm:ml-1.5 opacity-30 shrink-0 transition-transform", showSessionMenu && "rotate-180")} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-72 p-2 border-border/50 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                                    <div className="p-3 border-b border-border/40 flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 pl-1">会话列表</span>
                                        <Button variant="ghost" size="icon" className="size-6 rounded-lg text-primary hover:bg-primary/5" onClick={handleNewSession}><Plus className="size-3.5" /></Button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto space-y-1 p-1 custom-scrollbar">
                                        {(() => {
                                          // Group sessions by agent prefix
                                          const grouped: Record<string, typeof sessions> = {};
                                          sessions.forEach(s => {
                                            const agentPrefix = s.key?.startsWith("agent:") ? s.key.split(":")[1] : "main";
                                            if (!grouped[agentPrefix]) grouped[agentPrefix] = [];
                                            grouped[agentPrefix].push(s);
                                          });
                                          // Generate consistent color from agentId
                                          const getAgentColor = (agentId: string) => {
                                            if (agentId === "main") return "hsl(199, 89%, 48%)"; // Sky Blue for main
                                            const hash = agentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                                            const hue = hash % 360;
                                            return `hsl(${hue}, 65%, 50%)`;
                                          };
                                          return Object.entries(grouped).map(([agentId, agentSessions]) => {
                                            const color = getAgentColor(agentId);
                                            return (
                                            <div key={agentId}>
                                              <div className="flex items-center gap-2 px-2.5 py-1.5 mt-1 first:mt-0">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{agentId}</span>
                                              </div>
                                              {agentSessions.map(s => (
                                                <DropdownMenuItem
                                                  key={s.key}
                                                  onClick={() => handleSwitchSession(s.key)}
                                                  className={cn(
                                                    "w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 cursor-pointer outline-none focus:bg-muted",
                                                    activeSession === s.key ? "border" : "border-transparent"
                                                  )}
                                                  style={activeSession === s.key ? { backgroundColor: `${color}15`, borderColor: `${color}30` } : {}}
                                                >
                                                  <Bot className="size-3.5 shrink-0" style={{ color, opacity: 0.6 }} />
                                                  <div className="flex-1 min-w-0 pr-2">
                                                    <p className="text-[11px] font-bold truncate" style={activeSession === s.key ? { color } : {}}>{s.displayName || s.label || s.key.split(":").pop()}</p>
                                                    <p className="text-[9px] opacity-30 font-mono truncate">{s.key}</p>
                                                  </div>
                                                  {activeSession === s.key && <Check className="size-3" style={{ color }} />}
                                                </DropdownMenuItem>
                                              ))}
                                            </div>
                                          );
                                          });
                                        })()}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="relative shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" size="sm" 
                                        className="h-6 sm:h-8 rounded-full bg-background/80 backdrop-blur-sm border-border/50 text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-4 hover:text-foreground transition-all shrink-0 focus-visible:ring-0"
                                    >
                                        <Brain className="size-2.5 sm:size-3.5 mr-1 sm:mr-1.5 opacity-50 shrink-0" />
                                        <span className="max-w-[50px] sm:max-w-[160px] truncate">{selectedModel || "Default"}</span> 
                                        <ChevronDown className="size-2.5 ml-1 sm:ml-1.5 opacity-30 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-72 p-2 border-border/50 bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                                    <div className="p-2.5 border-b border-border/40 text-[9px] font-black uppercase opacity-40 tracking-widest pl-3 flex items-center gap-2 mb-1">
                                        <Monitor className="size-3" /> 模型列表
                                    </div>
                                    {selectedModel && (
                                        <div className="px-3 py-2.5 mb-1.5 mx-1 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in zoom-in-95 duration-300">
                                            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest block mb-1">当前正在使用 (Active)</span>
                                            <div className="flex items-center gap-2">
                                                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[11px] font-bold text-primary break-all leading-normal">
                                                    {activeModelData?.name || selectedModel}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="max-h-60 overflow-y-auto p-1 py-1.5 custom-scrollbar">
                                        {(() => {
                                          // Group models by provider
                                          const grouped: Record<string, typeof models> = {};
                                          models.forEach(m => {
                                            const provider = m.provider || m.config_key || m.owned_by || "unknown";
                                            if (!grouped[provider]) grouped[provider] = [];
                                            grouped[provider].push(m);
                                          });
                                          // Generate consistent color from provider name
                                          const getProviderColor = (provider: string) => {
                                            const hash = provider.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                                            const hue = hash % 360;
                                            return `hsl(${hue}, 65%, 50%)`;
                                          };
                                          return Object.entries(grouped).map(([provider, providerModels]) => {
                                            const color = getProviderColor(provider);
                                            return (
                                              <div key={provider}>
                                                <div className="flex items-center gap-2 px-2.5 py-1.5 mt-1 first:mt-0">
                                                  <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
                                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{provider}</span>
                                                </div>
                                                {providerModels.map((m, i) => (
                                                  <DropdownMenuItem
                                                    key={`${m.id}-${i}`}
                                                    onClick={() => { setSelectedModel(m.id); }}
                                                    className={cn(
                                                      "w-full text-left p-2.5 rounded-xl transition-all group flex items-start gap-3 cursor-pointer outline-none focus:bg-muted",
                                                      selectedModel === m.id ? "border" : "border-transparent"
                                                    )}
                                                    style={selectedModel === m.id ? { backgroundColor: `${color}15`, borderColor: `${color}30` } : {}}
                                                  >
                                                    <div className="size-2 rounded-full mt-1.5" style={{ backgroundColor: color, opacity: 0.6 }} />
                                                    <div className="flex-1 min-w-0 pr-2">
                                                      <p className="text-[11px] font-bold truncate" style={selectedModel === m.id ? { color } : {}}>{m.name || m.id}</p>
                                                    </div>
                                                    {selectedModel === m.id && <Check className="size-3 mt-1" style={{ color }} />}
                                                  </DropdownMenuItem>
                                                ))}
                                              </div>
                                            );
                                          });
                                        })()}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <Button variant="outline" size="sm" onClick={() => setIsCommandsOpen(true)} className="size-6 sm:size-8 rounded-full border-border/50 p-0 shadow-sm bg-background/80 backdrop-blur-sm hover:scale-105 transition-all shrink-0"><SquareTerminal className="size-3 lg:size-3.5 text-orange-500" /></Button>
                        <Button variant="outline" size="sm" onClick={() => setIsUsageOpen(true)} className="size-6 sm:size-8 rounded-full border-border/50 p-0 shadow-sm bg-background/80 backdrop-blur-sm hover:scale-105 transition-all shrink-0"><BarChart2 className="size-3 lg:size-3.5 text-green-500" /></Button>
                        
                        <div className="w-px h-4 bg-border/50 mx-1 shrink-0" />
                        
                        <Button 
                            variant="outline" size="sm" 
                            onClick={toggleDetails} 
                            className={cn(
                                "size-6 sm:size-8 rounded-full border-border/50 p-0 shadow-sm backdrop-blur-sm hover:scale-105 transition-all shrink-0",
                                showDetails ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-background/80 text-muted-foreground/40 grayscale"
                            )}
                        >
                            <Zap className="size-3 lg:size-3.5" />
                        </Button>

                        {/* Context monitor deeply moved to React Portal */}
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto pointer-events-auto">
                <motion.div 
                    layout
                    className="relative group/input"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {selectedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 mb-3 px-2 relative z-50 animate-in fade-in slide-in-from-bottom-3 duration-500">
                            {selectedFiles.map((file, idx) => (
                                <FilePreviewItem 
                                    key={`${file.name}-${idx}`} 
                                    file={file} 
                                    onRemove={() => removeFile(idx)} 
                                />
                            ))}
                        </div>
                    )}
                    <div 
                        className={cn(
                        "relative bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-primary/20 dark:border-primary/30 shadow-[0_20px_50px_-15px_rgba(var(--primary),0.08)] rounded-[1.8rem] sm:rounded-[2.5rem] overflow-hidden p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 pr-3 sm:pr-4 transition-all duration-300",
                        isDragging && "bg-primary/5 border-primary/40 ring-2 ring-primary/20 shadow-primary/20"
                    )}>
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-2xl size-9 sm:size-11 shrink-0 bg-primary/5 text-primary/60 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                        >
                            <Plus className="size-5" />
                        </Button>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            onPaste={handlePaste}
                            placeholder="Message OpenClaw..."
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none min-h-[44px] sm:min-h-[52px] max-h-32 sm:max-h-48 py-3 px-1 text-sm sm:text-[15px] font-medium custom-scrollbar placeholder:text-muted-foreground/40 leading-relaxed"
                            rows={1}
                        />
                        <Button 
                            onClick={handleSend}
                            disabled={!inputText.trim() || !connected}
                            className="rounded-2xl size-9 sm:size-11 grow-0 bg-gradient-to-br from-indigo-500 via-primary to-violet-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-90 transition-all duration-300 shrink-0"
                        >
                            <Send className="size-4 sm:size-5 rotate-[-10deg]" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-[500px] border-l bg-background/60 backdrop-blur-3xl flex flex-col z-30 shadow-2xl"
            >
              <div className="p-8 border-b flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-5">
                      <div className="size-12 bg-primary/10 rounded-[1.2rem] flex items-center justify-center border border-primary/20">
                          <Terminal className="size-6 text-primary" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black uppercase tracking-widest leading-tight">执行详情</h3>
                          <p className="text-[10px] text-muted-foreground font-black opacity-40 mt-1 uppercase tracking-tighter">报文分析控制台</p>
                      </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive"><XCircle className="size-7 stroke-[1.5]" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {sidebarContent || ""}
                      </ReactMarkdown>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const MessageItem = memo(({ role, content, sender, isStreaming, onOpenSidebar, message, agents, showDetails, isThinking: isThinkingProp }: any) => {
  const isUser = role === "user";
  const { profile } = useProfile();
  const isThinking = isThinkingProp || message?.isThinking || false;

  const agentName = useMemo(() => {
    if (!message?.agentId) return null;
    const a = agents?.find((agent: any) => agent.id === message.agentId);
    return a?.name || a?.id;
  }, [agents, message?.agentId]);
  
  const parts = useMemo(() => {
    if (isThinking) return [];
    let initialParts: any[] = [];
    if (Array.isArray(content)) initialParts = content;
    else if (typeof content === 'string' && content.trim()) initialParts = [{ type: 'text', text: content }];
    else if (message?.text) initialParts = [{ type: 'text', text: message.text }];
    else if (message?.thinking || message?.thought) initialParts = [{ type: 'thinking', ...message }];
    else if (message?.name && (message?.arguments || message?.args)) initialParts = [{ type: 'tool_call', ...message }];
    else if (message?.toolCallId || message?.tool_call_id) initialParts = [{ type: 'tool_result', ...message }];
    
    // Extract <think> blocks from text parts
    const finalParts: any[] = [];
    initialParts.forEach(p => {
        const text = p.text || (typeof p === 'string' ? p : null);
        if (text && (p.type === 'text' || !p.type)) {
            let lastIndex = 0;
            const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/g;
            let match;
            while ((match = thinkRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    finalParts.push({ type: 'text', text: text.slice(lastIndex, match.index) });
                }
                finalParts.push({ type: 'thinking', text: match[1] });
                lastIndex = thinkRegex.lastIndex;
            }
            if (lastIndex < text.length) {
                finalParts.push({ type: 'text', text: text.slice(lastIndex) });
            }
        } else {
            finalParts.push(p);
        }
    });

    return finalParts;
  }, [content, message, isThinking]);

  const renderPart = (part: any, index: number) => {
    if (typeof part === "string") return <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={markdownComponents}>{part}</ReactMarkdown>;

    const type = (part.type ||"").toLowerCase();
    
    // Robust type detection
    const isToolCall = ["tool_call", "toolcall", "tool_use", "tooluse", "tool-call"].includes(type) || (part.name && (part.arguments || part.args));
    const isToolResult = ["tool_result", "toolresult", "tool-result"].includes(type) || (part.toolCallId || part.tool_call_id);
    const isThinkingPart = ["thinking", "thought", "reasoning"].includes(type) || part.thinking || part.thought;

    if (isThinkingPart) {
        if (!showDetails) return null;
        const thinkingText = part.text || part.thinking || part.thought || "";
        if (!thinkingText || !thinkingText.trim()) return null;
        return (
            <div key={index} className="my-4 group/think">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">
                        <Brain className="size-3" /> AI Reasoning
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/10 to-transparent" />
                </div>
                <div className="relative pl-6 border-l-2 border-primary/10 py-1 transition-all duration-500 hover:border-primary/30">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/50 italic text-[11px] sm:text-[13px] leading-relaxed selection:bg-primary/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {thinkingText}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    }

    if (isToolCall) {
        const args = part.arguments || part.args || "";
        const argsStr = typeof args === "string" ? args : JSON.stringify(args, null, 2);
        
        // Compact mode for tools
        if (!showDetails) {
            return (
                <div key={index} className="my-1.5 flex items-center gap-3 px-3 py-2 rounded-2xl bg-muted/20 border border-border/40 shadow-sm w-fit max-w-full group hover:border-orange-500/20 transition-all duration-300">
                    <div className="size-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                        <Terminal className="size-3 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="font-mono text-[10px] font-bold truncate opacity-80">{part.name || "Tool"}</span>
                        <div className="size-1 rounded-full bg-muted-foreground/20" />
                        <span className="font-mono text-[9px] truncate opacity-40 max-w-[150px]">{argsStr?.slice(0, 40)}{argsStr?.length > 40 ? "..." : ""}</span>
                    </div>
                    <div className="ml-auto flex items-center">
                        <div className="size-4 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Check className="size-2 text-emerald-600" />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className="my-3 rounded-[1.5rem] border border-border/40 bg-muted/10 overflow-hidden shadow-sm group hover:border-orange-500/30 transition-all duration-500">
                <div className="flex items-center justify-between px-5 py-3.5 bg-muted/20 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Terminal className="size-4 text-orange-600" />
                        </div>
                        <span className="font-black text-[13px] uppercase tracking-tight">{part.name || "Tool Call"}</span>
                    </div>
                    {!showDetails ? (
                         <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-600 uppercase">
                            <Check className="size-2" /> Done
                         </div>
                    ) : (
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-orange-500/20 text-orange-600 bg-orange-500/5 px-2 py-0.5">Exec</Badge>
                    )}
                </div>
                {showDetails && argsStr && argsStr !== "{}" && (
                    <div className="p-4 font-mono text-[10px] leading-relaxed text-muted-foreground/70 bg-background/20 break-all select-all">
                        {argsStr}
                    </div>
                )}
            </div>
        );
    }

    if (isToolResult) {
        const resContent = part.content || part.text || part.result || "";
        const contentJson = typeof resContent === "string" ? resContent : JSON.stringify(resContent, null, 2);

        if (!showDetails) {
            return (
                <div key={index} className="my-1.5 flex items-center gap-3 px-3 py-2 rounded-2xl bg-primary/5 border border-primary/10 w-fit max-w-full opacity-60">
                    <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="font-mono text-[10px] font-bold text-primary truncate">SYSTEM OUTPUT</span>
                        <div className="size-1 rounded-full bg-primary/20" />
                        <span className="font-mono text-[9px] truncate opacity-50 max-w-[150px] italic">JSON Metadata Result</span>
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className="my-3 rounded-[1.5rem] border border-border/40 bg-muted/5 overflow-hidden shadow-sm group transition-all duration-500 hover:border-emerald-500/30">
                <div className="flex items-center justify-between px-5 py-3.5 bg-muted/10 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Wrench className="size-4 text-emerald-600" />
                        </div>
                        <span className="font-black text-[13px] uppercase tracking-tight">{part.name || "Result"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" size="sm" 
                            onClick={() => onOpenSidebar?.(`### 🛠️ 工具执行输出\n\n**工具名称:** \`${part.name || "Default"}\`\n\n#### 返回内容 (Payload)\n\n\`\`\`json\n${contentJson}\n\`\`\``)}
                            className="h-7 rounded-lg text-[9px] font-black uppercase tracking-widest border-primary/10 text-primary hover:bg-primary/5 px-3"
                        >
                            View <ChevronRight className="size-2.5 ml-1" />
                        </Button>
                        <Badge variant="outline" className="text-[8px] font-black uppercase border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-2 py-0.5">OK</Badge>
                    </div>
                </div>
                {contentJson && contentJson !== "{}" && (
                    <div className="p-4 font-mono text-[10px] leading-relaxed text-muted-foreground/40 italic opacity-50 truncate">
                        {contentJson.slice(0, 120)}{contentJson.length > 120 ? "..." : ""}
                    </div>
                )}
            </div>
        );
    }

    // Explicit text handling
    if (type === "text" || !type) {
        let text = part.text || (typeof part === 'string' ? part : "");
        if (!text || !text.trim()) {
            if (isStreaming) return <span className="opacity-0">...</span>;
            return null;
        }

        // Technical noise detection for simplified mode
        if (!showDetails && (text.trim().startsWith("{") || text.includes("<EXTERNAL_UNTRUSTED_CONTENT"))) {
            return (
                <div key={index} className="my-1.5 flex items-center gap-3 px-3 py-2 rounded-2xl bg-primary/5 border border-primary/10 w-fit max-w-full opacity-60">
                    <div className="size-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                        <Terminal className="size-3 text-orange-600" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className="font-mono text-[10px] font-bold text-orange-600 truncate">SYSTEM DATA</span>
                        <div className="size-1 rounded-full bg-orange-500/20" />
                        <span className="font-mono text-[9px] truncate opacity-40 max-w-[150px] italic">Technical payload collapsed</span>
                    </div>
                </div>
            );
        }

        text = text.replace(/<\/?final>/g, "").trim();
        if (!text) return null;
        return (
            <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {text}
            </ReactMarkdown>
        );
    }

    // Ultimate fallback for unknown complex parts
    let textContent = part.text || part.content || (typeof part === 'object' ? JSON.stringify(part) : String(part));
    if (!textContent || textContent === "{}" || textContent === '{"type":"text","text":""}') return null;
    
    // If it's pure JSON technical content and not in detail mode, hide it or simplify
    if (!showDetails && (textContent.trim().startsWith("{") || textContent.includes("<EXTERNAL_UNTRUSTED_CONTENT"))) {
        return (
            <div key={index} className="my-1.5 flex items-center gap-3 px-3 py-2 rounded-2xl bg-muted/40 border border-border/40 w-fit max-w-full opacity-60">
                <Box className="size-3 text-muted-foreground/60" />
                <span className="font-mono text-[9px] truncate opacity-40 italic">Hidden system bloat</span>
            </div>
        );
    }

    textContent = textContent.replace(/<\/?final>/g, "").trim();
    if (!textContent) return null;
    
    return (
        <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {textContent}
        </ReactMarkdown>
    );
  };

  const displaySender = sender || message?.sender || (isUser ? "You" : (role === "tool" ? "Tool" : "Assistant"));
  const rawTs = message?.createdAt || message?.timestamp || message?.ts;
  const timestamp = rawTs ? new Date(rawTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
  const fromId = message?.from;

  // 判断是否纯技术/结构化内容
  const isPureStructured = useMemo(() => {
    if (isUser || isThinking || parts.length === 0) return false;
    
    return parts.every(p => {
        const type = (p.type || "").toLowerCase();
        const text = (p.text || (typeof p === 'string' ? p : "")).trim();

        // 1. 结构化组件：工具调用、结果、思考过程
        const isTool = ["tool_call", "tool_result", "toolcall", "toolresult", "tool_use", "tool-call", "tool-result"].includes(type) || p.name || p.toolCallId;
        const isThinkingPart = ["thinking", "thought", "reasoning"].includes(type) || p.thinking || p.thought;
        if (isTool || isThinkingPart) return true;

        // 2. 技术载荷文本（会被渲染为 SYSTEM DATA 卡片的内容）
        if (!showDetails && (text.startsWith("{") || text.includes("<EXTERNAL_UNTRUSTED_CONTENT"))) return true;

        // 3. 空白或控制标签
        const cleanText = text.replace(/<\/?final>/g, "").trim();
        if (cleanText.length === 0) return true;

        // 其他所有带实际文字的内容都需要外层气泡包裹
        return false;
    });
  }, [isUser, isThinking, parts, showDetails]);

  if (parts.length === 0 && !isStreaming && !isThinking) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-2 sm:gap-3 mb-4 sm:mb-6", !showDetails && "duration-0", isUser ? "flex-row-reverse" : "max-w-4xl")}
    >
      <div className={cn("size-7 sm:size-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border overflow-hidden shadow-sm transition-transform hover:scale-105 mt-1 sm:mt-0", isUser ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-background border-border")}>
        {isUser ? (profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <User className="size-4 sm:size-5" />) : (
            <div className="relative">
                <Bot className={cn("size-4 sm:size-5 text-primary", isThinking && "animate-pulse")} />
                {isThinking && <div className="absolute -inset-1 bg-primary/20 blur-sm rounded-full animate-ping" />}
            </div>
        )}
      </div>
      <div className={cn("flex-1 min-w-0 flex flex-col", isUser ? "items-end" : "items-start")}>
        <div className={cn("mb-1 sm:mb-2 px-1 sm:px-2 flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground/40 font-bold uppercase", isUser ? "flex-row-reverse" : "flex-row")}>
            {displaySender && <span className="text-muted-foreground/60">{displaySender}</span>}
            {fromId && <span className="opacity-50">({fromId})</span>}
            {timestamp && <span className="opacity-50 font-medium">{timestamp}</span>}
        </div>
        
        {isThinking ? (
            <div className="flex gap-1.5 p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] bg-muted/10 border border-border/40 w-fit">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="size-1.5 rounded-full bg-primary/30" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 rounded-full bg-primary/30" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 rounded-full bg-primary/30" />
            </div>
        ) : (
            <div 
              style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}
              className={cn(
                "transition-all w-fit max-w-full", 
                isUser ? "px-4 sm:px-5 py-2 sm:py-2.5 rounded-[1.2rem] sm:rounded-[1.5rem] shadow-sm border bg-indigo-50/30 border-indigo-100/40 rounded-tr-none text-indigo-950 font-medium" : 
                (isPureStructured ? "bg-transparent border-none shadow-none px-0 py-0" : "px-4 sm:px-5 py-2 sm:py-2.5 rounded-[1.2rem] sm:rounded-[1.5rem] shadow-sm border bg-background border-border/50 rounded-tl-none")
            )}>
                <div className={cn(
                    "max-w-none w-full break-words leading-tight sm:leading-6 text-[12px] sm:text-[14px]",
                    parts.some(p => p.type === 'text' && (p.text.includes('#') || p.text.includes('```') || p.text.includes('|') || p.text.includes('- '))) ? "prose prose-sm dark:prose-invert [&&_*]:m-0" : "flex items-center"
                )}>
                    <div style={{ margin: 0, padding: 0 }} className="w-full">
                        {parts.map((part, i) => renderPart(part, i))}
                    </div>
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isStreaming ? [0, 1, 0] : 0 }}
                        transition={{ repeat: isStreaming ? Infinity : 0, duration: 0.8 }}
                        className="inline-block w-1.5 h-4 sm:h-5 bg-primary/80 ml-1 shrink-0 align-middle shadow-[0_0_8px_rgba(var(--primary),0.5)] rounded-full" 
                    />
                </div>
            </div>
        )}
      </div>
    </motion.div>
  );
});

MessageItem.displayName = "MessageItem";

function extractText(message: any): string | null {
  if (!message) return null;
  let raw = "";
  if (typeof message === "string") {
    raw = message;
  } else if (message.text) {
    raw = message.text;
  } else if (message.delta) {
    raw = message.delta;
  } else if (Array.isArray(message.content)) {
    raw = message.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text || c.content || "")
      .join("");
  } else if (typeof message.content === "string") {
    raw = message.content;
  }
  
  if (!raw) return null;
  // Clean control tags and trim
  return raw.replace(/<\/?final>/g, "").trim();
}

function formatContext(num: number): string {
    if (!num) return "0";
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
}
