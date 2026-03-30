"use client";

import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, Save, RefreshCw, ChevronRight, 
  Settings, Zap, Brain, MessageSquare,
  Cpu, Activity, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentConfigEditorProps {
  agentId: string;
}

export function AgentConfigEditor({ agentId }: AgentConfigEditorProps) {
  const { client, connected } = useGateway();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFiles = async () => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const res = await client.request("agents.files.list", { agentId });
      setFiles(res.files || []);
      
      // Select AGENT.md by default
      const defaultFile = res.files?.find((f: any) => f.name === "AGENT.md")?.name 
                       || res.files?.[0]?.name;
      if (defaultFile && !selectedFile) {
        setSelectedFile(defaultFile);
      }
    } catch (err: any) {
      toast({
        title: "无法获取文件列表",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async (fileName: string) => {
    if (!client || !connected) return;
    setLoading(true);
    try {
      const res = await client.request("agents.files.get", { agentId, name: fileName });
      setContent(res.file?.content || "");
      setOriginalContent(res.file?.content || "");
    } catch (err: any) {
      toast({
        title: "无法读取文件",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client || !connected || !selectedFile) return;
    setSaving(true);
    try {
      await client.request("agents.files.set", { 
        agentId, 
        name: selectedFile, 
        content 
      });
      setOriginalContent(content);
      toast({
        title: "保存成功",
        description: `${selectedFile} 已更新。`,
      });
    } catch (err: any) {
      toast({
        title: "保存失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [agentId, client, connected]);

  useEffect(() => {
    if (selectedFile) {
      fetchContent(selectedFile);
    }
  }, [selectedFile, agentId]);

  const isChanged = content !== originalContent;

  const getFileIcon = (name: string) => {
    if (name.includes("AGENT")) return <Brain className="size-4" />;
    if (name.includes("SOUL")) return <Activity className="size-4" />;
    if (name.includes("TOOLS")) return <Settings className="size-4" />;
    if (name.includes("USER")) return <MessageSquare className="size-4" />;
    return <FileText className="size-4" />;
  };

  const getFileCNName = (name: string) => {
    const mapping: Record<string, string> = {
      "AGENT.md": "行为准则",
      "AGENTS.md": "行为准则",
      "SOUL.md": "性格灵魂",
      "TOOLS.md": "工具能力",
      "IDENTITY.md": "身份信息",
      "USER.md": "用户画像",
      "HEARTBEAT.md": "状态监控",
      "MEMORY.md": "长期记忆",
    };
    return mapping[name] || name;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 sm:gap-6">
      {/* File List Side Bar */}
      <div className="w-full lg:w-48 xl:w-56 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden p-1 custom-scrollbar shrink-0">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => setSelectedFile(file.name)}
            className={cn(
              "flex-1 lg:flex-none flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left group",
              selectedFile === file.name
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            <div className={cn(
                "p-1.5 rounded-lg shrink-0",
                selectedFile === file.name ? "bg-primary/20" : "bg-muted/80 opacity-60"
            )}>
                {getFileIcon(file.name)}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] sm:text-[13px] font-bold truncate tracking-tight">{getFileCNName(file.name)}</span>
                <span className="text-[8px] sm:text-[9px] opacity-40 font-mono truncate uppercase">{file.name}</span>
            </div>
            <ChevronRight className={cn(
                "size-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block",
                selectedFile === file.name && "opacity-100 text-primary"
            )} />
          </button>
        ))}
      </div>

      {/* Editor Main Area */}
      <Card className="flex-1 border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-[400px] rounded-xl sm:rounded-2xl relative shadow-inner">
        <div className="p-3 sm:p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-background border border-border/50 text-primary">
                {selectedFile && getFileIcon(selectedFile)}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase opacity-80">{selectedFile ? getFileCNName(selectedFile) : "未选择文件"}</span>
                <span className="text-[8px] opacity-40 font-mono">{selectedFile}</span>
            </div>
            {isChanged && (
               <span className="size-2 rounded-full bg-orange-500 animate-pulse ml-1" title="未保存内容" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => selectedFile && fetchContent(selectedFile)} 
                disabled={loading || !selectedFile}
                className="h-8 sm:h-9 rounded-lg px-2 sm:px-3 text-[10px] sm:text-xs font-bold gap-2"
            >
              <RefreshCw className={cn("size-3.5 sm:size-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">重新加载</span>
            </Button>
            <Button 
                size="sm" 
                disabled={!isChanged || saving || !selectedFile} 
                onClick={handleSave}
                className="h-8 sm:h-9 rounded-lg px-3 sm:px-5 text-[10px] sm:text-xs font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {saving ? <RefreshCw className="size-3.5 sm:size-4 animate-spin" /> : <Save className="size-3.5 sm:size-4" />}
              <span>保存修改</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 relative group">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="absolute inset-0 w-full h-full p-4 sm:p-8 resize-none bg-transparent border-none focus-visible:ring-0 font-mono text-[11px] sm:text-sm leading-relaxed custom-scrollbar selection:bg-primary/20 focus:outline-none"
            placeholder={loading ? "加载中..." : "开始编辑您的代理配置..."}
            spellCheck={false}
          />
          {loading && (
             <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">同步数据中...</p>
                </div>
             </div>
          )}
        </div>
        
        <div className="px-4 h-8 border-t border-border/20 flex items-center justify-between bg-muted/10">
            <div className="flex items-center gap-4 text-[9px] sm:text-[10px] font-medium text-muted-foreground/60">
                <span className="uppercase">Markdown Mode</span>
                <span>{content.length} 字符</span>
                <span>{content.split('\n').length} 行</span>
            </div>
            {saving && <span className="text-[9px] uppercase font-black text-primary animate-pulse tracking-widest">SAVING...</span>}
        </div>
      </Card>
    </div>
  );
}
