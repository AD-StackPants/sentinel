import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// Convert http:// to ws:// and https:// to wss://
const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/api/v1/ws/telemetry';

export interface TelemetryData {
  type: string;
  [key: string]: any;
}

export const useTelemetryWebSocket = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<any>(null);
  const isUnmounted = useRef(false);

  const connect = useCallback(() => {
    if (isUnmounted.current) return;
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        if (isUnmounted.current) {
          socket.close();
          return;
        }
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        if (isUnmounted.current) return;
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
        } catch (e) {
          console.error('Error parsing telemetry data:', e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (!isUnmounted.current) {
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      socket.onerror = () => {
        setIsConnected(false);
      };

      ws.current = socket;
    } catch (err) {
      console.error('Failed to initiate WebSocket connection:', err);
    }
  }, []);

  useEffect(() => {
    isUnmounted.current = false;
    connect();

    return () => {
      isUnmounted.current = true;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        const socket = ws.current;
        ws.current = null;
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            try {
              socket.close(1000, 'Component unmounted');
            } catch (_) {}
          };
          socket.onerror = () => {};
        } else if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.close(1000, 'Component unmounted');
          } catch (_) {}
        }
      }
    };
  }, [connect]);

  return { telemetry, isConnected };
};
