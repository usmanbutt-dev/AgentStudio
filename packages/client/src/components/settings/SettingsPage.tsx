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
      <div className="rounded-xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
        style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Settings</h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Close</button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'general' ? 'text-blue-400 border-b-2 border-blue-400' : ''}`}
            style={activeTab !== 'general' ? { color: 'var(--color-text-muted)' } : undefined}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'about' ? 'text-blue-400 border-b-2 border-blue-400' : ''}`}
            style={activeTab !== 'about' ? { color: 'var(--color-text-muted)' } : undefined}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>API Keys</h3>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  API keys are configured per-agent when you add them. They're stored locally in the SQLite database.
                  You can also set them as environment variables in your .env file.
                </p>
                {API_KEY_FIELDS.map(({ provider, envVar, placeholder }) => (
                  <div key={provider} className="mb-2">
                    <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {PROVIDER_LABELS[provider]} ({envVar})
                    </label>
                    <input
                      type="password"
                      placeholder={placeholder}
                      disabled
                      className="w-full px-3 py-1.5 rounded-lg text-xs cursor-not-allowed"
                      style={{ background: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                    />
                  </div>
                ))}
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Environment variables are read-only here. Edit your .env file to set defaults.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Local LLM Endpoints</h3>
                <div className="space-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-secondary)' }}>
                    <span style={{ color: 'var(--color-text)' }}>Ollama:</span> http://localhost:11434/v1
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'var(--color-surface-secondary)' }}>
                    <span style={{ color: 'var(--color-text)' }}>LM Studio:</span> http://localhost:1234/v1
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <h3 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>AgentStudio v0.1.0</h3>
              <p>A spatial mission-control dashboard for orchestrating multiple AI agents visually.</p>
              <p>Open source under the MIT License.</p>
              <div className="rounded-lg p-3 space-y-1" style={{ background: 'var(--color-surface-secondary)' }}>
                <div><span style={{ color: 'var(--color-text)' }}>Frontend:</span> React, React Flow, Tailwind, Zustand</div>
                <div><span style={{ color: 'var(--color-text)' }}>Backend:</span> Node.js, Express, Socket.io, Drizzle, SQLite</div>
                <div><span style={{ color: 'var(--color-text)' }}>AI SDKs:</span> Anthropic, OpenAI, Google GenAI</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
