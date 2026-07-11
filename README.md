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

`priority` is an integer: `1` is the highest priority, ascending numbers are lower priority. It is
open-ended (not limited to a fixed 1-4 scale) so consumers can use coarse or fine-grained scales
alike.

### Eisenhower matrix

`important` and `urgent` are two explicit booleans on `Task` (both default to `false`). There is
no dedicated quadrant type or classification service — the quadrant is a trivial 2x2 case split
consumers can compute inline:

| `important` | `urgent` | Quadrant |
| --- | --- | --- |
| true | true | Do now |
| true | false | Schedule |
| false | true | Delegate |
| false | false | Eliminate |

### Scheduling & Gantt fields

`startDate`, `deadline`, `durationDays`, and `progress` (0-100, defaults to `0`) provide the data
a Gantt renderer needs. `createTask`/`updateTask` validate that `progress` stays within 0-100,
`durationDays` is positive, and `deadline` is not before `startDate` when both are set.
