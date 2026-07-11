import { InMemoryEpicStorage } from './in-memory-epic-storage.service';
import { mockEpic } from './epic.mocks';

describe('InMemoryEpicStorage', () => {
  describe('create', () => {
    test('stores and returns the epic', async () => {
      const storage = InMemoryEpicStorage.createInstance();

      const created = await storage.create(mockEpic);

      expect(created).toEqual(mockEpic);
      await expect(storage.findById(mockEpic.id)).resolves.toEqual(mockEpic);
    });
  });

  describe('findById', () => {
    test('returns undefined for an unknown id', async () => {
      const storage = InMemoryEpicStorage.createInstance();

      await expect(storage.findById('unknown')).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    test('merges the patch into an existing epic', async () => {
      const storage = InMemoryEpicStorage.createInstance();
      await storage.create(mockEpic);

      const updated = await storage.update(mockEpic.id, { title: 'Updated title' });

      expect(updated?.title).toBe('Updated title');
      expect(updated?.status).toBe(mockEpic.status);
    });

    test('returns undefined for an unknown id', async () => {
      const storage = InMemoryEpicStorage.createInstance();

      await expect(storage.update('unknown', { title: 'x' })).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    test('removes an existing epic and returns true', async () => {
      const storage = InMemoryEpicStorage.createInstance();
      await storage.create(mockEpic);

      await expect(storage.delete(mockEpic.id)).resolves.toBe(true);
      await expect(storage.findById(mockEpic.id)).resolves.toBeUndefined();
    });

    test('returns false for an unknown id', async () => {
      const storage = InMemoryEpicStorage.createInstance();

      await expect(storage.delete('unknown')).resolves.toBe(false);
    });
  });

  describe('list', () => {
    test('returns all stored epics', async () => {
      const storage = InMemoryEpicStorage.createInstance();
      await storage.create(mockEpic);
      await storage.create({ ...mockEpic, id: 'epic-2' });

      const results = await storage.list();

      expect(results).toHaveLength(2);
    });

    test('returns independent copies that do not leak mutations back into storage', async () => {
      const storage = InMemoryEpicStorage.createInstance();
      await storage.create(mockEpic);

      const results = await storage.list();
      results[0].title = 'mutated';

      await expect(storage.findById(mockEpic.id)).resolves.toMatchObject({
        title: mockEpic.title,
      });
    });
  });
});
