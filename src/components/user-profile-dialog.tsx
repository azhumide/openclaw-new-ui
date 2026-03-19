"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Camera, Trash2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useEffect } from "react";

export function UserProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, saveProfile } = useProfile();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAvatar(profile.avatar);
      setNickname(profile.nickname);
      setBio(profile.bio);
    }
  }, [open, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>个人资料</DialogTitle>
          <DialogDescription>
            编辑您的公开显示信息。这些信息可能仅保存在本地缓存或网关会话中。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="relative size-24 rounded-full bg-muted flex items-center justify-center border-2 border-border/50 overflow-hidden group cursor-pointer transition-all hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="size-10 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-0" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="size-6 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {avatar && (
              <Button variant="ghost" size="sm" onClick={() => setAvatar(null)} className="h-6 text-xs text-muted-foreground hover:text-destructive">
                 移除头像
              </Button>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nickname" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">显示昵称</Label>
            <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">个性签名</Label>
            <Input id="bio" placeholder="记录网关的点点滴滴..." value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            取消
          </Button>
          <Button type="button" onClick={() => {
            saveProfile({ avatar, nickname, bio });
            onOpenChange(false);
          }} className="rounded-xl">
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
