import { create } from 'zustand';

/** Tracks live streaming output for in-progress tasks */
interface StreamStore {
  /** Map of taskId → accumulated streamed text */
  streams: Record<string, string>;

  appendChunk: (taskId: string, chunk: string) => void;
  clearStream: (taskId: string) => void;
  clearAll: () => void;
}

export const useStreamStore = create<StreamStore>((set) => ({
  streams: {},

  appendChunk: (taskId, chunk) => {
    set((s) => ({
      streams: {
        ...s.streams,
        [taskId]: (s.streams[taskId] ?? '') + chunk,
      },
    }));
  },

  clearStream: (taskId) => {
    set((s) => {
      const { [taskId]: _, ...rest } = s.streams;
      return { streams: rest };
    });
  },

  clearAll: () => set({ streams: {} }),
}));
