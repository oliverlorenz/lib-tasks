import type { EpicId } from '../epic';

export type MilestoneId = string;

export type MilestoneStatus = 'open' | 'reached' | 'missed';

export type Milestone = {
  id: MilestoneId;
  title: string;
  dueDate: Date;
  epicId?: EpicId;
  status: MilestoneStatus;
};

export interface MilestoneStorage {
  create(milestone: Milestone): Promise<Milestone>;
  findById(id: MilestoneId): Promise<Milestone | undefined>;
  update(id: MilestoneId, patch: Partial<Milestone>): Promise<Milestone | undefined>;
  delete(id: MilestoneId): Promise<boolean>;
  list(): Promise<Milestone[]>;
}
