import { useTaskStore } from '../../stores/task-store.js';
import { useAgentStore } from '../../stores/agent-store.js';
import { useStreamStore } from '../../stores/stream-store.js';
import { socket } from '../../lib/socket.js';

export function ApprovalGate() {
  const tasks = useTaskStore((s) => s.tasks);
  const agents = useAgentStore((s) => s.agents);
  const streams = useStreamStore((s) => s.streams);

  const pendingApproval = tasks.filter((t) => t.status === 'awaiting_approval');
  if (pendingApproval.length === 0) return null;

  const task = pendingApproval[0];
  const assignee = task.assigneeId ? agents.find((a) => a.id === task.assigneeId) : null;
  const output = task.output.result || streams[task.id] || 'No output';

  const handleApprove = () => {
    socket.emit('task:approve', { taskId: task.id });
  };

  const handleReject = () => {
    socket.emit('task:reject', { taskId: task.id, reason: 'Rejected by user' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
        {/* Header */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-yellow-400">Approval Required</h2>
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{task.title}</h3>
          {assignee && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Completed by {assignee.name}</p>
          )}
        </div>

        {/* Task prompt */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Prompt</span>
          <div className="text-xs rounded-lg p-2 mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-secondary)' }}>
            {task.input.prompt}
          </div>
        </div>

        {/* Agent output */}
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Agent Output</span>
          <div className="text-sm rounded-lg p-3 mt-1 whitespace-pre-wrap font-mono leading-relaxed"
            style={{ color: 'var(--color-text)', background: 'var(--color-surface-secondary)' }}>
            {output}
          </div>
        </div>

        {/* Token usage */}
        {task.output.tokenUsage.input > 0 && (
          <div className="px-4 py-2 flex items-center gap-4 text-xs" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            <span>Tokens: {(task.output.tokenUsage.input + task.output.tokenUsage.output).toLocaleString()}</span>
            <span>Cost: ${task.output.cost.toFixed(4)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleReject}
            className="px-5 py-2 text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="px-5 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
