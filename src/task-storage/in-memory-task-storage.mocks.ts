import type { Task } from '../task';

export const mockTask: Task = {
  id: 'task-1',
  title: 'Mock Task',
  status: 'todo',
  priority: 1,
  important: false,
  urgent: false,
  postponeCount: 0,
  tags: [],
  assignees: [],
  dependencies: [],
  scheduleType: 'flexible',
  progress: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
