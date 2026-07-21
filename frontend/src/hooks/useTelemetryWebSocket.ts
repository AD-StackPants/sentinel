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

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setIsConnected(true);
      console.log('Telemetry WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (e) {
        console.error('Error parsing telemetry data:', e);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log('Telemetry WebSocket disconnected. Reconnecting...');
      setTimeout(connect, 3000); // Reconnect
    };

    socket.onerror = (error) => {
      console.error('Telemetry WebSocket error:', error);
      socket.close();
    };

    ws.current = socket;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { telemetry, isConnected };
};
