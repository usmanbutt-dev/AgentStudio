import { create } from 'zustand';

export interface ActivityEntry {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  agentId?: string;
  taskId?: string;
}

interface ActivityStore {
  entries: ActivityEntry[];
  maxEntries: number;
  addEntry: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;
  clear: () => void;
}

let counter = 0;

export const useActivityStore = create<ActivityStore>((set) => ({
  entries: [],
  maxEntries: 500,

  addEntry: (entry) => {
    const full: ActivityEntry = {
      ...entry,
      id: `activity-${++counter}`,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      entries: [full, ...s.entries].slice(0, s.maxEntries),
    }));
  },

  clear: () => set({ entries: [] }),
}));
