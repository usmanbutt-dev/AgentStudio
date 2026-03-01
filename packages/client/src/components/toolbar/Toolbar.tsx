import { AddAgentModal } from './AddAgentModal.js';
import { NewTaskModal } from './NewTaskModal.js';
import { WorkflowBrowser } from '../panels/WorkflowBrowser.js';
import { SettingsPage } from '../settings/SettingsPage.js';
import { useAgentStore } from '../../stores/agent-store.js';
import { useTaskStore } from '../../stores/task-store.js';
import { useThemeStore } from '../../stores/theme-store.js';
import { useUIStore } from '../../stores/ui-store.js';

interface ToolbarProps {
  showActivityLog: boolean;
  onToggleActivityLog: () => void;
}

export function Toolbar({ showActivityLog, onToggleActivityLog }: ToolbarProps) {
  const showAddAgent = useUIStore((s) => s.showAddAgent);
  const showNewTask = useUIStore((s) => s.showNewTask);
  const showWorkflows = useUIStore((s) => s.showWorkflows);
  const showSettings = useUIStore((s) => s.showSettings);
  const setShowAddAgent = useUIStore((s) => s.setShowAddAgent);
  const setShowNewTask = useUIStore((s) => s.setShowNewTask);
  const setShowWorkflows = useUIStore((s) => s.setShowWorkflows);
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  const agentCount = useAgentStore((s) => s.agents.length);
  const activeTasks = useTaskStore((s) => s.tasks.filter((t) => t.status === 'in_progress').length);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <>
      <div className="h-12 backdrop-blur flex items-center px-4 gap-2 shrink-0" style={{ background: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold text-white">A</div>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>AgentStudio</span>
        </div>

        <div className="w-px h-6" style={{ background: 'var(--color-border)' }} />

        {/* Actions */}
        <button
          onClick={() => setShowAddAgent(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          title="Add Agent (Ctrl+A)"
        >
          + Agent
        </button>

        <button
          onClick={() => setShowNewTask(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text)' }}
          title="New Task (Ctrl+N)"
        >
          + Task
        </button>

        <button
          onClick={() => setShowWorkflows(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text)' }}
        >
          Workflows
        </button>

        <div className="w-px h-6" style={{ background: 'var(--color-border)' }} />

        {/* Status indicators */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
          onClick={toggleTheme}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text-secondary)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        <button
          onClick={onToggleActivityLog}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            showActivityLog ? 'bg-gray-600 text-white' : ''
          }`}
          style={!showActivityLog ? { background: 'var(--color-surface-secondary)', color: 'var(--color-text-muted)' } : undefined}
        >
          Activity
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{ background: 'var(--color-surface-secondary)', color: 'var(--color-text-muted)' }}
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
