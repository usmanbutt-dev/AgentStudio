import { useAgentStore } from '../../stores/agent-store.js';
import { ROLE_COLORS, ROLE_LABELS, PROVIDER_LABELS } from '@agent-studio/shared';
import { api } from '../../lib/api.js';

export function AgentInspector() {
  const selectedId = useAgentStore((s) => s.selectedAgentId);
  const agents = useAgentStore((s) => s.agents);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const agent = agents.find((a) => a.id === selectedId);

  if (!agent) return null;

  const roleColor = ROLE_COLORS[agent.role] ?? '#6B7280';

  const handleDelete = async () => {
    await api.deleteAgent(agent.id);
    selectAgent(null);
  };

  return (
    <div className="w-72 backdrop-blur flex flex-col shrink-0 overflow-y-auto" style={{ background: 'var(--color-surface-elevated)', borderLeft: '1px solid var(--color-border)' }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{agent.name}</h3>
          <button onClick={() => selectAgent(null)} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Close</button>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: roleColor + '20', color: roleColor }}
          >
            {ROLE_LABELS[agent.role]}
          </span>
          <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>{agent.status}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3 text-xs">
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Provider</span>
          <p style={{ color: 'var(--color-text)' }}>{PROVIDER_LABELS[agent.provider]}</p>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Model</span>
          <p style={{ color: 'var(--color-text)' }}>{agent.model}</p>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Temperature</span>
          <p style={{ color: 'var(--color-text)' }}>{agent.config.temperature}</p>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>Max Tokens</span>
          <p style={{ color: 'var(--color-text)' }}>{agent.config.maxTokens.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <h4 className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-secondary)' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Tasks Done</div>
            <div className="font-medium" style={{ color: 'var(--color-text)' }}>{agent.stats.tasksCompleted}</div>
          </div>
          <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-secondary)' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Total Cost</div>
            <div className="font-medium" style={{ color: 'var(--color-text)' }}>${agent.stats.totalCost.toFixed(4)}</div>
          </div>
          <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-secondary)' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Tokens Used</div>
            <div className="font-medium" style={{ color: 'var(--color-text)' }}>{agent.stats.totalTokensUsed.toLocaleString()}</div>
          </div>
          <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-secondary)' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Avg Response</div>
            <div className="font-medium" style={{ color: 'var(--color-text)' }}>{agent.stats.avgResponseTime > 0 ? `${(agent.stats.avgResponseTime / 1000).toFixed(1)}s` : '\u2014'}</div>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>System Prompt</h4>
        <p className="text-xs rounded-lg p-2 max-h-32 overflow-y-auto whitespace-pre-wrap" style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text)' }}>
          {agent.config.systemPrompt}
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 mt-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleDelete}
          className="w-full px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
        >
          Remove Agent
        </button>
      </div>
    </div>
  );
}
