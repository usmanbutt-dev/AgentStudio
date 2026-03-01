import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Agent } from '@agent-studio/shared';
import { ROLE_COLORS, ROLE_LABELS } from '@agent-studio/shared';
import { useStreamStore } from '../../stores/stream-store.js';
import { useTaskStore } from '../../stores/task-store.js';
import { api } from '../../lib/api.js';

type AgentNodeData = {
  agent: Agent;
};

const STATUS_STYLES: Record<string, string> = {
  idle: 'bg-gray-500',
  working: 'bg-green-500 animate-pulse',
  blocked: 'bg-yellow-500 animate-pulse',
  error: 'bg-red-500',
  offline: 'bg-gray-700',
};

const STATUS_GLOW: Record<string, string> = {
  working: 'shadow-green-500/20 shadow-lg',
  error: 'shadow-red-500/20 shadow-lg',
  blocked: 'shadow-yellow-500/20 shadow-lg',
};

function AgentNodeComponent({ data }: NodeProps & { data: AgentNodeData }) {
  const { agent } = data;
  const roleColor = ROLE_COLORS[agent.role] ?? '#6B7280';
  const statusClass = STATUS_STYLES[agent.status] ?? STATUS_STYLES.offline;
  const glowClass = STATUS_GLOW[agent.status] ?? '';
  const [showMenu, setShowMenu] = useState(false);

  const tasks = useTaskStore((s) => s.tasks);
  const currentTask = tasks.find((t) => t.assigneeId === agent.id && (t.status === 'in_progress' || t.status === 'assigned'));

  const streams = useStreamStore((s) => s.streams);
  const streamOutput = currentTask ? streams[currentTask.id] : undefined;
  const lastLines = streamOutput ? streamOutput.split('\n').slice(-3).join('\n') : '';

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu((v) => !v);
  }, []);

  const handleDelete = useCallback(async () => {
    setShowMenu(false);
    await api.deleteAgent(agent.id);
  }, [agent.id]);

  const handleTest = useCallback(async () => {
    setShowMenu(false);
    await api.testAgent(agent.id);
  }, [agent.id]);

  return (
    <div
      className={`rounded-xl backdrop-blur-sm min-w-[200px] max-w-[280px] overflow-visible cursor-grab active:cursor-grabbing transition-shadow duration-300 ${glowClass}`}
      style={{ borderTopColor: roleColor, borderTopWidth: 3, background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
      onContextMenu={handleContextMenu}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${statusClass} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{agent.name}</div>
          <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{agent.model}</div>
        </div>
      </div>

      {/* Role badge + status */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: roleColor + '20', color: roleColor }}
        >
          {ROLE_LABELS[agent.role]}
        </span>
        <span className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{agent.status}</span>
      </div>

      {/* Current task + streaming output */}
      {currentTask && (
        <div className="px-3 pb-2">
          <div className="text-xs text-blue-400 truncate mb-1">{currentTask.title}</div>
          {lastLines && (
            <div className="text-[10px] rounded p-1.5 font-mono max-h-16 overflow-hidden whitespace-pre-wrap leading-tight"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-secondary)' }}>
              {lastLines}
            </div>
          )}
        </div>
      )}

      {/* Stats footer */}
      <div className="px-3 py-1.5 flex items-center justify-between text-xs" style={{ background: 'var(--color-surface-secondary)', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <span>{agent.stats.tasksCompleted} tasks</span>
        <span>${agent.stats.totalCost.toFixed(4)}</span>
      </div>

      {/* Context menu */}
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-lg shadow-xl py-1 min-w-[140px]" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
          <button onClick={handleTest} className="w-full px-3 py-1.5 text-xs text-left transition-colors" style={{ color: 'var(--color-text)' }}>
            Test Connection
          </button>
          <button onClick={handleDelete} className="w-full px-3 py-1.5 text-xs text-left text-red-400 transition-colors">
            Remove Agent
          </button>
          <button onClick={() => setShowMenu(false)} className="w-full px-3 py-1.5 text-xs text-left transition-colors" style={{ color: 'var(--color-text-muted)' }}>
            Close
          </button>
        </div>
      )}

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-600 !border-gray-500 hover:!bg-blue-500 !transition-colors" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-600 !border-gray-500 hover:!bg-blue-500 !transition-colors" />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
