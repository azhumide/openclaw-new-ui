"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { GatewayClient, GatewayHelloOk, GatewayEventFrame } from "@/lib/openclaw/gateway-client";

interface GatewayContextType {
  connected: boolean;
  snapshot: any;
  error: string | null;
  presence: any[];
  health: any;
  latency: number | null;
  client: GatewayClient | null;
}

const GatewayContext = createContext<GatewayContextType | undefined>(undefined);

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [presence, setPresence] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const clientRef = useRef<GatewayClient | null>(null);

  useEffect(() => {
    const rawSettings = localStorage.getItem("openclaw.control.settings.v1");
    if (!rawSettings) return;

    try {
        const settings = JSON.parse(rawSettings);
        const token = sessionStorage.getItem("openclaw.control.token.v1") || "";

        console.log("[GatewayProvider] Starting client for", settings.gatewayUrl);

        const client = new GatewayClient({
          url: settings.gatewayUrl,
          token: token,
          onHello: (hello) => {
            console.log("[GatewayProvider] Connected!", hello);
            setConnected(true);
            setError(null);
            setSnapshot({
                ...(hello.payload || hello.snapshot || {}),
                server: hello.server
            }); 
            const sn = hello.payload || hello.snapshot;
            if (sn) {
                if (sn.presence) setPresence(sn.presence);
                if (sn.health) setHealth(sn.health);
            }
          },
          onEvent: (evt) => {
            if (evt.event === "presence") {
                setPresence(evt.payload?.presence || []);
            } else if (evt.event === "health") {
                setHealth(evt.payload?.health || null);
            }
          },
          onClose: (info) => {
            console.warn("[GatewayProvider] Closed", info);
            setConnected(false);
            if (info.code !== 1000) {
                setError(`Disconnected (${info.code}): ${info.reason || "Check your URL/Token"}`);
            }
          },
          onError: (err) => {
            console.warn("[GatewayProvider] Error", err);
            setError(`无法建立连接。请检查网关地址 (${settings.gatewayUrl}) 是否正确，并确认 OpenClaw 服务端已启动。`);
          }
        });

        clientRef.current = client;
        client.start();

        return () => {
          console.log("[GatewayProvider] Stopping client");
          client.stop();
        };
    } catch (e) {
        console.error("Gateway initialization error", e);
        setError("Invalid configuration settings.");
    }
  }, []);

  // 延迟测速循环
  useEffect(() => {
    if (!connected || !clientRef.current) {
        setLatency(null);
        return;
    }

    const measure = async () => {
        if (!clientRef.current || !connected) return;
        const start = Date.now();
        try {
            // 使用简化的 health 请求进行测速
            await clientRef.current.request("health", { probe: false });
            setLatency(Date.now() - start);
        } catch (e) {
            console.debug("[GatewayProvider] Ping failed", e);
        }
    };

    // 初始执行一次
    measure();
    const timer = setInterval(measure, 10000); // 每 10 秒测一次
    return () => clearInterval(timer);
  }, [connected]);

  return (
    <GatewayContext.Provider value={{ connected, snapshot, error, presence, health, latency, client: clientRef.current }}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway() {
  const context = useContext(GatewayContext);
  if (context === undefined) {
    throw new Error("useGateway must be used within a GatewayProvider");
  }
  return context;
}
