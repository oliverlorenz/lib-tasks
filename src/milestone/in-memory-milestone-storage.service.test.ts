import { InMemoryMilestoneStorage } from './in-memory-milestone-storage.service';
import { mockMilestone } from './milestone.mocks';

describe('InMemoryMilestoneStorage', () => {
  describe('create', () => {
    test('stores and returns the milestone', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();

      const created = await storage.create(mockMilestone);

      expect(created).toEqual(mockMilestone);
      await expect(storage.findById(mockMilestone.id)).resolves.toEqual(mockMilestone);
    });
  });

  describe('findById', () => {
    test('returns undefined for an unknown id', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();

      await expect(storage.findById('unknown')).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    test('merges the patch into an existing milestone', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();
      await storage.create(mockMilestone);

      const updated = await storage.update(mockMilestone.id, { status: 'reached' });

      expect(updated?.status).toBe('reached');
      expect(updated?.title).toBe(mockMilestone.title);
    });

    test('returns undefined for an unknown id', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();

      await expect(storage.update('unknown', { status: 'reached' })).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    test('removes an existing milestone and returns true', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();
      await storage.create(mockMilestone);

      await expect(storage.delete(mockMilestone.id)).resolves.toBe(true);
      await expect(storage.findById(mockMilestone.id)).resolves.toBeUndefined();
    });

    test('returns false for an unknown id', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();

      await expect(storage.delete('unknown')).resolves.toBe(false);
    });
  });

  describe('list', () => {
    test('returns all stored milestones', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();
      await storage.create(mockMilestone);
      await storage.create({ ...mockMilestone, id: 'milestone-2' });

      const results = await storage.list();

      expect(results).toHaveLength(2);
    });

    test('returns independent copies that do not leak mutations back into storage', async () => {
      const storage = InMemoryMilestoneStorage.createInstance();
      await storage.create(mockMilestone);

      const results = await storage.list();
      results[0].title = 'mutated';

      await expect(storage.findById(mockMilestone.id)).resolves.toMatchObject({
        title: mockMilestone.title,
      });
    });
  });
});
