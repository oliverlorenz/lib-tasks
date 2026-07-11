import { mock } from 'jest-mock-extended';
import type { Milestone, MilestoneStorage } from './milestone.types';

export const mockMilestoneStorage = mock<MilestoneStorage>();

export const mockMilestone: Milestone = {
  id: 'milestone-1',
  title: 'Mock Milestone',
  dueDate: new Date('2026-09-01T00:00:00.000Z'),
  status: 'open',
};
