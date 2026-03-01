import { useActivityStore, type ActivityEntry } from '../../stores/activity-store.js';

const TYPE_COLORS: Record<string, string> = {
  agent: 'text-blue-400',
  task: 'text-green-400',
  message: 'text-purple-400',
  decision: 'text-yellow-400',
  approval: 'text-orange-400',
  error: 'text-red-400',
};

function EntryRow({ entry }: { entry: ActivityEntry }) {
  const time = entry.timestamp.slice(11, 19);
  const color = TYPE_COLORS[entry.type] ?? 'text-gray-400';

  return (
    <div className="flex items-start gap-2 px-3 py-1 text-xs" style={{ color: 'var(--color-text)' }}>
      <span className="shrink-0 font-mono" style={{ color: 'var(--color-text-muted)' }}>{time}</span>
      <span className={`shrink-0 uppercase font-medium w-16 ${color}`}>{entry.type}</span>
      <span>{entry.message}</span>
    </div>
  );
}

export function ActivityLog() {
  const entries = useActivityStore((s) => s.entries);
  const clear = useActivityStore((s) => s.clear);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-surface-elevated)', borderTop: '1px solid var(--color-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Activity Log</span>
        <button onClick={clear} className="text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Clear</button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No activity yet. Add agents and create tasks to get started.
          </div>
        ) : (
          entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
