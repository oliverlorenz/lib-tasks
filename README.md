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

`setupDurationInMinutes` models setup/changeover time needed before a task can start (e.g.
context switching, preparing tools/material) — kept separate from `durationDays` since it's
usually much shorter than the task's own runtime. Also validated to be positive when set.

`postponeCount` (defaults to `0`) tracks how often a task has been rescheduled.
`taskService.postponeTaskOrFail(id, newDeadline?)` increments it and optionally sets a new
`deadline` in one call.

`lib-tasks` does not render a Gantt chart itself (see [docs/concept.md](docs/concept.md)) — it
only provides the data. Map `Task[]` into whatever shape your Gantt renderer expects, for example:

```typescript
type GanttBar = {
  id: string;
  label: string;
  start: Date;
  end: Date;
  progress: number;
  dependencyIds: string[];
};

function toGanttBars(tasks: Task[]): GanttBar[] {
  return tasks
    .filter((task) => task.startDate !== undefined && task.deadline !== undefined)
    .map((task) => ({
      id: task.id,
      label: task.title,
      start: task.startDate as Date,
      end: task.deadline as Date,
      progress: task.progress,
      dependencyIds: task.dependencies
        .filter((dependency) => dependency.type === 'finish_to_start')
        .map((dependency) => dependency.taskId),
    }));
}

const bars = toGanttBars(await taskService.listTasks());
```

`fixed` tasks (`scheduleType: 'fixed'`) have a binding `startDate`/`deadline` a renderer should not
move. `flexible` tasks only need `durationDays` plus `dependencies` — deriving their start from
predecessors (auto-scheduling) is out of scope for this library.
