import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  status: text('status').notNull().default('offline'),
  config: text('config', { mode: 'json' }).notNull(),       // AgentConfig as JSON
  stats: text('stats', { mode: 'json' }).notNull(),          // AgentStats as JSON
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('medium'),
  assigneeId: text('assignee_id').references(() => agents.id),
  workflowId: text('workflow_id'),
  dependencies: text('dependencies', { mode: 'json' }).notNull().default('[]'),  // string[]
  input: text('input', { mode: 'json' }).notNull(),          // TaskInput
  output: text('output', { mode: 'json' }).notNull(),        // TaskOutput
  approvalRequired: integer('approval_required', { mode: 'boolean' }).notNull().default(false),
  maxRetries: integer('max_retries').notNull().default(2),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  fromAgentId: text('from_agent_id').notNull().references(() => agents.id),
  toAgentId: text('to_agent_id').references(() => agents.id),
  taskId: text('task_id').references(() => tasks.id),
  type: text('type').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  timestamp: text('timestamp').notNull(),
});

export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  reasoning: text('reasoning').notNull(),
  proposedBy: text('proposed_by').notNull().references(() => agents.id),
  approvedBy: text('approved_by'),
  status: text('status').notNull().default('proposed'),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),  // string[]
  taskId: text('task_id').references(() => tasks.id),
  createdAt: text('created_at').notNull(),
});

export const blackboardEntries = sqliteTable('blackboard_entries', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  value: text('value', { mode: 'json' }).notNull(),
  agentId: text('agent_id').references(() => agents.id),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const workflowTemplates = sqliteTable('workflow_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  steps: text('steps', { mode: 'json' }).notNull(),  // WorkflowStepTemplate[]
  createdAt: text('created_at').notNull(),
});

export const workflowRuns = sqliteTable('workflow_runs', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => workflowTemplates.id),
  status: text('status').notNull().default('running'),
  currentStepId: text('current_step_id'),
  taskIds: text('task_ids', { mode: 'json' }).notNull().default('[]'),
  variables: text('variables', { mode: 'json' }).notNull().default('{}'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
});
