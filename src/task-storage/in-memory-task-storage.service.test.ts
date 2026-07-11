import { InMemoryTaskStorage } from './in-memory-task-storage.service';
import { mockTask } from './in-memory-task-storage.mocks';

describe('InMemoryTaskStorage', () => {
  describe('create', () => {
    test('stores and returns the task', async () => {
      const storage = InMemoryTaskStorage.createInstance();

      const created = await storage.create(mockTask);

      expect(created).toEqual(mockTask);
      await expect(storage.findById(mockTask.id)).resolves.toEqual(mockTask);
    });
  });

  describe('findById', () => {
    test('returns undefined for an unknown id', async () => {
      const storage = InMemoryTaskStorage.createInstance();

      const found = await storage.findById('unknown');

      expect(found).toBeUndefined();
    });
  });

  describe('update', () => {
    test('merges the patch into an existing task', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create(mockTask);

      const updated = await storage.update(mockTask.id, { title: 'Updated title' });

      expect(updated?.title).toBe('Updated title');
      expect(updated?.status).toBe(mockTask.status);
    });

    test('returns undefined for an unknown id', async () => {
      const storage = InMemoryTaskStorage.createInstance();

      const updated = await storage.update('unknown', { title: 'x' });

      expect(updated).toBeUndefined();
    });
  });

  describe('delete', () => {
    test('removes an existing task and returns true', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create(mockTask);

      const deleted = await storage.delete(mockTask.id);

      expect(deleted).toBe(true);
      await expect(storage.findById(mockTask.id)).resolves.toBeUndefined();
    });

    test('returns false for an unknown id', async () => {
      const storage = InMemoryTaskStorage.createInstance();

      const deleted = await storage.delete('unknown');

      expect(deleted).toBe(false);
    });
  });

  describe('list', () => {
    test('returns all tasks when no query is given', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create(mockTask);
      await storage.create({ ...mockTask, id: 'task-2' });

      const results = await storage.list();

      expect(results).toHaveLength(2);
    });

    test('filters by status', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'task-1', status: 'todo' });
      await storage.create({ ...mockTask, id: 'task-2', status: 'done' });

      const results = await storage.list({ status: ['done'] });

      expect(results.map((task) => task.id)).toEqual(['task-2']);
    });

    test('filters by assignee', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'task-1', assignees: ['alice'] });
      await storage.create({ ...mockTask, id: 'task-2', assignees: ['bob'] });

      const results = await storage.list({ assignee: 'alice' });

      expect(results.map((task) => task.id)).toEqual(['task-1']);
    });

    test('filters by tag', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'task-1', tags: ['urgent'] });
      await storage.create({ ...mockTask, id: 'task-2', tags: ['later'] });

      const results = await storage.list({ tag: 'urgent' });

      expect(results.map((task) => task.id)).toEqual(['task-1']);
    });

    test('combines tag and assignee filters with AND semantics', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({
        ...mockTask,
        id: 'task-1',
        tags: ['urgent'],
        assignees: ['alice'],
      });
      await storage.create({
        ...mockTask,
        id: 'task-2',
        tags: ['urgent'],
        assignees: ['bob'],
      });
      await storage.create({
        ...mockTask,
        id: 'task-3',
        tags: ['later'],
        assignees: ['alice'],
      });

      const results = await storage.list({ tag: 'urgent', assignee: 'alice' });

      expect(results.map((task) => task.id)).toEqual(['task-1']);
    });

    test('filters by parentId and returns only direct children, not grandchildren', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'a' });
      await storage.create({ ...mockTask, id: 'b', parentId: 'a' });
      await storage.create({ ...mockTask, id: 'c', parentId: 'b' });

      const results = await storage.list({ parentId: 'a' });

      expect(results.map((task) => task.id)).toEqual(['b']);
    });

    test('filters by dependsOnTaskId to find direct successors', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'waschen' });
      await storage.create({
        ...mockTask,
        id: 'aufhaengen',
        dependencies: [{ taskId: 'waschen', type: 'finish_to_start' }],
      });
      await storage.create({ ...mockTask, id: 'unrelated' });

      const results = await storage.list({ dependsOnTaskId: 'waschen' });

      expect(results.map((task) => task.id)).toEqual(['aufhaengen']);
    });

    test('filters by epicId', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'task-1', epicId: 'epic-1' });
      await storage.create({ ...mockTask, id: 'task-2', epicId: 'epic-2' });

      const results = await storage.list({ epicId: 'epic-1' });

      expect(results.map((task) => task.id)).toEqual(['task-1']);
    });

    test('filters by milestoneId', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create({ ...mockTask, id: 'task-1', milestoneId: 'milestone-1' });
      await storage.create({ ...mockTask, id: 'task-2', milestoneId: 'milestone-2' });

      const results = await storage.list({ milestoneId: 'milestone-1' });

      expect(results.map((task) => task.id)).toEqual(['task-1']);
    });

    test('returns independent copies that do not leak mutations back into storage', async () => {
      const storage = InMemoryTaskStorage.createInstance();
      await storage.create(mockTask);

      const results = await storage.list();
      results[0].title = 'mutated';
      results[0].tags.push('mutated-tag');

      const stored = await storage.findById(mockTask.id);
      expect(stored?.title).toBe(mockTask.title);
      expect(stored?.tags).toEqual(mockTask.tags);
    });
  });
});
