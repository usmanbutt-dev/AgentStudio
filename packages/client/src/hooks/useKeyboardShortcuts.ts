import { useEffect } from 'react';
import { useAgentStore } from '../stores/agent-store.js';
import { api } from '../lib/api.js';

/**
 * Global keyboard shortcuts:
 * - Delete/Backspace: Remove selected agent
 * - Escape: Deselect all
 */
export function useKeyboardShortcuts() {
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      switch (e.key) {
        case 'Escape':
          selectAgent(null);
          break;

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
