import type { EpicId } from '../epic';
import type { MilestoneId } from '../milestone';
import type { Task, TaskId, TaskStatus } from '../task';

export type TaskQuery = {
  status?: TaskStatus[];
  assignee?: string;
  tag?: string;
  parentId?: TaskId;
  dependsOnTaskId?: TaskId;
  epicId?: EpicId;
  milestoneId?: MilestoneId;
};

export interface TaskStorage {
  create(task: Task): Promise<Task>;
  findById(id: TaskId): Promise<Task | undefined>;
  update(id: TaskId, patch: Partial<Task>): Promise<Task | undefined>;
  delete(id: TaskId): Promise<boolean>;
  list(query?: TaskQuery): Promise<Task[]>;
}
