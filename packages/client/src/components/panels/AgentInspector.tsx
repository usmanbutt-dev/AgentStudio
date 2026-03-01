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
    <div className="w-72 bg-gray-900/80 backdrop-blur border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-100">{agent.name}</h3>
          <button onClick={() => selectAgent(null)} className="text-gray-500 hover:text-gray-300 text-xs">Close</button>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: roleColor + '20', color: roleColor }}
          >
            {ROLE_LABELS[agent.role]}
          </span>
          <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3 text-xs">
        <div>
          <span className="text-gray-500">Provider</span>
          <p className="text-gray-200">{PROVIDER_LABELS[agent.provider]}</p>
        </div>
        <div>
          <span className="text-gray-500">Model</span>
          <p className="text-gray-200">{agent.model}</p>
        </div>
        <div>
          <span className="text-gray-500">Temperature</span>
          <p className="text-gray-200">{agent.config.temperature}</p>
        </div>
        <div>
          <span className="text-gray-500">Max Tokens</span>
          <p className="text-gray-200">{agent.config.maxTokens.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <h4 className="text-xs font-medium text-gray-400">Stats</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-gray-500">Tasks Done</div>
            <div className="text-gray-100 font-medium">{agent.stats.tasksCompleted}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-gray-500">Total Cost</div>
            <div className="text-gray-100 font-medium">${agent.stats.totalCost.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-gray-500">Tokens Used</div>
            <div className="text-gray-100 font-medium">{agent.stats.totalTokensUsed.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-gray-500">Avg Response</div>
            <div className="text-gray-100 font-medium">{agent.stats.avgResponseTime > 0 ? `${(agent.stats.avgResponseTime / 1000).toFixed(1)}s` : '—'}</div>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div className="p-4 border-t border-gray-800">
        <h4 className="text-xs font-medium text-gray-400 mb-2">System Prompt</h4>
        <p className="text-xs text-gray-300 bg-gray-800/50 rounded-lg p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
          {agent.config.systemPrompt}
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-800 mt-auto">
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
