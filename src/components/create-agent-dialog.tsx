"use client";

import { useEffect, useState } from "react";
import { useGateway } from "@/context/gateway-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateAgentDialog({ open, onOpenChange, onCreated }: CreateAgentDialogProps) {
  const { client } = useGateway();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    agentId: "",
  });

  // Auto-generate agentId from name
  useEffect(() => {
    if (formData.name && !formData.agentId) {
       setFormData(prev => ({ ...prev, agentId: formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') }));
    }
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);
    try {
      await client.request("agents.create", {
        name: formData.name,
      });
      toast({
        title: "代理创建成功",
        description: `代理 ${formData.name} 已成功初始化工作空间。`,
      });
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "创建失败",
        description: err.message || "请求 agents.create 失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border/40 p-0 overflow-hidden bg-background">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">创建新代理</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                为您的工作流创建一个专属的智能计算单元。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-60">代理名称</Label>
                <Input
                  id="name"
                  placeholder="例如: CodeHelper"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl h-11 border-border/40 bg-muted/20"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t border-border/20 flex gap-3">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-2xl h-11 font-semibold"
            >
              取消
            </Button>
            <Button 
                type="submit" 
                disabled={loading || !formData.name}
                className="flex-1 rounded-2xl h-11 font-bold shadow-lg shadow-primary/20"
            >
              {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
              立即创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { RefreshCw } from "lucide-react";
