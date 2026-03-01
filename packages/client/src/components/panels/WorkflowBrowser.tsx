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
    const firstStep = workflow.steps[0];
    if (!firstStep) return;

    const promptInput = prompt(`Enter input for "${workflow.name}":`);
    if (!promptInput) return;

    await api.runWorkflow(workflow.id, { input: promptInput });
    onClose();
  };

  const handleDelete = async (id: string) => {
    await api.deleteWorkflow(id);
    setWorkflows((w) => w.filter((wf) => wf.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Workflow Templates</h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Close</button>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
        ) : workflows.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No workflow templates yet.</p>
        ) : (
          <div className="space-y-3">
            {workflows.map((w) => (
              <div key={w.id} className="rounded-lg p-3" style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{w.name}</h3>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{w.steps.length} steps</span>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>{w.description}</p>

                {/* Step visualization */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {w.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-1">
                      <span className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                        {step.role}
                      </span>
                      {i < w.steps.length - 1 && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{'\u2192'}</span>}
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
                    className="px-3 py-1 text-xs rounded-md transition-colors"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
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
