import { useState } from 'react';
import { taskTypes, taskPriorities } from '@agent-studio/shared';
import type { TaskType, TaskPriority } from '@agent-studio/shared';
import { useAgentStore } from '../../stores/agent-store.js';
import { api } from '../../lib/api.js';

interface Props {
  onClose: () => void;
}

export function NewTaskModal({ onClose }: Props) {
  const agents = useAgentStore((s) => s.agents);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('code');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !prompt.trim()) {
      setError('Title and prompt are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        assigneeId: assigneeId || null,
        input: { prompt: prompt.trim(), context: [] },
        approvalRequired,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">New Task</h2>

        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Implement auth middleware"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
        </label>

        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none" />
        </label>

        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Prompt (what the agent should do)</span>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Write the code for..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none" />
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label>
            <span className="text-xs text-gray-400 mb-1 block">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as TaskType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
              {taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span className="text-xs text-gray-400 mb-1 block">Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
              {taskPriorities.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>

        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Assign to Agent (optional)</span>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
            <option value="">Auto-assign</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
          </select>
        </label>

        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input type="checkbox" checked={approvalRequired} onChange={(e) => setApprovalRequired(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-300">Require approval before continuing</span>
        </label>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
