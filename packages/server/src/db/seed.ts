import { db, schema } from './index.js';
import { v4 as uuid } from 'uuid';

/** Seed default workflow templates */
export function seedDefaults() {
  const existing = db.select().from(schema.workflowTemplates).all();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const templates = [
    {
      id: uuid(),
      name: 'Code Review Pipeline',
      description: 'Coder writes code, Reviewer checks it. If rejected, cycles back to Coder.',
      steps: [
        {
          id: 'step-code',
          role: 'coder',
          taskTemplate: {
            type: 'code',
            promptTemplate: '{{input}}',
            approvalRequired: false,
          },
          next: ['step-review'],
        },
        {
          id: 'step-review',
          role: 'reviewer',
          taskTemplate: {
            type: 'review',
            promptTemplate: 'Review the following code and provide feedback:\n\n{{previous_output}}',
            approvalRequired: true,
          },
          next: [],
        },
      ],
      createdAt: now,
    },
    {
      id: uuid(),
      name: 'Feature Build',
      description: 'Architect designs → Coder implements → Reviewer verifies.',
      steps: [
        {
          id: 'step-design',
          role: 'architect',
          taskTemplate: {
            type: 'research',
            promptTemplate: 'Design the architecture for: {{input}}',
            approvalRequired: true,
          },
          next: ['step-implement'],
        },
        {
          id: 'step-implement',
          role: 'coder',
          taskTemplate: {
            type: 'code',
            promptTemplate: 'Implement the following design:\n\n{{previous_output}}',
            approvalRequired: false,
          },
          next: ['step-verify'],
        },
        {
          id: 'step-verify',
          role: 'reviewer',
          taskTemplate: {
            type: 'review',
            promptTemplate: 'Review this implementation against the original design:\n\nDesign: {{step_design_output}}\n\nCode: {{previous_output}}',
            approvalRequired: true,
          },
          next: [],
        },
      ],
      createdAt: now,
    },
    {
      id: uuid(),
      name: 'Bug Fix',
      description: 'Debugger analyzes → Coder fixes → Reviewer verifies the fix.',
      steps: [
        {
          id: 'step-analyze',
          role: 'debugger',
          taskTemplate: {
            type: 'debug',
            promptTemplate: 'Analyze this bug and identify the root cause:\n\n{{input}}',
            approvalRequired: false,
          },
          next: ['step-fix'],
        },
        {
          id: 'step-fix',
          role: 'coder',
          taskTemplate: {
            type: 'code',
            promptTemplate: 'Fix the following bug based on this analysis:\n\n{{previous_output}}',
            approvalRequired: false,
          },
          next: ['step-verify-fix'],
        },
        {
          id: 'step-verify-fix',
          role: 'reviewer',
          taskTemplate: {
            type: 'review',
            promptTemplate: 'Verify that this fix correctly addresses the bug:\n\nBug analysis: {{step_analyze_output}}\n\nFix: {{previous_output}}',
            approvalRequired: true,
          },
          next: [],
        },
      ],
      createdAt: now,
    },
  ];

  for (const t of templates) {
    db.insert(schema.workflowTemplates).values({
      id: t.id,
      name: t.name,
      description: t.description,
      steps: t.steps,
      createdAt: t.createdAt,
    }).run();
  }

  console.log(`Seeded ${templates.length} workflow templates`);
}
