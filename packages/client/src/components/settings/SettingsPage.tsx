import { useState } from 'react';
import { PROVIDER_LABELS, type Provider } from '@agent-studio/shared';

interface Props {
  onClose: () => void;
}

const API_KEY_FIELDS: { provider: Provider; envVar: string; placeholder: string }[] = [
  { provider: 'claude', envVar: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...' },
  { provider: 'openai', envVar: 'OPENAI_API_KEY', placeholder: 'sk-...' },
  { provider: 'gemini', envVar: 'GOOGLE_AI_API_KEY', placeholder: 'AI...' },
];

export function SettingsPage({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'about'>('general');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">Close</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'general' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'about' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-200 mb-2">API Keys</h3>
                <p className="text-xs text-gray-500 mb-3">
                  API keys are configured per-agent when you add them. They're stored locally in the SQLite database.
                  You can also set them as environment variables in your .env file.
                </p>
                {API_KEY_FIELDS.map(({ provider, envVar, placeholder }) => (
                  <div key={provider} className="mb-2">
                    <label className="text-xs text-gray-400 block mb-1">
                      {PROVIDER_LABELS[provider]} ({envVar})
                    </label>
                    <input
                      type="password"
                      placeholder={placeholder}
                      disabled
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-500 cursor-not-allowed"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-2">
                  Environment variables are read-only here. Edit your .env file to set defaults.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-200 mb-2">Local LLM Endpoints</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <span className="text-gray-300">Ollama:</span> http://localhost:11434/v1
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <span className="text-gray-300">LM Studio:</span> http://localhost:1234/v1
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3 text-xs text-gray-400">
              <h3 className="text-sm font-medium text-gray-200">AgentStudio v0.1.0</h3>
              <p>A spatial mission-control dashboard for orchestrating multiple AI agents visually.</p>
              <p>Open source under the MIT License.</p>
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
                <div><span className="text-gray-300">Frontend:</span> React, React Flow, Tailwind, Zustand</div>
                <div><span className="text-gray-300">Backend:</span> Node.js, Express, Socket.io, Drizzle, SQLite</div>
                <div><span className="text-gray-300">AI SDKs:</span> Anthropic, OpenAI, Google GenAI</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
