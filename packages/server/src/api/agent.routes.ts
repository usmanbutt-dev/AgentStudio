import { Router } from 'express';
import { CreateAgentSchema } from '@agent-studio/shared';
import { agentRegistry } from '../core/agent-registry.js';
import { adapterManager } from '../core/adapter-manager.js';

export const agentRouter = Router();

// GET /api/agents — list all agents
agentRouter.get('/', (_req, res) => {
  const agents = agentRegistry.getAll();
  res.json(agents);
});

// GET /api/agents/:id — get single agent
agentRouter.get('/:id', (req, res) => {
  const agent = agentRegistry.getById(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// POST /api/agents — create agent
agentRouter.post('/', (req, res) => {
  const parsed = CreateAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const agent = agentRegistry.register(parsed.data);
  res.status(201).json(agent);
});

// PATCH /api/agents/:id — update agent
agentRouter.patch('/:id', (req, res) => {
  const agent = agentRegistry.update(req.params.id, req.body);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// DELETE /api/agents/:id — remove agent and adapter
agentRouter.delete('/:id', (req, res) => {
  const removed = agentRegistry.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Agent not found' });
  adapterManager.remove(req.params.id);
  res.status(204).send();
});

// POST /api/agents/:id/test — test agent connection
agentRouter.post('/:id/test', async (req, res) => {
  const agent = agentRegistry.getById(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  try {
    const success = await adapterManager.testConnection(agent);
    if (success) {
      agentRegistry.setStatus(agent.id, 'idle');
      res.json({ success: true, message: 'Connection successful' });
    } else {
      agentRegistry.setStatus(agent.id, 'error');
      res.json({ success: false, message: 'Connection failed' });
    }
  } catch (err) {
    agentRegistry.setStatus(agent.id, 'error');
    res.json({ success: false, message: err instanceof Error ? err.message : 'Connection failed' });
  }
});
