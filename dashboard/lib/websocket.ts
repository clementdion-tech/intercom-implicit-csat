'use client';

import { useEffect, useRef, useState } from 'react';

export interface LiveFeedEvent {
  intercomId: string;
  scorePct: number;
  label: string;
  emoji: string;
  language: string;
  style: string;
  churnRisk: string;
  arc: string;
  keySignal: string;
  analyzedAt: string;
}

export function useLiveFeed(maxItems = 20) {
  const [events, setEvents] = useState<LiveFeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/live';

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000); // Reconnect after 3s
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'conversation_scored' && msg.data) {
            setEvents(prev => [msg.data as LiveFeedEvent, ...prev].slice(0, maxItems));
          }
        } catch {}
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, [maxItems]);

  return { events, connected };
}
