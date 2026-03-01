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
    <div className="flex items-start gap-2 px-3 py-1 hover:bg-gray-800/50 text-xs">
      <span className="text-gray-500 shrink-0 font-mono">{time}</span>
      <span className={`shrink-0 uppercase font-medium w-16 ${color}`}>{entry.type}</span>
      <span className="text-gray-300">{entry.message}</span>
    </div>
  );
}

export function ActivityLog() {
  const entries = useActivityStore((s) => s.entries);
  const clear = useActivityStore((s) => s.clear);

  return (
    <div className="h-full flex flex-col bg-gray-900/80 border-t border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400">Activity Log</span>
        <button onClick={clear} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Clear</button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-600">
            No activity yet. Add agents and create tasks to get started.
          </div>
        ) : (
          entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
