import type { Epic, EpicId, EpicStorage } from './epic.types';

export type CreateEpicInput = Omit<Epic, 'id'>;

export class EpicService {
  public static createInstance(storage: EpicStorage): EpicService {
    return new EpicService(storage);
  }

  constructor(private readonly storage: EpicStorage) {}

  public async createEpic(input: CreateEpicInput): Promise<Epic> {
    const epic: Epic = {
      ...input,
      id: crypto.randomUUID(),
    };
    return this.storage.create(epic);
  }

  public async getEpicById(id: EpicId): Promise<Epic | undefined> {
    return this.storage.findById(id);
  }

  public async getEpicByIdOrFail(id: EpicId): Promise<Epic> {
    const epic = await this.getEpicById(id);
    if (epic === undefined) {
      throw new Error(`Failed to get epic: no epic found with id "${id}"`);
    }
    return epic;
  }

  public async updateEpic(id: EpicId, patch: Partial<Epic>): Promise<Epic | undefined> {
    return this.storage.update(id, patch);
  }

  public async updateEpicOrFail(id: EpicId, patch: Partial<Epic>): Promise<Epic> {
    const updated = await this.updateEpic(id, patch);
    if (updated === undefined) {
      throw new Error(`Failed to update epic: no epic found with id "${id}"`);
    }
    return updated;
  }

  public async deleteEpic(id: EpicId): Promise<boolean> {
    return this.storage.delete(id);
  }

  public async deleteEpicOrFail(id: EpicId): Promise<void> {
    const deleted = await this.deleteEpic(id);
    if (!deleted) {
      throw new Error(`Failed to delete epic: no epic found with id "${id}"`);
    }
  }

  public async listEpics(): Promise<Epic[]> {
    return this.storage.list();
  }
}
