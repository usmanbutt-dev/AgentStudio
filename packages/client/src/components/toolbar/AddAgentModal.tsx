import { useState } from 'react';
import {
  agentRoles, providers,
  ROLE_LABELS, PROVIDER_LABELS, DEFAULT_MODELS, DEFAULT_SYSTEM_PROMPTS,
} from '@agent-studio/shared';
import type { AgentRole, Provider } from '@agent-studio/shared';
import { api } from '../../lib/api.js';

interface Props {
  onClose: () => void;
}

export function AddAgentModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('coder');
  const [provider, setProvider] = useState<Provider>('claude');
  const [model, setModel] = useState(DEFAULT_MODELS.claude);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsApiKey = provider === 'claude' || provider === 'openai' || provider === 'gemini';
  const needsBaseUrl = provider === 'ollama' || provider === 'lmstudio' || provider === 'custom';

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModel(DEFAULT_MODELS[p]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await api.createAgent({
        name: name.trim(),
        role,
        provider,
        model,
        config: {
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
          systemPrompt: DEFAULT_SYSTEM_PROMPTS[role],
          temperature: 0.7,
          maxTokens: 4096,
          tools: [],
        },
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Add Agent</h2>

        {/* Name */}
        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Claude Architect"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </label>

        {/* Provider */}
        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Provider</span>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as Provider)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {providers.map((p) => (
              <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
            ))}
          </select>
        </label>

        {/* Model */}
        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Model</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </label>

        {/* Role */}
        <label className="block mb-3">
          <span className="text-xs text-gray-400 mb-1 block">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AgentRole)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {agentRoles.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </label>

        {/* API Key */}
        {needsApiKey && (
          <label className="block mb-3">
            <span className="text-xs text-gray-400 mb-1 block">API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </label>
        )}

        {/* Base URL */}
        {needsBaseUrl && (
          <label className="block mb-3">
            <span className="text-xs text-gray-400 mb-1 block">Base URL</span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434/v1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </label>
        )}

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Add Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
