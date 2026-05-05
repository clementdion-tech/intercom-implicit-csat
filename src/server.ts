import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import rateLimit from 'express-rate-limit';
import { analyticsRouter } from './analytics/router';
import { canvasRouter } from './canvas/server';
import { initWebSocket } from './websocket/live-feed';
import { startScheduler } from './batch/scheduler';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000');

// Middleware
app.use(cors({
  origin: process.env.DASHBOARD_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH'],
}));
app.use(express.json({ limit: '2mb' }));

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Routes
app.use('/api', analyticsRouter);
app.use('/canvas', canvasRouter);

// Intercom webhook receiver
app.post('/api/webhook/intercom', async (req, res) => {
  const topic = req.body?.topic as string;

  // We handle conversation-level events
  if (!topic?.startsWith('conversation')) {
    return res.sendStatus(200);
  }

  const conversationId = req.body?.data?.item?.id as string;
  if (!conversationId) return res.sendStatus(200);

  // Trigger async analysis (non-blocking)
  import('./batch/processor').then(({ runBatch }) => {
    runBatch({ conversationId }).catch(console.error);
  });

  res.sendStatus(200);
});

// Health check (also used by UptimeRobot)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Create HTTP server (shared with WebSocket)
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start scheduled batch processor
startScheduler();

server.listen(PORT, () => {
  console.log(`\n🚀 Implicit CSAT API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Dashboard API: http://localhost:${PORT}/api/dashboard/overview`);
  console.log(`   Canvas: http://localhost:${PORT}/canvas/initialize`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws/live\n`);
});

export { app, server };
