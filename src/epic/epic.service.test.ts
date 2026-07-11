import { mockReset } from 'jest-mock-extended';
import { EpicService } from './epic.service';
import { mockEpicStorage, mockEpic } from './epic.mocks';

describe('EpicService', () => {
  beforeEach(() => {
    mockReset(mockEpicStorage);
  });

  describe('createEpic', () => {
    test('creates an epic with a generated id', async () => {
      mockEpicStorage.create.mockImplementation((epic) => Promise.resolve(epic));
      const service = EpicService.createInstance(mockEpicStorage);

      const created = await service.createEpic({ title: 'Q3 roadmap', status: 'open' });

      expect(created.id).toEqual(expect.any(String));
      expect(mockEpicStorage.create).toHaveBeenCalledWith(created);
    });
  });

  describe('getEpicById', () => {
    test('returns the epic when found', async () => {
      mockEpicStorage.findById.mockResolvedValue(mockEpic);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.getEpicById(mockEpic.id)).resolves.toEqual(mockEpic);
    });

    test('returns undefined when not found', async () => {
      mockEpicStorage.findById.mockResolvedValue(undefined);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.getEpicById('unknown')).resolves.toBeUndefined();
    });
  });

  describe('getEpicByIdOrFail', () => {
    test('returns the epic when found', async () => {
      mockEpicStorage.findById.mockResolvedValue(mockEpic);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.getEpicByIdOrFail(mockEpic.id)).resolves.toEqual(mockEpic);
    });

    test('throws a descriptive error when not found', async () => {
      mockEpicStorage.findById.mockResolvedValue(undefined);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.getEpicByIdOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('updateEpic', () => {
    test('returns the updated epic', async () => {
      mockEpicStorage.update.mockResolvedValue({ ...mockEpic, title: 'Updated' });
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.updateEpic(mockEpic.id, { title: 'Updated' })).resolves.toMatchObject({
        title: 'Updated',
      });
    });

    test('returns undefined for an unknown id', async () => {
      mockEpicStorage.update.mockResolvedValue(undefined);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.updateEpic('unknown', { title: 'x' })).resolves.toBeUndefined();
    });
  });

  describe('updateEpicOrFail', () => {
    test('returns the updated epic', async () => {
      mockEpicStorage.update.mockResolvedValue(mockEpic);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.updateEpicOrFail(mockEpic.id, {})).resolves.toEqual(mockEpic);
    });

    test('throws a descriptive error for an unknown id', async () => {
      mockEpicStorage.update.mockResolvedValue(undefined);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.updateEpicOrFail('unknown', {})).rejects.toThrow(/unknown/);
    });
  });

  describe('deleteEpic', () => {
    test('returns true when deleted', async () => {
      mockEpicStorage.delete.mockResolvedValue(true);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.deleteEpic(mockEpic.id)).resolves.toBe(true);
    });

    test('returns false when not found', async () => {
      mockEpicStorage.delete.mockResolvedValue(false);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.deleteEpic('unknown')).resolves.toBe(false);
    });
  });

  describe('deleteEpicOrFail', () => {
    test('resolves when deleted', async () => {
      mockEpicStorage.delete.mockResolvedValue(true);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.deleteEpicOrFail(mockEpic.id)).resolves.toBeUndefined();
    });

    test('throws a descriptive error when not found', async () => {
      mockEpicStorage.delete.mockResolvedValue(false);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.deleteEpicOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('listEpics', () => {
    test('delegates to storage.list', async () => {
      mockEpicStorage.list.mockResolvedValue([mockEpic]);
      const service = EpicService.createInstance(mockEpicStorage);

      await expect(service.listEpics()).resolves.toEqual([mockEpic]);
    });
  });
});
