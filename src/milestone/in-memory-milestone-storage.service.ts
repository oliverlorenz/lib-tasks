import type { Milestone, MilestoneId, MilestoneStorage } from './milestone.types';

export class InMemoryMilestoneStorage implements MilestoneStorage {
  public static createInstance(): InMemoryMilestoneStorage {
    return new InMemoryMilestoneStorage();
  }

  private readonly milestones = new Map<MilestoneId, Milestone>();

  public create(milestone: Milestone): Promise<Milestone> {
    this.milestones.set(milestone.id, structuredClone(milestone));
    return Promise.resolve(structuredClone(milestone));
  }

  public findById(id: MilestoneId): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    return Promise.resolve(milestone === undefined ? undefined : structuredClone(milestone));
  }

  public update(id: MilestoneId, patch: Partial<Milestone>): Promise<Milestone | undefined> {
    const existing = this.milestones.get(id);
    if (existing === undefined) {
      return Promise.resolve(undefined);
    }
    const updated: Milestone = { ...existing, ...patch };
    this.milestones.set(id, structuredClone(updated));
    return Promise.resolve(structuredClone(updated));
  }

  public delete(id: MilestoneId): Promise<boolean> {
    return Promise.resolve(this.milestones.delete(id));
  }

  public list(): Promise<Milestone[]> {
    return Promise.resolve(
      [...this.milestones.values()].map((milestone) => structuredClone(milestone)),
    );
  }
}
