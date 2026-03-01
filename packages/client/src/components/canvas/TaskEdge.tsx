import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

const STATUS_COLORS: Record<string, string> = {
  in_progress: '#3B82F6',
  completed: '#22C55E',
  failed: '#EF4444',
  pending: '#6B7280',
  assigned: '#A855F7',
  awaiting_approval: '#F59E0B',
  queued: '#6B7280',
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'Running',
  completed: 'Done',
  failed: 'Failed',
  pending: 'Pending',
  assigned: 'Assigned',
  awaiting_approval: 'Awaiting',
  queued: 'Queued',
};

export function TaskEdge(props: EdgeProps & { data?: { status?: string; label?: string } }) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const status = data?.status ?? 'pending';
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const isActive = status === 'in_progress';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      {/* Glow effect for active edges */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.15}
          className="animate-pulse"
        />
      )}

      {/* Main edge */}
      <BaseEdge
        {...props}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 2.5 : 1.5,
          strokeDasharray: status === 'pending' ? '5 5' : undefined,
        }}
      />

      {/* Animated dot for active tasks */}
      {isActive && (
        <circle r="3.5" fill={color}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none px-2 py-0.5 rounded-md text-[10px] font-medium border"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              backgroundColor: 'var(--color-surface-elevated)',
              borderColor: color + '40',
              color,
            }}
          >
            {data.label}
            <span className="ml-1.5 opacity-60">{STATUS_LABELS[status]}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
