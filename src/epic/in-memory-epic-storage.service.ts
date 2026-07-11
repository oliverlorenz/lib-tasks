import type { Epic, EpicId, EpicStorage } from './epic.types';

export class InMemoryEpicStorage implements EpicStorage {
  public static createInstance(): InMemoryEpicStorage {
    return new InMemoryEpicStorage();
  }

  private readonly epics = new Map<EpicId, Epic>();

  public create(epic: Epic): Promise<Epic> {
    this.epics.set(epic.id, structuredClone(epic));
    return Promise.resolve(structuredClone(epic));
  }

  public findById(id: EpicId): Promise<Epic | undefined> {
    const epic = this.epics.get(id);
    return Promise.resolve(epic === undefined ? undefined : structuredClone(epic));
  }

  public update(id: EpicId, patch: Partial<Epic>): Promise<Epic | undefined> {
    const existing = this.epics.get(id);
    if (existing === undefined) {
      return Promise.resolve(undefined);
    }
    const updated: Epic = { ...existing, ...patch };
    this.epics.set(id, structuredClone(updated));
    return Promise.resolve(structuredClone(updated));
  }

  public delete(id: EpicId): Promise<boolean> {
    return Promise.resolve(this.epics.delete(id));
  }

  public list(): Promise<Epic[]> {
    return Promise.resolve([...this.epics.values()].map((epic) => structuredClone(epic)));
  }
}
