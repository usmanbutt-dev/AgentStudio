import { Router } from 'express';
import { agentRouter } from './agent.routes.js';
import { taskRouter } from './task.routes.js';
import { workflowRouter } from './workflow.routes.js';
import { decisionRouter } from './decision.routes.js';
import { messageRouter } from './message.routes.js';
import { statsRouter } from './stats.routes.js';
import { settingsRouter } from './settings.routes.js';

export const apiRouter = Router();

apiRouter.use('/agents', agentRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/workflows', workflowRouter);
apiRouter.use('/decisions', decisionRouter);
apiRouter.use('/messages', messageRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/settings', settingsRouter);

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
