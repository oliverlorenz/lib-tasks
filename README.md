# lib-tasks

Framework-agnostic task management library with pluggable storage backends. Ships with an
in-memory storage implementation; see [docs/concept.md](docs/concept.md) for the full design and
roadmap.

## Installation

To install lib-tasks, use npm:

```bash
npm install @oliverlorenz/lib-tasks
```

## Usage

```typescript
import { InMemoryTaskStorage, TaskService } from '@oliverlorenz/lib-tasks';

const storage = InMemoryTaskStorage.createInstance();
const taskService = TaskService.createInstance(storage);

const task = await taskService.createTask({
  title: 'Wash laundry',
  status: 'todo',
  priority: 1,
  tags: ['chores'],
  assignees: ['alice'],
  scheduleType: 'flexible',
});

const found = await taskService.getTaskByIdOrFail(task.id);
```
