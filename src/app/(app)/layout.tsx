"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { 
  History, LayoutDashboard, MessageSquare, Radio, 
  Settings, Terminal, Zap, LogOut, ChevronRight,
  Database, Activity, Clock, Bell, Sun, Moon, User, Cpu, Server,
  PanelLeft, PanelLeftClose, SquareTerminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GatewayProvider, useGateway } from "@/context/gateway-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { useProfile } from "@/hooks/use-profile";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GatewayProvider>
      <AppContent>{children}</AppContent>
    </GatewayProvider>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { connected, snapshot } = useGateway();
  const { profile } = useProfile();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auto-close mobile sidebar when navigating
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Initial theme check and mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("openclaw.control.settings.v1");
    sessionStorage.clear();
    toast({ title: "已注销", description: "您已成功退出登录。" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" 
            onClick={() => setMobileSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "border-r border-border/50 bg-background lg:bg-muted/5 flex flex-col h-screen shrink-0 fixed lg:relative z-50 transition-[transform,width] duration-300 ease-in-out lg:translate-x-0 will-change-transform overflow-hidden",
        mobileSidebarOpen ? "translate-x-0 w-72 shadow-2xl lg:shadow-none" : "-translate-x-full w-72 lg:w-auto",
        sidebarCollapsed ? "lg:w-20" : "lg:w-72"
      )}>
        <div className={cn(
          "h-16 border-b border-border/50 bg-background/50 backdrop-blur-md flex items-center shrink-0 transition-all duration-300",
          sidebarCollapsed ? "justify-center p-0" : "justify-between px-6"
        )}>
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
              <div className="size-9 p-0.5 rounded-xl bg-background/5 border border-border/40 flex items-center justify-center hover:scale-105 transition-transform duration-300">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff4d4d"/>
                      <stop offset="100%" stopColor="#991b1b"/>
                    </linearGradient>
                  </defs>
                  <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient)"/>
                  <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient)"/>
                  <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient)"/>
                  <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="45" cy="35" r="6" fill="#050810"/>
                  <circle cx="75" cy="35" r="6" fill="#050810"/>
                  <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
                  <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight uppercase">OpenClaw</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-60">网关控制台</span>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
             <div className="size-10 p-1 rounded-xl bg-background/5 border border-border/40 flex items-center justify-center mx-auto hover:scale-105 transition-transform duration-300 cursor-pointer">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="lobster-gradient-collapsed" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff4d4d"/>
                      <stop offset="100%" stopColor="#991b1b"/>
                    </linearGradient>
                  </defs>
                  <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient-collapsed)"/>
                  <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient-collapsed)"/>
                  <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient-collapsed)"/>
                  <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="45" cy="35" r="6" fill="#050810"/>
                  <circle cx="75" cy="35" r="6" fill="#050810"/>
                  <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
                  <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
                </svg>
             </div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar overflow-x-hidden">
          <SidebarGroup title="聊天" collapsed={sidebarCollapsed}>
            <SidebarItem icon={<MessageSquare className="size-4" />} label="聊天" href="/chat" active={pathname === "/chat"} collapsed={sidebarCollapsed} />
          </SidebarGroup>

          <SidebarGroup title="控制" collapsed={sidebarCollapsed}>
            <SidebarItem icon={<LayoutDashboard className="size-4" />} label="概览" href="/dashboard" active={pathname === "/dashboard"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Radio className="size-4" />} label="频道" href="/channels" active={pathname === "/channels"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Cpu className="size-4" />} label="实例" href="/instances" active={pathname === "/instances"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<MessageSquare className="size-4" />} label="会话" href="/sessions" active={pathname === "/sessions"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Activity className="size-4" />} label="使用情况" href="/usage" active={pathname === "/usage"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Clock className="size-4" />} label="定时任务" href="/tasks" active={pathname === "/tasks"} collapsed={sidebarCollapsed} />
          </SidebarGroup>

          <SidebarGroup title="代理" collapsed={sidebarCollapsed}>
            <SidebarItem icon={<Server className="size-4" />} label="代理" href="/agents" active={pathname === "/agents"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Zap className="size-4" />} label="技能" href="/skills" active={pathname === "/skills"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Database className="size-4" />} label="节点" href="/nodes" active={pathname === "/nodes"} collapsed={sidebarCollapsed} />
          </SidebarGroup>

          <SidebarGroup title="设置" collapsed={sidebarCollapsed}>
            <SidebarItem icon={<Settings className="size-4" />} label="配置" href="/config" active={pathname === "/config"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<Terminal className="size-4" />} label="调试" href="/debug" active={pathname === "/debug"} collapsed={sidebarCollapsed} />
            <SidebarItem icon={<History className="size-4" />} label="日志" href="/logs" active={pathname === "/logs"} collapsed={sidebarCollapsed} />
          </SidebarGroup>
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" className={cn("w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5", sidebarCollapsed && "justify-center px-0")} onClick={handleLogout}>
            <LogOut className="size-4" />
            {!sidebarCollapsed && <span className="font-medium">退出登录</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b border-border/50 flex items-center justify-between px-3 sm:pl-4 sm:pr-8 bg-background/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
             <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="rounded-xl hover:bg-muted shrink-0 hidden lg:flex">
               <PanelLeft className="size-4 text-muted-foreground" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)} className="rounded-xl hover:bg-muted shrink-0 lg:hidden">
               <PanelLeft className="size-4 text-muted-foreground" />
             </Button>
             <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-muted/50 rounded-full text-[9px] sm:text-[11px] font-medium border border-border/50">
               <span className={cn("size-1.5 sm:size-2 rounded-full shrink-0", connected ? "bg-green-500" : "bg-red-500 animate-pulse")} />
               <span className="hidden sm:inline">版本</span> {snapshot?.server?.version || "2026.3.11"}
             </div>
             <div className={cn(
               "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[11px] font-medium border shrink-0",
               connected ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
             )}>
               <span className="hidden sm:inline">健康状况: </span>{connected ? "在线" : "离线"}
             </div>
             
             {/* Portal Target for Dynamic Page Components */}
             <div id="header-context-monitor-portal" className="flex items-center shrink-0" />
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-3 shrink-0">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="rounded-full size-8 sm:size-10 relative">
                   <Bell className="size-3.5 sm:size-4 text-muted-foreground" />
                   {/* notification indicator */}
                   <span className="absolute top-1.5 right-1.5 size-1.5 sm:size-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-72 sm:w-80 p-0 border-border/50 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden mt-1 sm:mt-2">
                 <div className="p-3 sm:p-4 border-b border-border/50 bg-muted/20">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">消息中心</p>
                 </div>
                 <div className="p-6 sm:p-8 text-center bg-background/50 backdrop-blur">
                    <Bell className="size-8 text-muted-foreground/30 mx-auto" strokeWidth={1} />
                    <p className="mt-4 text-xs sm:text-[13px] font-bold text-muted-foreground">暂无新的告警通知</p>
                    <p className="mt-1.5 text-[9px] sm:text-[11px] font-medium text-muted-foreground/40 break-keep">您当前的所有服务均已就绪，节点保持正常运行。</p>
                 </div>
               </DropdownMenuContent>
             </DropdownMenu>

             <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full size-8 sm:size-10 transition-all active:scale-90 group relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div
                      key="moon"
                      initial={{ y: 20, opacity: 0, rotate: -45 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: -20, opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="size-3.5 sm:size-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ y: 20, opacity: 0, rotate: -45 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: -20, opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="size-3.5 sm:size-4 text-orange-500 group-hover:text-amber-500 transition-colors" />
                    </motion.div>
                  )}
                </AnimatePresence>
             </Button>
             <div className="size-px h-4 sm:h-6 bg-border mx-1 sm:mx-1" />
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-8 rounded-full p-0 flex items-center justify-center bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all shrink-0 overflow-hidden">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="size-4 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl border-border/50 shadow-xl" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none tracking-tight">{profile.nickname}</p>
                      <p className="text-xs leading-none text-muted-foreground font-medium opacity-60 truncate">{profile.bio}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem className="rounded-lg gap-3 py-2.5 cursor-pointer font-medium" onClick={() => setProfileOpen(true)}>
                    <User className="size-4 opacity-60" />
                    <span>个人资料</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg gap-3 py-2.5 cursor-pointer font-medium" onClick={() => setSettingsOpen(true)}>
                    <Settings className="size-4 opacity-60" />
                    <span>账户设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem 
                    className="rounded-lg gap-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
      
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function SidebarGroup({ title, children, collapsed = false }: { title: string, children: React.ReactNode, collapsed?: boolean }) {
  return (
    <div className="space-y-2">
      <h3 className={cn(
        "px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] transition-opacity",
        collapsed ? "opacity-0 h-0" : "opacity-100"
      )}>{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({ icon, label, href, active = false, collapsed = false }: { icon: React.ReactNode, label: string, href: string, active?: boolean, collapsed?: boolean }) {
  return (
    <Link href={href} className={cn(
      "group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
      active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/5 text-muted-foreground hover:text-primary",
      collapsed ? "justify-center" : "justify-between"
    )}>
      <div className="flex items-center gap-3">
        {icon}
        {!collapsed && <span className="text-sm font-semibold truncate transition-all">{label}</span>}
      </div>
      {(active && !collapsed) && <ChevronRight className="size-3 opacity-60" />}
    </Link>
  );
}

