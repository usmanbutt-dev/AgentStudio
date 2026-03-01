import { create } from 'zustand';
import type { Agent } from '@agent-studio/shared';
import { api } from '../lib/api.js';

interface AgentStore {
  agents: Agent[];
  selectedAgentId: string | null;
  loading: boolean;

  fetchAgents: () => Promise<void>;
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  setStatus: (agentId: string, status: Agent['status']) => void;
  selectAgent: (agentId: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  selectedAgentId: null,
  loading: false,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const agents = await api.getAgents();
      set({ agents });
    } finally {
      set({ loading: false });
    }
  },

  addAgent: (agent) => {
    set((s) => ({ agents: [...s.agents, agent] }));
  },

  updateAgent: (agent) => {
    set((s) => ({
      agents: s.agents.map((a) => (a.id === agent.id ? agent : a)),
    }));
  },

  removeAgent: (agentId) => {
    set((s) => ({
      agents: s.agents.filter((a) => a.id !== agentId),
      selectedAgentId: s.selectedAgentId === agentId ? null : s.selectedAgentId,
    }));
  },

  setStatus: (agentId, status) => {
    set((s) => ({
      agents: s.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
    }));
  },

  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
}));
