import type { TaskQuery, TaskStorage } from '../task-storage';
import type { Task, TaskId } from './task.types';

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export class TaskService {
  public static createInstance(storage: TaskStorage): TaskService {
    return new TaskService(storage);
  }

  constructor(private readonly storage: TaskStorage) {}

  public async createTask(input: CreateTaskInput): Promise<Task> {
    const now = new Date();
    const task: Task = {
      ...input,
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
}
