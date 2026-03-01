import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { WorkflowTemplate, WorkflowRun, Task, TaskOutput } from '@agent-studio/shared';
import { eventBus } from './event-bus.js';
import { blackboard } from './blackboard.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('WorkflowEngine');

const emptyOutput = (): TaskOutput => ({
  result: null,
  artifacts: [],
  tokenUsage: { input: 0, output: 0 },
  cost: 0,
});

class WorkflowEngine {
  constructor() {
    // Listen for task completions to advance workflows
    eventBus.on('task:completed', ({ taskId }) => {
      this.onTaskCompleted(taskId);
    });

    eventBus.on('task:failed', ({ taskId }) => {
      this.onTaskFailed(taskId);
    });
  }

  /** Start a workflow from a template with input variables */
  start(template: WorkflowTemplate, variables: Record<string, string>): WorkflowRun {
    const runId = uuid();
    const now = new Date().toISOString();

    if (template.steps.length === 0) {
      throw new Error('Workflow has no steps');
    }

    const firstStep = template.steps[0];

    // Create the first task
    const taskId = this.createStepTask(runId, template, firstStep.id, variables, null);

    // Create the workflow run
    db.insert(schema.workflowRuns).values({
      id: runId,
      templateId: template.id,
      status: 'running',
      currentStepId: firstStep.id,
      taskIds: [taskId],
      variables,
      createdAt: now,
      completedAt: null,
    }).run();

    log.info(`Workflow "${template.name}" started (run: ${runId})`);

    const run: WorkflowRun = {
      id: runId,
      templateId: template.id,
      status: 'running',
      currentStepId: firstStep.id,
      taskIds: [taskId],
      variables,
      createdAt: now,
      completedAt: null,
    };

    return run;
  }

  /** Create a task for a workflow step */
  private createStepTask(
    runId: string,
    template: WorkflowTemplate,
    stepId: string,
    variables: Record<string, string>,
    previousTaskId: string | null,
  ): string {
    const step = template.steps.find((s) => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in workflow`);

    const taskId = uuid();
    const now = new Date().toISOString();

    // Interpolate the prompt template with variables
    let prompt = step.taskTemplate.promptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replaceAll(`{{${key}}}`, value);
    }

    // Replace {{previous_output}} with actual previous task output
    if (previousTaskId) {
      const prevResult = blackboard.get(`task:${previousTaskId}:result`);
      if (prevResult && typeof prevResult === 'string') {
        prompt = prompt.replaceAll('{{previous_output}}', prevResult);
      }
    }

    // Replace {{step_X_output}} patterns
    const stepOutputPattern = /\{\{step_(\w+)_output\}\}/g;
    prompt = prompt.replaceAll(stepOutputPattern, (_match: string, stepName: string) => {
      // Find the task for that step in this workflow run
      const runRow = db.select().from(schema.workflowRuns).where(eq(schema.workflowRuns.id, runId)).get();
      if (!runRow) return '';
      const taskIds = runRow.taskIds as string[];
      for (const tid of taskIds) {
        const result = blackboard.get(`task:${tid}:result`);
        if (result && typeof result === 'string') {
          // Check if this task belongs to the named step
          const taskRow = db.select().from(schema.tasks).where(eq(schema.tasks.id, tid)).get();
          if (taskRow && taskRow.title.includes(stepName)) {
            return result;
          }
        }
      }
      return '';
    });

    // Create the task
    db.insert(schema.tasks).values({
      id: taskId,
      title: `${template.name} — ${step.role} (${step.taskTemplate.type})`,
      description: `Workflow step: ${stepId}`,
      type: step.taskTemplate.type,
      status: 'pending',
      priority: 'medium',
      assigneeId: null,
      workflowId: runId,
      dependencies: previousTaskId ? [previousTaskId] : [],
      input: { prompt, context: [], fromTaskId: previousTaskId ?? undefined },
      output: emptyOutput(),
      approvalRequired: step.taskTemplate.approvalRequired,
      maxRetries: 2,
      retryCount: 0,
      createdAt: now,
      startedAt: null,
      completedAt: null,
    }).run();

    const taskRow = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get()!;
    eventBus.emit('task:created', {
      task: {
        ...taskRow,
        type: taskRow.type as Task['type'],
        status: taskRow.status as Task['status'],
        priority: taskRow.priority as Task['priority'],
        dependencies: taskRow.dependencies as string[],
        input: taskRow.input as Task['input'],
        output: taskRow.output as TaskOutput,
      } as Task,
    });

    log.info(`Created task for step "${stepId}": ${taskId}`);
    return taskId;
  }

  /** Called when a task completes — advance the workflow */
  private onTaskCompleted(taskId: string) {
    const taskRow = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
    if (!taskRow || !taskRow.workflowId) return;

    const runRow = db.select().from(schema.workflowRuns).where(eq(schema.workflowRuns.id, taskRow.workflowId)).get();
    if (!runRow || runRow.status !== 'running') return;

    const templateRow = db.select().from(schema.workflowTemplates).where(eq(schema.workflowTemplates.id, runRow.templateId)).get();
    if (!templateRow) return;

    const template = {
      ...templateRow,
      steps: templateRow.steps as WorkflowTemplate['steps'],
    };
    const variables = runRow.variables as Record<string, string>;
    const currentStepId = runRow.currentStepId;

    // Find current step
    const currentStep = template.steps.find((s) => s.id === currentStepId);
    if (!currentStep) return;

    // Get next steps
    const nextStepIds = currentStep.next;

    if (nextStepIds.length === 0) {
      // Workflow complete
      db.update(schema.workflowRuns)
        .set({ status: 'completed', completedAt: new Date().toISOString() })
        .where(eq(schema.workflowRuns.id, runRow.id))
        .run();
      log.info(`Workflow run ${runRow.id} completed`);
      return;
    }

    // Create tasks for next steps
    for (const nextStepId of nextStepIds) {
      const newTaskId = this.createStepTask(runRow.id, template, nextStepId, variables, taskId);
      const existingTaskIds = runRow.taskIds as string[];
      db.update(schema.workflowRuns)
        .set({
          currentStepId: nextStepId,
          taskIds: [...existingTaskIds, newTaskId],
        })
        .where(eq(schema.workflowRuns.id, runRow.id))
        .run();
    }
  }

  /** Called when a task fails — mark workflow as failed */
  private onTaskFailed(taskId: string) {
    const taskRow = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
    if (!taskRow || !taskRow.workflowId) return;

    // Check if task exhausted retries
    if (taskRow.retryCount < taskRow.maxRetries) return;

    db.update(schema.workflowRuns)
      .set({ status: 'failed', completedAt: new Date().toISOString() })
      .where(eq(schema.workflowRuns.id, taskRow.workflowId))
      .run();
    log.warn(`Workflow run ${taskRow.workflowId} failed due to task ${taskId}`);
  }
}

export const workflowEngine = new WorkflowEngine();
