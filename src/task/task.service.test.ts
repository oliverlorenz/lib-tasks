import { mockReset } from 'jest-mock-extended';
import { TaskService } from './task.service';
import { mockTaskStorage, mockTask } from './task.mocks';

describe('TaskService', () => {
  beforeEach(() => {
    mockReset(mockTaskStorage);
  });

  describe('createTask', () => {
    test('creates a task with a generated id and timestamps', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const created = await service.createTask({
        title: 'Wash laundry',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
      });

      expect(created.id).toEqual(expect.any(String));
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
      expect(created.dependencies).toEqual([]);
      expect(created.important).toBe(false);
      expect(created.urgent).toBe(false);
      expect(mockTaskStorage.create).toHaveBeenCalledWith(created);
    });

    test('keeps explicitly provided important/urgent', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const created = await service.createTask({
        title: 'Ship the release',
        status: 'todo',
        priority: 1,
        important: true,
        urgent: true,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
      });

      expect(created.important).toBe(true);
      expect(created.urgent).toBe(true);
    });

    test('keeps explicitly provided dependencies', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);
      const dependencies = [{ taskId: 'other-task', type: 'finish_to_start' as const }];

      const created = await service.createTask({
        title: 'Hang up laundry',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
        dependencies,
      });

      expect(created.dependencies).toEqual(dependencies);
    });

    test('rejects a non-integer priority', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 1.5,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
        }),
      ).rejects.toThrow(/priority/i);
    });

    test('rejects a priority below 1', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 0,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
        }),
      ).rejects.toThrow(/priority/i);
    });

    test('defaults postponeCount to 0 but keeps an explicit value', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const defaulted = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
      });
      const explicit = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
        postponeCount: 3,
      });

      expect(defaulted.postponeCount).toBe(0);
      expect(explicit.postponeCount).toBe(3);
    });

    test('defaults progress to 0', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const created = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
      });

      expect(created.progress).toBe(0);
    });

    test('rejects a deadline before startDate', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 1,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
          startDate: new Date('2026-08-01'),
          deadline: new Date('2026-07-01'),
        }),
      ).rejects.toThrow(/deadline/i);
    });

    test('rejects progress outside 0-100', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 1,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
          progress: 150,
        }),
      ).rejects.toThrow(/progress/i);
    });

    test('rejects a non-positive durationDays', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 1,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
          durationDays: 0,
        }),
      ).rejects.toThrow(/durationDays/i);
    });

    test('accepts a valid durationDays and a startDate before deadline', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const created = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
        durationDays: 2,
        startDate: new Date('2026-07-01'),
        deadline: new Date('2026-08-01'),
      });

      expect(created.durationDays).toBe(2);
    });

    test('defaults links to [] but keeps explicitly provided valid links', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const defaulted = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
      });
      const withLinks = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
        links: [{ url: 'https://example.com/ticket/1', label: 'Ticket' }],
      });

      expect(defaulted.links).toEqual([]);
      expect(withLinks.links).toEqual([{ url: 'https://example.com/ticket/1', label: 'Ticket' }]);
    });

    test('rejects an invalid link url', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 1,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
          links: [{ url: 'not-a-url' }],
        }),
      ).rejects.toThrow(/url/i);
    });

    test('rejects a non-positive setupDurationInMinutes', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.createTask({
          title: 'x',
          status: 'todo',
          priority: 1,
          tags: [],
          assignees: [],
          scheduleType: 'flexible',
          setupDurationInMinutes: -5,
        }),
      ).rejects.toThrow(/setupDurationInMinutes/i);
    });

    test('accepts a valid setupDurationInMinutes', async () => {
      mockTaskStorage.create.mockImplementation((task) => Promise.resolve(task));
      const service = TaskService.createInstance(mockTaskStorage);

      const created = await service.createTask({
        title: 'x',
        status: 'todo',
        priority: 1,
        tags: [],
        assignees: [],
        scheduleType: 'flexible',
        setupDurationInMinutes: 15,
      });

      expect(created.setupDurationInMinutes).toBe(15);
    });
  });

  describe('getTaskById', () => {
    test('returns the task when found', async () => {
      mockTaskStorage.findById.mockResolvedValue(mockTask);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.getTaskById(mockTask.id)).resolves.toEqual(mockTask);
    });

    test('returns undefined when not found', async () => {
      mockTaskStorage.findById.mockResolvedValue(undefined);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.getTaskById('unknown')).resolves.toBeUndefined();
    });
  });

  describe('getTaskByIdOrFail', () => {
    test('returns the task when found', async () => {
      mockTaskStorage.findById.mockResolvedValue(mockTask);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.getTaskByIdOrFail(mockTask.id)).resolves.toEqual(mockTask);
    });

    test('throws a descriptive error when not found', async () => {
      mockTaskStorage.findById.mockResolvedValue(undefined);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.getTaskByIdOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('updateTask', () => {
    test('merges the patch and bumps updatedAt', async () => {
      mockTaskStorage.update.mockResolvedValue({ ...mockTask, title: 'Updated' });
      const service = TaskService.createInstance(mockTaskStorage);

      const updated = await service.updateTask(mockTask.id, { title: 'Updated' });

      expect(updated?.title).toBe('Updated');
      expect(mockTaskStorage.update).toHaveBeenCalledWith(
        mockTask.id,
        expect.objectContaining({ title: 'Updated', updatedAt: expect.any(Date) }),
      );
    });

    test('returns undefined for an unknown id', async () => {
      mockTaskStorage.update.mockResolvedValue(undefined);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.updateTask('unknown', { title: 'x' })).resolves.toBeUndefined();
    });

    test('rejects an invalid priority in the patch', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.updateTask(mockTask.id, { priority: -1 })).rejects.toThrow(/priority/i);
    });

    test('rejects an invalid progress in the patch', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.updateTask(mockTask.id, { progress: -5 })).rejects.toThrow(/progress/i);
    });

    test('rejects a non-positive durationDays in the patch', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.updateTask(mockTask.id, { durationDays: -1 })).rejects.toThrow(
        /durationDays/i,
      );
    });

    test('rejects an invalid link url in the patch', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.updateTask(mockTask.id, { links: [{ url: 'not-a-url' }] }),
      ).rejects.toThrow(/url/i);
    });

    test('rejects a non-positive setupDurationInMinutes in the patch', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.updateTask(mockTask.id, { setupDurationInMinutes: -10 }),
      ).rejects.toThrow(/setupDurationInMinutes/i);
    });

    test('rejects a deadline before startDate in the patch', async () => {
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(
        service.updateTask(mockTask.id, {
          startDate: new Date('2026-08-01'),
          deadline: new Date('2026-07-01'),
        }),
      ).rejects.toThrow(/deadline/i);
    });
  });

  describe('updateTaskOrFail', () => {
    test('returns the updated task', async () => {
      mockTaskStorage.update.mockResolvedValue(mockTask);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.updateTaskOrFail(mockTask.id, {})).resolves.toEqual(mockTask);
    });

    test('throws a descriptive error for an unknown id', async () => {
      mockTaskStorage.update.mockResolvedValue(undefined);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.updateTaskOrFail('unknown', {})).rejects.toThrow(/unknown/);
    });
  });

  describe('deleteTask', () => {
    test('returns true when deleted', async () => {
      mockTaskStorage.delete.mockResolvedValue(true);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.deleteTask(mockTask.id)).resolves.toBe(true);
    });

    test('returns false when not found', async () => {
      mockTaskStorage.delete.mockResolvedValue(false);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.deleteTask('unknown')).resolves.toBe(false);
    });
  });

  describe('deleteTaskOrFail', () => {
    test('resolves when deleted', async () => {
      mockTaskStorage.delete.mockResolvedValue(true);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.deleteTaskOrFail(mockTask.id)).resolves.toBeUndefined();
    });

    test('throws a descriptive error when not found', async () => {
      mockTaskStorage.delete.mockResolvedValue(false);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.deleteTaskOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('listTasks', () => {
    test('delegates to storage.list', async () => {
      mockTaskStorage.list.mockResolvedValue([mockTask]);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.listTasks({ tag: 'urgent' })).resolves.toEqual([mockTask]);
      expect(mockTaskStorage.list).toHaveBeenCalledWith({ tag: 'urgent' });
    });
  });

  describe('listSubtasks', () => {
    test('returns an empty array for a task without children', async () => {
      mockTaskStorage.list.mockResolvedValue([]);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.listSubtasks(mockTask.id)).resolves.toEqual([]);
      expect(mockTaskStorage.list).toHaveBeenCalledWith({ parentId: mockTask.id });
    });

    test('returns all direct children', async () => {
      const child = { ...mockTask, id: 'task-2', parentId: mockTask.id };
      mockTaskStorage.list.mockResolvedValue([child]);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.listSubtasks(mockTask.id)).resolves.toEqual([child]);
    });
  });

  describe('listTasksByEpic', () => {
    test('delegates to listTasks with epicId', async () => {
      const task = { ...mockTask, epicId: 'epic-1' };
      mockTaskStorage.list.mockResolvedValue([task]);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.listTasksByEpic('epic-1')).resolves.toEqual([task]);
      expect(mockTaskStorage.list).toHaveBeenCalledWith({ epicId: 'epic-1' });
    });
  });

  describe('listTasksByMilestone', () => {
    test('delegates to listTasks with milestoneId', async () => {
      const task = { ...mockTask, milestoneId: 'milestone-1' };
      mockTaskStorage.list.mockResolvedValue([task]);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.listTasksByMilestone('milestone-1')).resolves.toEqual([task]);
      expect(mockTaskStorage.list).toHaveBeenCalledWith({ milestoneId: 'milestone-1' });
    });
  });

  describe('startTaskOrFail', () => {
    test('throws naming the blocking predecessor when a finish_to_start dependency is not done', async () => {
      const predecessor = {
        ...mockTask,
        id: 'waschen',
        title: 'Wäsche waschen',
        status: 'todo' as const,
      };
      const successor = {
        ...mockTask,
        id: 'aufhaengen',
        dependencies: [{ taskId: 'waschen', type: 'finish_to_start' as const }],
      };
      mockTaskStorage.findById.mockImplementation((taskId) =>
        Promise.resolve(taskId === 'waschen' ? predecessor : successor),
      );
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.startTaskOrFail('aufhaengen')).rejects.toThrow(/Wäsche waschen/);
    });

    test('succeeds once the finish_to_start predecessor is done', async () => {
      const predecessor = { ...mockTask, id: 'waschen', status: 'done' as const };
      const successor = {
        ...mockTask,
        id: 'aufhaengen',
        dependencies: [{ taskId: 'waschen', type: 'finish_to_start' as const }],
      };
      mockTaskStorage.findById.mockImplementation((taskId) =>
        Promise.resolve(taskId === 'waschen' ? predecessor : successor),
      );
      mockTaskStorage.update.mockResolvedValue({ ...successor, status: 'in_progress' });
      const service = TaskService.createInstance(mockTaskStorage);

      const started = await service.startTaskOrFail('aufhaengen');

      expect(started.status).toBe('in_progress');
      expect(mockTaskStorage.update).toHaveBeenCalledWith(
        'aufhaengen',
        expect.objectContaining({ status: 'in_progress' }),
      );
    });

    test('ignores non finish_to_start dependencies', async () => {
      const predecessor = { ...mockTask, id: 'other', status: 'todo' as const };
      const successor = {
        ...mockTask,
        id: 'task-a',
        dependencies: [{ taskId: 'other', type: 'start_to_start' as const }],
      };
      mockTaskStorage.findById.mockImplementation((taskId) =>
        Promise.resolve(taskId === 'other' ? predecessor : successor),
      );
      mockTaskStorage.update.mockResolvedValue({ ...successor, status: 'in_progress' });
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.startTaskOrFail('task-a')).resolves.toMatchObject({
        status: 'in_progress',
      });
    });
  });

  describe('postponeTaskOrFail', () => {
    test('increments postponeCount and sets the new deadline', async () => {
      const task = { ...mockTask, postponeCount: 0 };
      mockTaskStorage.findById.mockResolvedValue(task);
      const newDeadline = new Date('2026-09-01');
      mockTaskStorage.update.mockImplementation((id, patch) =>
        Promise.resolve({ ...task, ...patch }),
      );
      const service = TaskService.createInstance(mockTaskStorage);

      const postponed = await service.postponeTaskOrFail(task.id, newDeadline);

      expect(postponed.postponeCount).toBe(1);
      expect(postponed.deadline).toEqual(newDeadline);
    });

    test('increments postponeCount twice across two calls', async () => {
      let stored = { ...mockTask, postponeCount: 0 };
      mockTaskStorage.findById.mockImplementation(() => Promise.resolve(stored));
      mockTaskStorage.update.mockImplementation((id, patch) => {
        stored = { ...stored, ...patch };
        return Promise.resolve(stored);
      });
      const service = TaskService.createInstance(mockTaskStorage);

      await service.postponeTaskOrFail(mockTask.id, new Date('2026-09-01'));
      await service.postponeTaskOrFail(mockTask.id, new Date('2026-10-01'));

      expect(stored.postponeCount).toBe(2);
    });

    test('leaves the deadline untouched when no newDeadline is given', async () => {
      const task = { ...mockTask, postponeCount: 0, deadline: new Date('2026-07-01') };
      mockTaskStorage.findById.mockResolvedValue(task);
      mockTaskStorage.update.mockImplementation((id, patch) =>
        Promise.resolve({ ...task, ...patch }),
      );
      const service = TaskService.createInstance(mockTaskStorage);

      const postponed = await service.postponeTaskOrFail(task.id);

      expect(postponed.deadline).toEqual(task.deadline);
    });

    test('throws for an unknown id', async () => {
      mockTaskStorage.findById.mockResolvedValue(undefined);
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.postponeTaskOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('resolveChain', () => {
    test('resolves a three-stage chain fully and in order', async () => {
      const waschen = { ...mockTask, id: 'waschen', dependencies: [] };
      const aufhaengen = {
        ...mockTask,
        id: 'aufhaengen',
        dependencies: [
          { taskId: 'waschen', type: 'finish_to_start' as const },
          { taskId: 'unrelated', type: 'start_to_start' as const },
        ],
      };
      const falten = {
        ...mockTask,
        id: 'falten',
        dependencies: [{ taskId: 'aufhaengen', type: 'finish_to_start' as const }],
      };
      const byId = new Map([
        ['waschen', waschen],
        ['aufhaengen', aufhaengen],
        ['falten', falten],
      ]);
      mockTaskStorage.findById.mockImplementation((id) => Promise.resolve(byId.get(id)));
      mockTaskStorage.list.mockImplementation((query) =>
        Promise.resolve(
          [...byId.values()].filter((task) =>
            task.dependencies.some(
              (dependency) =>
                dependency.taskId === query?.dependsOnTaskId &&
                dependency.type === 'finish_to_start',
            ),
          ),
        ),
      );
      const service = TaskService.createInstance(mockTaskStorage);

      const chain = await service.resolveChain('aufhaengen');

      expect(chain.map((task) => task.id)).toEqual(['waschen', 'aufhaengen', 'falten']);
    });

    test('terminates on a circular dependency, each id appears at most once', async () => {
      const taskA = {
        ...mockTask,
        id: 'A',
        dependencies: [{ taskId: 'B', type: 'finish_to_start' as const }],
      };
      const taskB = {
        ...mockTask,
        id: 'B',
        dependencies: [{ taskId: 'A', type: 'finish_to_start' as const }],
      };
      const byId = new Map([
        ['A', taskA],
        ['B', taskB],
      ]);
      mockTaskStorage.findById.mockImplementation((id) => Promise.resolve(byId.get(id)));
      mockTaskStorage.list.mockImplementation((query) =>
        Promise.resolve(
          [...byId.values()].filter((task) =>
            task.dependencies.some(
              (dependency) =>
                dependency.taskId === query?.dependsOnTaskId &&
                dependency.type === 'finish_to_start',
            ),
          ),
        ),
      );
      const service = TaskService.createInstance(mockTaskStorage);

      const chain = await service.resolveChain('A');

      const ids = chain.map((task) => task.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.sort()).toEqual(['A', 'B']);
    });
  });

  describe('completeTaskOrFail', () => {
    test('throws naming the blocking predecessor when a finish_to_start dependency is not done', async () => {
      const predecessor = {
        ...mockTask,
        id: 'waschen',
        title: 'Wäsche waschen',
        status: 'todo' as const,
      };
      const successor = {
        ...mockTask,
        id: 'aufhaengen',
        dependencies: [{ taskId: 'waschen', type: 'finish_to_start' as const }],
      };
      mockTaskStorage.findById.mockImplementation((taskId) =>
        Promise.resolve(taskId === 'waschen' ? predecessor : successor),
      );
      const service = TaskService.createInstance(mockTaskStorage);

      await expect(service.completeTaskOrFail('aufhaengen')).rejects.toThrow(/Wäsche waschen/);
    });

    test('sets status done and completedAt once the predecessor is done', async () => {
      const predecessor = { ...mockTask, id: 'waschen', status: 'done' as const };
      const successor = {
        ...mockTask,
        id: 'aufhaengen',
        dependencies: [{ taskId: 'waschen', type: 'finish_to_start' as const }],
      };
      mockTaskStorage.findById.mockImplementation((taskId) =>
        Promise.resolve(taskId === 'waschen' ? predecessor : successor),
      );
      mockTaskStorage.update.mockResolvedValue({ ...successor, status: 'done' });
      const service = TaskService.createInstance(mockTaskStorage);

      await service.completeTaskOrFail('aufhaengen');

      expect(mockTaskStorage.update).toHaveBeenCalledWith(
        'aufhaengen',
        expect.objectContaining({ status: 'done', completedAt: expect.any(Date) }),
      );
    });
  });
});
