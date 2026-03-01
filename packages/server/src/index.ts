import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@agent-studio/shared';
import { apiRouter } from './api/routes.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { seedDefaults } from './db/seed.js';
import { orchestrator } from './core/orchestrator.js';
import './core/workflow-engine.js'; // Initialize workflow event listeners
import { createLogger } from './utils/logger.js';

const log = createLogger('Server');
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

// HTTP server + Socket.io
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

setupSocketHandlers(io);

// Seed default data
seedDefaults();

// Start orchestrator
orchestrator.start();

// Start server
httpServer.listen(PORT, () => {
  log.info(`AgentStudio server running on http://localhost:${PORT}`);
  log.info('API:    http://localhost:' + PORT + '/api');
  log.info('Socket: ws://localhost:' + PORT);
});
