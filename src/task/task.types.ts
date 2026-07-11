export type TaskId = string;

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';

// Integer, 1 = highest priority, ascending = lower. Open-ended so consumers can use coarse
// 4-tier scales or finer numeric scales alike, see docs/concept.md.
export type TaskPriority = number;

export type TaskScheduleType = 'fixed' | 'flexible';

export type Task = {
  id: TaskId;
  title: string;
  description?: string;

  status: TaskStatus;
  priority: TaskPriority;

  tags: string[];
  assignees: string[];

  parentId?: TaskId;

  scheduleType: TaskScheduleType;

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};
