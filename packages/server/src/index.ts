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
import { blackboard } from './core/blackboard.js';
import './core/workflow-engine.js'; // Initialize workflow event listeners
import { handleMcpPost, handleMcpGet, handleMcpDelete } from './mcp/mcp-server.js';
import { createLogger } from './utils/logger.js';

const log = createLogger('Server');
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

// MCP Streamable HTTP endpoint
app.post('/mcp', (req, res) => handleMcpPost(req, res, req.body));
app.get('/mcp', (req, res) => handleMcpGet(req, res));
app.delete('/mcp', (req, res) => handleMcpDelete(req, res));

// HTTP server + Socket.io
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

setupSocketHandlers(io);

// Seed default data
seedDefaults();

// Start orchestrator & blackboard cleanup
orchestrator.start();
blackboard.startCleanup();

// Start server
httpServer.listen(PORT, () => {
  log.info(`AgentStudio server running on http://localhost:${PORT}`);
  log.info('API:    http://localhost:' + PORT + '/api');
  log.info('MCP:    http://localhost:' + PORT + '/mcp');
  log.info('Socket: ws://localhost:' + PORT);
});
