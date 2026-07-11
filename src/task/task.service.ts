import type { TaskQuery, TaskStorage } from '../task-storage';
import type { Task, TaskId } from './task.types';

export type CreateTaskInput = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'dependencies' | 'important' | 'urgent'
> & {
  dependencies?: Task['dependencies'];
  important?: Task['important'];
  urgent?: Task['urgent'];
};

export class TaskService {
  public static createInstance(storage: TaskStorage): TaskService {
    return new TaskService(storage);
  }

  constructor(private readonly storage: TaskStorage) {}

  public async createTask(input: CreateTaskInput): Promise<Task> {
    this.assertValidPriority(input.priority);
    const now = new Date();
    const task: Task = {
      ...input,
      dependencies: input.dependencies ?? [],
      important: input.important ?? false,
      urgent: input.urgent ?? false,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    return this.storage.create(task);
  }

  public async getTaskById(id: TaskId): Promise<Task | undefined> {
    return this.storage.findById(id);
  }

  public async getTaskByIdOrFail(id: TaskId): Promise<Task> {
    const task = await this.getTaskById(id);
    if (task === undefined) {
      throw new Error(`Failed to get task: no task found with id "${id}"`);
    }
    return task;
  }

  public async updateTask(id: TaskId, patch: Partial<Task>): Promise<Task | undefined> {
    if (patch.priority !== undefined) {
      this.assertValidPriority(patch.priority);
    }
    return this.storage.update(id, { ...patch, updatedAt: new Date() });
  }

  public async updateTaskOrFail(id: TaskId, patch: Partial<Task>): Promise<Task> {
    const updated = await this.updateTask(id, patch);
    if (updated === undefined) {
      throw new Error(`Failed to update task: no task found with id "${id}"`);
    }
    return updated;
  }

  public async deleteTask(id: TaskId): Promise<boolean> {
    return this.storage.delete(id);
  }

  public async deleteTaskOrFail(id: TaskId): Promise<void> {
    const deleted = await this.deleteTask(id);
    if (!deleted) {
      throw new Error(`Failed to delete task: no task found with id "${id}"`);
    }
  }

  public async listTasks(query?: TaskQuery): Promise<Task[]> {
    return this.storage.list(query);
  }

  public async listSubtasks(parentId: TaskId): Promise<Task[]> {
    return this.listTasks({ parentId });
  }

  public async startTaskOrFail(id: TaskId): Promise<Task> {
    await this.assertPredecessorsDone(id);
    return this.updateTaskOrFail(id, { status: 'in_progress' });
  }

  public async completeTaskOrFail(id: TaskId): Promise<Task> {
    await this.assertPredecessorsDone(id);
    return this.updateTaskOrFail(id, { status: 'done', completedAt: new Date() });
  }

  public async resolveChain(taskId: TaskId): Promise<Task[]> {
    const visited = new Set<TaskId>();
    const chain: Task[] = [];

    const walkBackward = async (id: TaskId): Promise<void> => {
      if (visited.has(id)) {
        return;
      }
      visited.add(id);
      const task = await this.getTaskByIdOrFail(id);
      for (const dependency of task.dependencies) {
        if (dependency.type === 'finish_to_start') {
          await walkBackward(dependency.taskId);
        }
      }
      chain.push(task);
    };

    const walkForward = async (id: TaskId): Promise<void> => {
      const successors = await this.listTasks({ dependsOnTaskId: id });
      for (const successor of successors) {
        if (visited.has(successor.id)) {
          continue;
        }
        visited.add(successor.id);
        chain.push(successor);
        await walkForward(successor.id);
      }
    };

    await walkBackward(taskId);
    await walkForward(taskId);

    return chain;
  }

  private assertValidPriority(priority: Task['priority']): void {
    if (!Number.isInteger(priority) || priority < 1) {
      throw new Error(
        `Invalid priority "${priority}": must be a positive integer (1 = highest priority)`,
      );
    }
  }

  private async assertPredecessorsDone(id: TaskId): Promise<void> {
    const task = await this.getTaskByIdOrFail(id);
    for (const dependency of task.dependencies) {
      if (dependency.type !== 'finish_to_start') {
        continue;
      }
      const predecessor = await this.getTaskByIdOrFail(dependency.taskId);
      if (predecessor.status !== 'done') {
        throw new Error(
          `Cannot start task "${task.title}" (${task.id}): predecessor "${predecessor.title}" (${predecessor.id}) is not done yet`,
        );
      }
    }
  }
}
