"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions<T> {
  onMessage?: (data: T) => void;
  reconnectMs?: number;
  maxReconnectMs?: number;
  authToken?: string | undefined;
}

interface UseWebSocketReturn<T> {
  isConnected: boolean;
  lastMessage: T | null;
}

export function useWebSocket<T>(
  url: string,
  options?: UseWebSocketOptions<T>
): UseWebSocketReturn<T> {
  const {
    onMessage,
    reconnectMs = 1000,
    maxReconnectMs = 30000,
    authToken
  } = options ?? {};

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<T | null>(null);

  // refs pra manter valores atuais sem re-render
  const wsRef = useRef<WebSocket | null>(null);
  const delayRef = useRef(reconnectMs);
  const closedByUserRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const fullUrl = authToken
      ? `${url}${url.includes("?") ? "&" : "?"}token=${authToken}`
      : url;

    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      setIsConnected(true);
      // reset backoff ao conectar com sucesso
      delayRef.current = reconnectMs;
    });

    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        setLastMessage(data);
        onMessageRef.current?.(data);
      } catch {
        // payload inválido — ignorar
      }
    });

    ws.addEventListener("close", () => {
      setIsConnected(false);
      wsRef.current = null;

      if (closedByUserRef.current) return;

      // reconexão com backoff exponencial
      const delay = delayRef.current;
      delayRef.current = Math.min(delay * 2, maxReconnectMs);
      setTimeout(connect, delay);
    });

    ws.addEventListener("error", () => {
      // o evento close será disparado em seguida — reconexão tratada lá
      ws.close();
    });
  }, [url, authToken, reconnectMs, maxReconnectMs]);

  useEffect(() => {
    closedByUserRef.current = false;
    connect();

    return () => {
      closedByUserRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
