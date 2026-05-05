import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

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

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws/live' });

  wss.on('connection', (ws: WebSocket) => {
    ws.send(JSON.stringify({ type: 'connected', message: 'Live feed connected' }));

    ws.on('error', err => {
      console.error('WebSocket client error:', err);
    });
  });

  console.log('WebSocket live feed initialized at /ws/live');
}

export function broadcast(event: LiveFeedEvent): void {
  if (!wss) return;

  const payload = JSON.stringify({ type: 'conversation_scored', data: event });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
