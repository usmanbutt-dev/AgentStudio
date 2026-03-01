import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AgentCanvas } from './components/canvas/AgentCanvas.js';
import { Toolbar } from './components/toolbar/Toolbar.js';
import { ActivityLog } from './components/panels/ActivityLog.js';
import { AgentInspector } from './components/panels/AgentInspector.js';
import { TaskInspector } from './components/panels/TaskInspector.js';
import { ApprovalGate } from './components/panels/ApprovalGate.js';
import { useSocket } from './hooks/useSocket.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useAgentStore } from './stores/agent-store.js';
import { useTaskStore } from './stores/task-store.js';

export default function App() {
  const [showActivityLog, setShowActivityLog] = useState(true);
  const fetchAgents = useAgentStore((s) => s.fetchAgents);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const selectedTaskId = useTaskStore((s) => s.selectedTaskId);

  // Connect socket events to stores
  useSocket();
  useKeyboardShortcuts();

  // Load initial data
  useEffect(() => {
    fetchAgents();
    fetchTasks();
  }, [fetchAgents, fetchTasks]);

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col">
        {/* Toolbar */}
        <Toolbar showActivityLog={showActivityLog} onToggleActivityLog={() => setShowActivityLog(!showActivityLog)} />

        {/* Main area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative">
            <AgentCanvas />
          </div>

          {/* Right sidebar — show either Agent or Task inspector */}
          {selectedAgentId && <AgentInspector />}
          {selectedTaskId && !selectedAgentId && <TaskInspector />}
        </div>

        {/* Activity Log (bottom panel) */}
        {showActivityLog && (
          <div className="h-40 shrink-0">
            <ActivityLog />
          </div>
        )}

        {/* Approval modal — shows when any task needs approval */}
        <ApprovalGate />
      </div>
    </ReactFlowProvider>
  );
}
