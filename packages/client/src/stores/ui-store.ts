import { create } from 'zustand';

interface UIStore {
  showAddAgent: boolean;
  showNewTask: boolean;
  showWorkflows: boolean;
  showSettings: boolean;
  setShowAddAgent: (v: boolean) => void;
  setShowNewTask: (v: boolean) => void;
  setShowWorkflows: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  showAddAgent: false,
  showNewTask: false,
  showWorkflows: false,
  showSettings: false,
  setShowAddAgent: (v) => set({ showAddAgent: v }),
  setShowNewTask: (v) => set({ showNewTask: v }),
  setShowWorkflows: (v) => set({ showWorkflows: v }),
  setShowSettings: (v) => set({ showSettings: v }),
}));
