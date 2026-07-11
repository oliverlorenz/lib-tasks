export type { Task, TaskId, TaskStatus, TaskPriority, TaskScheduleType } from './task';
export type { TaskQuery, TaskStorage } from './task-storage';

// Placeholder, kept until the first runtime domain (TaskService, #9) replaces it — the build,
// lint, and test tooling need at least one runtime export/test to run against.
export function placeholder(): string {
  return 'replace-me';
}
