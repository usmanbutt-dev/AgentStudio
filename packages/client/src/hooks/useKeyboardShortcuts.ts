import { useEffect } from 'react';
import { useAgentStore } from '../stores/agent-store.js';
import { useUIStore } from '../stores/ui-store.js';
import { api } from '../lib/api.js';

/**
 * Global keyboard shortcuts:
 * - Delete/Backspace: Remove selected agent
 * - Escape: Deselect all / close modals
 * - Ctrl+N: New task
 * - Ctrl+A: Add agent (when not in input)
 */
export function useKeyboardShortcuts() {
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // Ctrl/Cmd shortcuts work even in inputs
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            useUIStore.getState().setShowNewTask(true);
            return;
          case 'a':
            if (!isInput) {
              e.preventDefault();
              useUIStore.getState().setShowAddAgent(true);
            }
            return;
        }
      }

      if (isInput) return;

      switch (e.key) {
        case 'Escape': {
          const ui = useUIStore.getState();
          if (ui.showAddAgent || ui.showNewTask || ui.showWorkflows || ui.showSettings) {
            ui.setShowAddAgent(false);
            ui.setShowNewTask(false);
            ui.setShowWorkflows(false);
            ui.setShowSettings(false);
          } else {
            selectAgent(null);
          }
          break;
        }

        case 'Delete':
        case 'Backspace':
          if (selectedAgentId) {
            api.deleteAgent(selectedAgentId);
            selectAgent(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedAgentId, selectAgent]);
}
