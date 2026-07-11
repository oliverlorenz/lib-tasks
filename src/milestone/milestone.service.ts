import type { Milestone, MilestoneId, MilestoneStorage } from './milestone.types';

export type CreateMilestoneInput = Omit<Milestone, 'id'>;

export class MilestoneService {
  public static createInstance(storage: MilestoneStorage): MilestoneService {
    return new MilestoneService(storage);
  }

  constructor(private readonly storage: MilestoneStorage) {}

  public async createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
    const milestone: Milestone = {
      ...input,
      id: crypto.randomUUID(),
    };
    return this.storage.create(milestone);
  }

  public async getMilestoneById(id: MilestoneId): Promise<Milestone | undefined> {
    return this.storage.findById(id);
  }

  public async getMilestoneByIdOrFail(id: MilestoneId): Promise<Milestone> {
    const milestone = await this.getMilestoneById(id);
    if (milestone === undefined) {
      throw new Error(`Failed to get milestone: no milestone found with id "${id}"`);
    }
    return milestone;
  }

  public async updateMilestone(
    id: MilestoneId,
    patch: Partial<Milestone>,
  ): Promise<Milestone | undefined> {
    return this.storage.update(id, patch);
  }

  public async updateMilestoneOrFail(
    id: MilestoneId,
    patch: Partial<Milestone>,
  ): Promise<Milestone> {
    const updated = await this.updateMilestone(id, patch);
    if (updated === undefined) {
      throw new Error(`Failed to update milestone: no milestone found with id "${id}"`);
    }
    return updated;
  }

  public async deleteMilestone(id: MilestoneId): Promise<boolean> {
    return this.storage.delete(id);
  }

  public async deleteMilestoneOrFail(id: MilestoneId): Promise<void> {
    const deleted = await this.deleteMilestone(id);
    if (!deleted) {
      throw new Error(`Failed to delete milestone: no milestone found with id "${id}"`);
    }
  }

  public async listMilestones(): Promise<Milestone[]> {
    return this.storage.list();
  }
}
