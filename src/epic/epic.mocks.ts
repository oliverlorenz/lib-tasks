import { mock } from 'jest-mock-extended';
import type { Epic, EpicStorage } from './epic.types';

export const mockEpicStorage = mock<EpicStorage>();

export const mockEpic: Epic = {
  id: 'epic-1',
  title: 'Mock Epic',
  status: 'open',
};
