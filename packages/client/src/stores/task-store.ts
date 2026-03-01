import { create } from 'zustand';
import type { Task } from '@agent-studio/shared';
import { api } from '../lib/api.js';

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;

  fetchTasks: () => Promise<void>;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  selectTask: (taskId: string | null) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  selectedTaskId: null,
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await api.getTasks();
      set({ tasks });
    } finally {
      set({ loading: false });
    }
  },

  addTask: (task) => {
    set((s) => ({ tasks: [task, ...s.tasks] }));
  },

  updateTask: (task) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  },

  removeTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
      selectedTaskId: s.selectedTaskId === taskId ? null : s.selectedTaskId,
    }));
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),
}));
