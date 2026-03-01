import { useState } from 'react';
import { AddAgentModal } from './AddAgentModal.js';
import { NewTaskModal } from './NewTaskModal.js';
import { WorkflowBrowser } from '../panels/WorkflowBrowser.js';
import { SettingsPage } from '../settings/SettingsPage.js';
import { useAgentStore } from '../../stores/agent-store.js';
import { useTaskStore } from '../../stores/task-store.js';

interface ToolbarProps {
  showActivityLog: boolean;
  onToggleActivityLog: () => void;
}

export function Toolbar({ showActivityLog, onToggleActivityLog }: ToolbarProps) {
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const agentCount = useAgentStore((s) => s.agents.length);
  const activeTasks = useTaskStore((s) => s.tasks.filter((t) => t.status === 'in_progress').length);

  return (
    <>
      <div className="h-12 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center px-4 gap-2 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold">A</div>
          <span className="font-semibold text-sm text-gray-200">AgentStudio</span>
        </div>

        <div className="w-px h-6 bg-gray-700" />

        {/* Actions */}
        <button
          onClick={() => setShowAddAgent(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          + Agent
        </button>

        <button
          onClick={() => setShowNewTask(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        >
          + Task
        </button>

        <button
          onClick={() => setShowWorkflows(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        >
          Workflows
        </button>

        <div className="w-px h-6 bg-gray-700" />

        {/* Status indicators */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>
          {activeTasks > 0 && (
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {activeTasks} running
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Right side buttons */}
        <button
          onClick={onToggleActivityLog}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            showActivityLog ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Activity
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
        >
          Settings
        </button>
      </div>

      {showAddAgent && <AddAgentModal onClose={() => setShowAddAgent(false)} />}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} />}
      {showWorkflows && <WorkflowBrowser onClose={() => setShowWorkflows(false)} />}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </>
  );
}
