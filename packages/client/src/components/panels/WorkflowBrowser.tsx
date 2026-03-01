import { useEffect, useState } from 'react';
import type { WorkflowTemplate } from '@agent-studio/shared';
import { api } from '../../lib/api.js';

interface Props {
  onClose: () => void;
}

export function WorkflowBrowser({ onClose }: Props) {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkflows().then((w) => {
      setWorkflows(w);
      setLoading(false);
    });
  }, []);

  const handleRun = async (workflow: WorkflowTemplate) => {
    // Create the first task in the workflow
    const firstStep = workflow.steps[0];
    if (!firstStep) return;

    const promptInput = prompt(`Enter input for "${workflow.name}":`);
    if (!promptInput) return;

    await api.createTask({
      title: `${workflow.name} — ${firstStep.taskTemplate.type}`,
      description: `Step 1 of workflow: ${workflow.name}`,
      type: firstStep.taskTemplate.type,
      priority: 'medium',
      input: {
        prompt: firstStep.taskTemplate.promptTemplate.replace('{{input}}', promptInput),
        context: [],
      },
      approvalRequired: firstStep.taskTemplate.approvalRequired,
    });

    onClose();
  };

  const handleDelete = async (id: string) => {
    await api.deleteWorkflow(id);
    setWorkflows((w) => w.filter((wf) => wf.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Workflow Templates</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">Close</button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : workflows.length === 0 ? (
          <p className="text-sm text-gray-500">No workflow templates yet.</p>
        ) : (
          <div className="space-y-3">
            {workflows.map((w) => (
              <div key={w.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-100">{w.name}</h3>
                  <span className="text-xs text-gray-500">{w.steps.length} steps</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{w.description}</p>

                {/* Step visualization */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {w.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300 capitalize">
                        {step.role}
                      </span>
                      {i < w.steps.length - 1 && <span className="text-gray-600 text-xs">→</span>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRun(w)}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                  >
                    Run
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
