export type EpicId = string;

export type EpicStatus = 'open' | 'closed';

export type Epic = {
  id: EpicId;
  title: string;
  description?: string;
  color?: string;
  startDate?: Date;
  targetDate?: Date;
  status: EpicStatus;
};

export interface EpicStorage {
  create(epic: Epic): Promise<Epic>;
  findById(id: EpicId): Promise<Epic | undefined>;
  update(id: EpicId, patch: Partial<Epic>): Promise<Epic | undefined>;
  delete(id: EpicId): Promise<boolean>;
  list(): Promise<Epic[]>;
}
