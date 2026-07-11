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
      expect(mockTaskStorage.create).toHaveBeenCalledWith(created);
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
