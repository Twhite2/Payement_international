"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type RealtimeEvent = {
  type: "transaction_update" | "notification";
  payload: Record<string, unknown>;
};

type RealtimeOptions = {
  url?: string;
  onEvent?: (event: RealtimeEvent) => void;
};

export function useRealtime(options: RealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    const wsUrl = options.url || process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);

          if (data.type === "transaction_update") {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
          }

          options.onEvent?.(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        const backoff = Math.min(1000 * 2 ** retryCountRef.current, 30000);
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, backoff);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not available
    }
  }, [options, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
