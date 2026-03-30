"use client";

import { useEffect, useState, useRef } from "react";
import { useGateway } from "@/context/gateway-context";
import { Button } from "@/components/ui/button";
import { 
  Terminal, Trash2, Pause, Play, 
  ChevronDown, Search, Download,
  Terminal as TerminalIcon, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentLogPanelProps {
  agentId: string;
}

export function AgentLogPanel({ agentId }: AgentLogPanelProps) {
  const { client, connected } = useGateway();
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (!client || !connected || isPaused) return;

    try {
      const res = await client.request("logs.tail", { 
        cursor, 
        limit: showAllLogs ? 100 : 300 // Filtered mode needs more lines to find matches
      });
      
      if (res.lines && res.lines.length > 0) {
        let newLines = res.lines;
        
        if (!showAllLogs) {
            // Flexible matching for agent relevant logs
            newLines = res.lines.filter((line: string) => {
              const lowerLine = line.toLowerCase();
              const lowerId = agentId.toLowerCase();
              return lowerLine.includes(`[${lowerId}]`) || 
                     lowerLine.includes(`agent:${lowerId}`) ||
                     lowerLine.includes(lowerId);
            });
        }

        if (newLines.length > 0) {
          setLogs(prev => {
            const next = [...prev, ...newLines];
            return next.slice(-1000); // Keep last 1000 lines
          });
        }
      }
      setCursor(res.cursor);
    } catch (e) {
      console.error("Failed to tail logs", e);
    }
  };

  useEffect(() => {
    const timer = setInterval(fetchLogs, 2500);
    return () => clearInterval(timer);
  }, [client, connected, isPaused, cursor, agentId, showAllLogs]);

  // Reset when agent or mode changes
  useEffect(() => {
    setLogs([]);
    setCursor(undefined);
  }, [agentId, showAllLogs]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const clearLogs = () => setLogs([]);

  return (
    <div className="flex flex-col h-full min-h-[400px] border border-border/50 rounded-2xl overflow-hidden bg-[#0D0D0F] shadow-2xl">
      {/* Terminal Header */}
      <div className="h-10 px-4 flex items-center justify-between bg-[#1A1A1E] border-b border-white/5">
        <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-[#FF5F56]" />
                <div className="size-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="size-2.5 rounded-full bg-[#27C93F]" />
            </div>
            <div className="size-px h-3 bg-white/10 mx-1" />
            <div className="flex items-center gap-2 text-white/40 font-mono text-[10px] sm:text-xs">
                <TerminalIcon className="size-3" />
                <span className="uppercase tracking-widest font-black">Runtime Debug</span>
                <span className="opacity-40">@{agentId}</span>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5 mr-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllLogs(false)}
                    className={cn(
                        "h-6 px-3 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                        !showAllLogs ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                    )}
                >
                    Agent
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllLogs(true)}
                    className={cn(
                        "h-6 px-3 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                        showAllLogs ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                    )}
                >
                    Global
                </Button>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPaused(!isPaused)} 
                className="size-7 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
                {isPaused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5 fill-current" />}
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearLogs}
                className="size-7 rounded-md hover:bg-white/5 text-white/40 hover:text-destructive transition-colors"
            >
                <Trash2 className="size-3.5" />
            </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-7 font-mono text-[11px] sm:text-[13px] leading-[1.6] custom-scrollbar selection:bg-primary/30"
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
             <div className="relative">
                <Cpu className="size-12 text-primary" strokeWidth={1.5} />
                <div className="absolute inset-0 size-12 bg-primary/20 blur-xl animate-pulse rounded-full" />
             </div>
             <div className="text-center space-y-1">
                <p className="text-white text-xs font-black uppercase tracking-[0.4em]">Listening Mode Output</p>
                <p className="text-white/60 text-[10px] max-w-[240px] leading-relaxed">
                    {showAllLogs ? "正在建立与网关日志流的连接..." : `正在监听代理 ${agentId} 的实时交互记录。`}
                </p>
             </div>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => {
               // Simple syntax highlighting
               let color = "text-white/70";
               if (log.includes("ERROR") || log.includes("Error") || log.includes("fail")) color = "text-red-400 font-bold";
               if (log.includes("WARN")) color = "text-amber-300";
               if (log.includes("LLM") || log.includes("Chat") || log.includes("←")) color = "text-emerald-400";
               if (log.includes("HTTP") || log.includes("GET") || log.includes("POST")) color = "text-indigo-400";
               
               return (
                 <div key={i} className={cn("break-all border-l-2 border-transparent hover:border-white/10 hover:bg-white/[0.03] px-2.5 -mx-2.5 py-0.5 transition-all group", color)}>
                   <span className="opacity-20 mr-3 text-[10px] group-hover:opacity-60">{i + 1}</span>
                   {log}
                 </div>
               );
            })}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="h-8 px-4 flex items-center justify-between bg-[#1A1A1E]/50 text-[9px] uppercase tracking-tighter text-white/30 font-bold border-t border-white/5">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
                <div className={cn("size-1.5 rounded-full animate-pulse", isPaused ? "bg-amber-500" : "bg-emerald-500")} />
                {isPaused ? "Paused" : "Live Streaming"}
            </span>
            <span>Buffered: {logs.length} Lines</span>
         </div>
         <div className="flex items-center gap-1 opacity-50 cursor-pointer hover:opacity-100 italic transition-opacity">
            <Download className="size-2.5" />
            Export Log
         </div>
      </div>
    </div>
  );
}
