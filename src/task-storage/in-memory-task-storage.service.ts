import type { Task, TaskId } from '../task';
import type { TaskQuery, TaskStorage } from './task-storage.types';

export class InMemoryTaskStorage implements TaskStorage {
  public static createInstance(): InMemoryTaskStorage {
    return new InMemoryTaskStorage();
  }

  private readonly tasks = new Map<TaskId, Task>();

  public create(task: Task): Promise<Task> {
    this.tasks.set(task.id, structuredClone(task));
    return Promise.resolve(structuredClone(task));
  }

  public findById(id: TaskId): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    return Promise.resolve(task === undefined ? undefined : structuredClone(task));
  }

  public update(id: TaskId, patch: Partial<Task>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (existing === undefined) {
      return Promise.resolve(undefined);
    }
    const updated: Task = { ...existing, ...patch };
    this.tasks.set(id, structuredClone(updated));
    return Promise.resolve(structuredClone(updated));
  }

  public delete(id: TaskId): Promise<boolean> {
    return Promise.resolve(this.tasks.delete(id));
  }

  public list(query?: TaskQuery): Promise<Task[]> {
    let results = [...this.tasks.values()];

    if (query?.status !== undefined) {
      const statuses = query.status;
      results = results.filter((task) => statuses.includes(task.status));
    }
    if (query?.assignee !== undefined) {
      const assignee = query.assignee;
      results = results.filter((task) => task.assignees.includes(assignee));
    }
    if (query?.tag !== undefined) {
      const tag = query.tag;
      results = results.filter((task) => task.tags.includes(tag));
    }

    return Promise.resolve(results.map((task) => structuredClone(task)));
  }
}
