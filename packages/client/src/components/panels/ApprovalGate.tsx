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
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-yellow-400">Approval Required</h2>
          </div>
          <h3 className="text-base font-semibold text-gray-100">{task.title}</h3>
          {assignee && (
            <p className="text-xs text-gray-400 mt-1">Completed by {assignee.name}</p>
          )}
        </div>

        {/* Task prompt */}
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-xs text-gray-500">Prompt</span>
          <div className="text-xs text-gray-300 bg-gray-800/50 rounded-lg p-2 mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap">
            {task.input.prompt}
          </div>
        </div>

        {/* Agent output */}
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          <span className="text-xs text-gray-500">Agent Output</span>
          <div className="text-sm text-gray-200 bg-gray-800/50 rounded-lg p-3 mt-1 whitespace-pre-wrap font-mono leading-relaxed">
            {output}
          </div>
        </div>

        {/* Token usage */}
        {task.output.tokenUsage.input > 0 && (
          <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-4 text-xs text-gray-500">
            <span>Tokens: {(task.output.tokenUsage.input + task.output.tokenUsage.output).toLocaleString()}</span>
            <span>Cost: ${task.output.cost.toFixed(4)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
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
