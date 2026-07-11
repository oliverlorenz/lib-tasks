import { mockReset } from 'jest-mock-extended';
import { MilestoneService } from './milestone.service';
import { mockMilestoneStorage, mockMilestone } from './milestone.mocks';

describe('MilestoneService', () => {
  beforeEach(() => {
    mockReset(mockMilestoneStorage);
  });

  describe('createMilestone', () => {
    test('creates a milestone with a generated id', async () => {
      mockMilestoneStorage.create.mockImplementation((milestone) => Promise.resolve(milestone));
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      const created = await service.createMilestone({
        title: 'Beta release',
        dueDate: new Date('2026-09-01'),
        status: 'open',
      });

      expect(created.id).toEqual(expect.any(String));
      expect(mockMilestoneStorage.create).toHaveBeenCalledWith(created);
    });
  });

  describe('getMilestoneById', () => {
    test('returns the milestone when found', async () => {
      mockMilestoneStorage.findById.mockResolvedValue(mockMilestone);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.getMilestoneById(mockMilestone.id)).resolves.toEqual(mockMilestone);
    });

    test('returns undefined when not found', async () => {
      mockMilestoneStorage.findById.mockResolvedValue(undefined);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.getMilestoneById('unknown')).resolves.toBeUndefined();
    });
  });

  describe('getMilestoneByIdOrFail', () => {
    test('returns the milestone when found', async () => {
      mockMilestoneStorage.findById.mockResolvedValue(mockMilestone);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.getMilestoneByIdOrFail(mockMilestone.id)).resolves.toEqual(
        mockMilestone,
      );
    });

    test('throws a descriptive error when not found', async () => {
      mockMilestoneStorage.findById.mockResolvedValue(undefined);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.getMilestoneByIdOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('updateMilestone', () => {
    test('returns the updated milestone', async () => {
      mockMilestoneStorage.update.mockResolvedValue({ ...mockMilestone, status: 'reached' });
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(
        service.updateMilestone(mockMilestone.id, { status: 'reached' }),
      ).resolves.toMatchObject({ status: 'reached' });
    });

    test('returns undefined for an unknown id', async () => {
      mockMilestoneStorage.update.mockResolvedValue(undefined);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(
        service.updateMilestone('unknown', { status: 'reached' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('updateMilestoneOrFail', () => {
    test('returns the updated milestone', async () => {
      mockMilestoneStorage.update.mockResolvedValue(mockMilestone);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.updateMilestoneOrFail(mockMilestone.id, {})).resolves.toEqual(
        mockMilestone,
      );
    });

    test('throws a descriptive error for an unknown id', async () => {
      mockMilestoneStorage.update.mockResolvedValue(undefined);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.updateMilestoneOrFail('unknown', {})).rejects.toThrow(/unknown/);
    });
  });

  describe('deleteMilestone', () => {
    test('returns true when deleted', async () => {
      mockMilestoneStorage.delete.mockResolvedValue(true);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.deleteMilestone(mockMilestone.id)).resolves.toBe(true);
    });

    test('returns false when not found', async () => {
      mockMilestoneStorage.delete.mockResolvedValue(false);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.deleteMilestone('unknown')).resolves.toBe(false);
    });
  });

  describe('deleteMilestoneOrFail', () => {
    test('resolves when deleted', async () => {
      mockMilestoneStorage.delete.mockResolvedValue(true);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.deleteMilestoneOrFail(mockMilestone.id)).resolves.toBeUndefined();
    });

    test('throws a descriptive error when not found', async () => {
      mockMilestoneStorage.delete.mockResolvedValue(false);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.deleteMilestoneOrFail('unknown')).rejects.toThrow(/unknown/);
    });
  });

  describe('listMilestones', () => {
    test('delegates to storage.list', async () => {
      mockMilestoneStorage.list.mockResolvedValue([mockMilestone]);
      const service = MilestoneService.createInstance(mockMilestoneStorage);

      await expect(service.listMilestones()).resolves.toEqual([mockMilestone]);
    });
  });
});
