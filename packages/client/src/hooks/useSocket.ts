import { useEffect, useRef } from 'react';
import { socket } from '../lib/socket.js';
import { useAgentStore } from '../stores/agent-store.js';
import { useTaskStore } from '../stores/task-store.js';
import { useActivityStore } from '../stores/activity-store.js';
import { useStreamStore } from '../stores/stream-store.js';

/** Connects Socket.io events to Zustand stores. Call once at app root. */
export function useSocket() {
  const connected = useRef(false);
  const addAgent = useAgentStore((s) => s.addAgent);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const removeAgent = useAgentStore((s) => s.removeAgent);
  const setAgentStatus = useAgentStore((s) => s.setStatus);
  const addTask = useTaskStore((s) => s.addTask);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const addActivity = useActivityStore((s) => s.addEntry);
  const appendChunk = useStreamStore((s) => s.appendChunk);
  const clearStream = useStreamStore((s) => s.clearStream);

  useEffect(() => {
    if (connected.current) return;
    connected.current = true;

    // Agent events
    socket.on('agent:registered', ({ agent }) => {
      addAgent(agent);
      addActivity({ type: 'agent', message: `Agent "${agent.name}" registered`, agentId: agent.id });
    });

    socket.on('agent:updated', ({ agent }) => {
      updateAgent(agent);
    });

    socket.on('agent:removed', ({ agentId }) => {
      removeAgent(agentId);
      addActivity({ type: 'agent', message: `Agent removed`, agentId });
    });

    socket.on('agent:status-changed', ({ agentId, status }) => {
      setAgentStatus(agentId, status);
      if (status === 'working' || status === 'error') {
        addActivity({ type: 'agent', message: `Agent status → ${status}`, agentId });
      }
    });

    // Task events
    socket.on('task:created', ({ task }) => {
      addTask(task);
      addActivity({ type: 'task', message: `Task "${task.title}" created`, taskId: task.id });
    });

    socket.on('task:assigned', ({ taskId, agentId }) => {
      addActivity({ type: 'task', message: `Task assigned`, taskId, agentId });
      // Refresh tasks to get updated status
      fetchTasks();
    });

    socket.on('task:progress', ({ taskId, chunk }) => {
      appendChunk(taskId, chunk);
    });

    socket.on('task:completed', ({ taskId }) => {
      clearStream(taskId);
      addActivity({ type: 'task', message: `Task completed`, taskId });
      fetchTasks();
    });

    socket.on('task:failed', ({ taskId, error }) => {
      clearStream(taskId);
      addActivity({ type: 'error', message: `Task failed: ${error}`, taskId });
      fetchTasks();
    });

    socket.on('task:approval-needed', ({ taskId }) => {
      addActivity({ type: 'approval', message: `Task awaiting approval`, taskId });
      fetchTasks();
    });

    // Message events
    socket.on('message:sent', ({ message }) => {
      addActivity({ type: 'message', message: `Agent message: ${message.type}`, agentId: message.fromAgentId, taskId: message.taskId ?? undefined });
    });

    // Decision events
    socket.on('decision:proposed', ({ decision }) => {
      addActivity({ type: 'decision', message: `Decision proposed: "${decision.title}"` });
    });

    return () => {
      socket.removeAllListeners();
      connected.current = false;
    };
  }, []);
}
