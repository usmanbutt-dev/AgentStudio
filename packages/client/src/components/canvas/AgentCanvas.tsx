import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  BackgroundVariant,
} from '@xyflow/react';
import { useAgentStore } from '../../stores/agent-store.js';
import { useTaskStore } from '../../stores/task-store.js';
import { AgentNode } from './AgentNode.js';
import { TaskEdge } from './TaskEdge.js';
import { socket } from '../../lib/socket.js';
import { ROLE_COLORS } from '@agent-studio/shared';

const nodeTypes = { agent: AgentNode };
const edgeTypes = { task: TaskEdge };

export function AgentCanvas() {
  const agents = useAgentStore((s) => s.agents);
  const tasks = useTaskStore((s) => s.tasks);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  // Convert agents to React Flow nodes
  const nodes: Node[] = useMemo(() =>
    agents.map((agent) => ({
      id: agent.id,
      type: 'agent',
      position: agent.position,
      data: { agent },
      dragHandle: '.cursor-grab',
    })),
    [agents],
  );

  // Convert tasks with assignees into edges between agents
  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = [];
    for (const task of tasks) {
      if (!task.assigneeId) continue;
      // If task has a fromTaskId, find that task's assignee as the source
      if (task.input.fromTaskId) {
        const sourceTask = tasks.find((t) => t.id === task.input.fromTaskId);
        if (sourceTask?.assigneeId) {
          result.push({
            id: `edge-${task.id}`,
            source: sourceTask.assigneeId,
            target: task.assigneeId,
            type: 'task',
            data: { status: task.status, label: task.title },
            animated: task.status === 'in_progress',
          });
        }
      }
    }
    return result;
  }, [tasks]);

  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);

  // Sync node positions back when dragged
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    for (const change of changes) {
      if (change.type === 'position' && change.position && change.dragging === false) {
        socket.emit('agent:move', {
          agentId: change.id,
          position: change.position,
        });
      }
    }
  }, [onNodesChange]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    selectAgent(node.id);
  }, [selectAgent]);

  const handlePaneClick = useCallback(() => {
    selectAgent(null);
  }, [selectAgent]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
      style={{ background: 'var(--color-surface)' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-dots)" />
      <Controls position="bottom-left" />
      <MiniMap
        position="bottom-right"
        nodeColor={(node) => {
          const agent = agents.find((a) => a.id === node.id);
          return agent ? (ROLE_COLORS[agent.role] ?? '#6B7280') : '#6B7280';
        }}
        maskColor="var(--color-minimap-mask)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
