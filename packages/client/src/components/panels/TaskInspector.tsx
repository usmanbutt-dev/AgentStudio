import { useTaskStore } from '../../stores/task-store.js';
import { useAgentStore } from '../../stores/agent-store.js';
import { useStreamStore } from '../../stores/stream-store.js';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gray-400 bg-gray-400/10',
  queued: 'text-gray-400 bg-gray-400/10',
  assigned: 'text-purple-400 bg-purple-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  awaiting_approval: 'text-yellow-400 bg-yellow-400/10',
  completed: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export function TaskInspector() {
  const selectedId = useTaskStore((s) => s.selectedTaskId);
  const tasks = useTaskStore((s) => s.tasks);
  const selectTask = useTaskStore((s) => s.selectTask);
  const agents = useAgentStore((s) => s.agents);
  const streams = useStreamStore((s) => s.streams);

  const task = tasks.find((t) => t.id === selectedId);
  if (!task) return null;

  const assignee = task.assigneeId ? agents.find((a) => a.id === task.assigneeId) : null;
  const streamOutput = streams[task.id];
  const statusStyle = STATUS_COLORS[task.status] ?? STATUS_COLORS.pending;
  const priorityStyle = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;

  return (
    <div className="w-80 bg-gray-900/80 backdrop-blur border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-100 truncate pr-2">{task.title}</h3>
          <button onClick={() => selectTask(null)} className="text-gray-500 hover:text-gray-300 text-xs shrink-0">Close</button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>
            {task.status.replace(/_/g, ' ')}
          </span>
          <span className={`text-xs font-medium ${priorityStyle}`}>{task.priority}</span>
          <span className="text-xs text-gray-500">{task.type}</span>
        </div>
      </div>

      {/* Assignee */}
      {assignee && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-xs text-gray-500">Assigned to</span>
          <p className="text-sm text-gray-200">{assignee.name}</p>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-xs text-gray-500">Description</span>
          <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Input prompt */}
      <div className="px-4 py-3 border-b border-gray-800">
        <span className="text-xs text-gray-500">Prompt</span>
        <div className="text-xs text-gray-300 bg-gray-800/50 rounded-lg p-2 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
          {task.input.prompt}
        </div>
      </div>

      {/* Live streaming output */}
      {streamOutput && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-blue-400">Live Output</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="text-xs text-gray-300 bg-gray-800/50 rounded-lg p-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
            {streamOutput}
          </div>
        </div>
      )}

      {/* Completed output */}
      {task.output.result && task.status === 'completed' && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-xs text-green-400">Output</span>
          <div className="text-xs text-gray-300 bg-gray-800/50 rounded-lg p-2 mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
            {task.output.result}
          </div>
        </div>
      )}

      {/* Token usage & cost */}
      {(task.output.tokenUsage.input > 0 || task.output.tokenUsage.output > 0) && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-xs text-gray-500">Usage</span>
          <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
            <div className="bg-gray-800/50 rounded p-1.5 text-center">
              <div className="text-gray-500">In</div>
              <div className="text-gray-200">{task.output.tokenUsage.input.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/50 rounded p-1.5 text-center">
              <div className="text-gray-500">Out</div>
              <div className="text-gray-200">{task.output.tokenUsage.output.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/50 rounded p-1.5 text-center">
              <div className="text-gray-500">Cost</div>
              <div className="text-gray-200">${task.output.cost.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="px-4 py-3 text-xs text-gray-500 space-y-1">
        <div>Created: {new Date(task.createdAt).toLocaleTimeString()}</div>
        {task.startedAt && <div>Started: {new Date(task.startedAt).toLocaleTimeString()}</div>}
        {task.completedAt && <div>Finished: {new Date(task.completedAt).toLocaleTimeString()}</div>}
      </div>
    </div>
  );
}
