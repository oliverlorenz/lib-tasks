export type TaskId = string;

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';

// Integer, 1 = highest priority, ascending = lower. Open-ended so consumers can use coarse
// 4-tier scales or finer numeric scales alike, see docs/concept.md.
export type TaskPriority = number;

export type TaskScheduleType = 'fixed' | 'flexible';

export type TaskDependencyType =
  'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export type TaskDependency = {
  taskId: TaskId;
  type: TaskDependencyType;
  lagDays?: number;
};

export type Task = {
  id: TaskId;
  title: string;
  description?: string;

  status: TaskStatus;
  priority: TaskPriority;
  important: boolean;
  urgent: boolean;
  postponeCount: number;

  tags: string[];
  assignees: string[];

  parentId?: TaskId;
  dependencies: TaskDependency[];

  scheduleType: TaskScheduleType;
  startDate?: Date;
  deadline?: Date;
  durationDays?: number;
  setupDurationInMinutes?: number;
  progress: number;

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};
