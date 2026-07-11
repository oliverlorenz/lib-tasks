# Konzept: `lib-tasks`

Abstrakte Library zum Verwalten von Aufgaben (Tasks). Framework-agnostisch, mit austauschbarem
Storage-Backend. V1 liefert ausschließlich In-Memory-Storage; weitere Backends (SQL, Redis,
Datei, ...) werden später als zusätzliche Adapter gegen dasselbe Storage-Interface ergänzt.

**Tracking:** Die Umsetzung ist als
[GitHub Project "lib-tasks — Task Management Library"](https://github.com/users/oliverlorenz/projects/10)
organisiert, verknüpft mit diesem Repository. Jedes Epic unten ist ein
[Milestone](https://github.com/oliverlorenz/lib-tasks/milestones), jede Anforderung eine
[GitHub Issue](https://github.com/oliverlorenz/lib-tasks/issues) mit Ziel/Anforderungen/
Akzeptanzkriterien/Abhängigkeiten (Gherkin-Format, siehe bestehende Issues).

## Roadmap (Epics)

```text
Epic 1 (Task Core)  ─┬─> Epic 2 (Sub-Tasks)     ─┐
                      ├─> Epic 3 (Dependencies)   │
                      ├─> Epic 4 (Priority/Eisen.)├─> Epic 7 (Epic/Milestone-Verknüpfung)
                      ├─> Epic 5 (Gantt-Felder)   │
                      └─> Epic 6 (Links/Tags)     ┘
```

- [Epic 1 — Task Core Domain & Storage](https://github.com/oliverlorenz/lib-tasks/milestone/1) —
  Task-Grundtyp, `TaskService`, `InMemoryTaskStorage`. Fundament für alles Weitere.
- [Epic 2 — Sub-Tasks & Hierarchie](https://github.com/oliverlorenz/lib-tasks/milestone/2) —
  `parentId`, `listSubtasks`.
- [Epic 3 — Task Dependencies & Chains](https://github.com/oliverlorenz/lib-tasks/milestone/3) —
  `TaskDependency`, Statuswechsel-Guard, `resolveChain`.
- [Epic 4 — Priorität, Eisenhower & Postpone](https://github.com/oliverlorenz/lib-tasks/milestone/4) —
  `priority: number`, `important`/`urgent`, `postponeCount`.
- [Epic 5 — Gantt- & Scheduling-Felder](https://github.com/oliverlorenz/lib-tasks/milestone/5) —
  `startDate`/`deadline`/`durationDays`/`setupDurationInMinutes`/`progress`.
- [Epic 6 — Links, Tags & Assignees](https://github.com/oliverlorenz/lib-tasks/milestone/6) —
  `TaskLink`, Tag-/Assignee-Filter.
- [Epic 7 — Epic- & Milestone-Domains](https://github.com/oliverlorenz/lib-tasks/milestone/7) —
  eigene `Epic`-/`Milestone`-Domains, Task-Verknüpfung.

Epic 1 ist Voraussetzung für alle anderen. Epics 2–6 bauen alle direkt auf Epic 1 auf, sind
aber untereinander unabhängig und parallel entwickelbar. Epic 7 (Task↔Epic/Milestone-
Verknüpfung, Issue #26) braucht zusätzlich Epic 2 (`listSubtasks`-Pattern für die analogen
`listTasksByEpic`/`listTasksByMilestone`-Methoden).

## Ziele

- Datenmodell + Geschäftslogik für Tasks, ohne UI, ohne Persistenz-Lock-in.
- Genug Felder, um daraus extern ableiten zu können: Gantt-Charts, Eisenhower-Matrix,
  Epic/Milestone-Boards.
- Storage austauschbar über ein Port-Interface (`TaskStorage`), analog zum bestehenden
  Domain-Pattern (`XxxService`, DI über Konstruktor).

## Nicht-Ziele (v1)

- Kein Rendering (kein Gantt-, Kalender- oder Board-UI selbst).
- Keine Auth/Permissions, kein Multi-Tenancy.
- Kein Busy/Free bzw. echte Kalender-Synchronisation (ICS/CalDAV) — Free/Busy ist ein
  Kalender-Feature, keine Task-Eigenschaft, und gehört in eine separate Kalender-Domain/App, die
  auf `startDate`/`deadline`/`scheduleType` aufsetzt statt in den Task-Datentyp selbst.
- Keine wiederkehrenden Tasks (Recurrence) — siehe "Spätere Erweiterungen".

## Kernentitäten

### Task

```ts
export type TaskId = string;

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = number; // ganzzahlig, 1 = höchste Priorität, aufsteigend = niedriger
export type TaskScheduleType = 'fixed' | 'flexible';

export type Task = {
  id: TaskId;
  title: string;
  description?: string;

  status: TaskStatus;
  priority: TaskPriority;
  important: boolean; // Eisenhower-Achse: Wichtigkeit
  urgent: boolean; // Eisenhower-Achse: Dringlichkeit
  postponeCount: number; // Anzahl bisheriger Verschiebungen, default 0

  tags: string[];
  assignees: string[]; // mehrere externe User-IDs; kein eigenes User-Domain in dieser Lib

  epicId?: TaskId;
  parentId?: TaskId; // Sub-Task-Beziehung (self-reference)
  milestoneId?: string;

  dependencies: TaskDependency[];
  links: TaskLink[];

  scheduleType: TaskScheduleType; // fixed = feste Zeit, flexible = frei planbar
  startDate?: Date;
  deadline?: Date;
  durationDays?: number; // für Gantt-Balkenlänge bei flexible Tasks
  setupDurationInMinutes?: number; // Rüstzeit: geschätzter Vorlauf/Umrüstaufwand vor Start
  progress: number; // 0–100, für Gantt-Fortschrittsanzeige

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};
```

Anmerkungen:

- **`assignees: string[]`** ist bereits Mehrfachzuweisung (kein Single-Assignee-Feld) und steht
  statt eigenem `User`-Domain — die Lib bleibt so unabhängig von einem konkreten
  Identity-System. Wer IDs auflöst, ist Sache des Konsumenten.
- **Sub-Tasks** über `parentId` (self-reference), keine `children`-Liste am Task selbst — Kinder
  werden per Query (`list({ parentId })`) ermittelt. Vermeidet redundante/veraltete State-Kopien
  (siehe Stateless-Services-Prinzip).
- **`priority: number`** statt String-Enum — ganzzahlig, `1` = höchste Priorität. Bewusst offen
  (nicht auf einen festen Wertebereich wie 1–4 begrenzt), damit Konsumenten sowohl grobe
  Vier-Stufen-Skalen als auch feinere numerische Skalen abbilden können.
- **`important` / `urgent`** sind bewusst getrennt von `priority` und beide explizit gespeichert
  (kein aus `deadline` abgeleiteter/berechneter Wert). `priority` ist die generelle
  Team-/Backlog-Priorität; `important`/`urgent` sind die zwei Eisenhower-Achsen. Beide können von
  `priority` divergieren (z. B. hohe `priority` aber "not important" für den Eisenhower-Kontext
  einer bestimmten Person/Rolle). Der Quadrant selbst wird nicht gespeichert, siehe
  [Eisenhower-Matrix](#eisenhower-matrix).
- **`postponeCount`** zählt, wie oft ein Task bereits verschoben wurde (Start/Deadline
  nachträglich geändert). Default `0`. `TaskService` sollte eine dedizierte Methode
  `postponeTask(id, newDeadline?)` anbieten, die `postponeCount` erhöht statt es dem Konsumenten
  zu überlassen, das Feld direkt per `update()`-Patch zu pflegen (sonst kann es leicht vergessen
  werden).
- **`setupDurationInMinutes`** bildet Rüstzeiten ab (Vorlauf/Umrüstaufwand vor dem eigentlichen
  Start, z. B. Kontextwechsel, Werkzeug/Material bereitstellen). Bewusst in Minuten statt Tagen
  (`durationDays`), da Rüstzeiten typischerweise deutlich kürzer sind als die Task-Laufzeit selbst
  und getrennt ausgewiesen werden sollen — z. B. für ein späteres Scheduling, das Tasks mit
  gleichem Tag/Assignee bündelt, um Rüstzeiten zu minimieren.

### TaskDependency (Gantt-Abhängigkeiten)

```ts
export type TaskDependencyType =
  | 'finish_to_start' // Standard: B startet erst wenn A fertig ist
  | 'start_to_start'
  | 'finish_to_finish'
  | 'start_to_finish';

export type TaskDependency = {
  taskId: TaskId; // Vorgänger-Task
  type: TaskDependencyType;
  lagDays?: number; // Puffer/Vorlauf in Tagen
};
```

Für v1 als Array direkt am Task modelliert (einfach, kein Graph-Storage nötig). Falls später
Critical-Path-Berechnung oder komplexe Graph-Queries gebraucht werden, kann das in ein eigenes
`task-dependency`-Domain mit eigenem Storage ausgelagert werden, ohne den `Task`-Typ zu brechen
(`dependencies` bliebe eine abgeleitete/berechnete Sicht).

#### Task-Chains (Reihenfolge erzwingen)

Task-Chains sind kein eigener Typ, sondern ergeben sich direkt aus `TaskDependency` mit
`type: 'finish_to_start'`. Beispiel "Wäsche waschen" → "Wäsche aufhängen":

```ts
const waschen: Task = { id: 'waschen', title: 'Wäsche waschen', dependencies: [] /* ... */ };
const aufhaengen: Task = {
  id: 'aufhaengen',
  title: 'Wäsche aufhängen',
  dependencies: [{ taskId: 'waschen', type: 'finish_to_start' }],
  /* ... */
};
```

Die Richtung ist strukturell erzwungen, nicht nur Konvention: `aufhaengen` referenziert `waschen`,
nicht umgekehrt. "Andersrum macht keinen Sinn" entsteht dadurch automatisch — niemand kann aus
Versehen den Rückwärts-Pfeil anlegen, ohne es explizit als eigene, separate Dependency zu tun.

Zwei Dinge fehlen aktuell noch, damit daraus eine echte, verbindliche Chain wird statt nur
dokumentierter Reihenfolge für einen Gantt-Renderer:

- **Durchsetzung beim Statuswechsel**: `TaskDependency` allein verhindert nicht, dass "Wäsche
  aufhängen" trotzdem gestartet wird, bevor "Wäsche waschen" fertig ist — es ist nur Metadatum.
  `TaskService` sollte das aktiv prüfen: ein Übergang nach `in_progress`/`done` schlägt fehl
  (`startTaskOrFail`-artig), solange ein `finish_to_start`-Vorgänger noch nicht `status: 'done'`
  ist. Andere Dependency-Typen (`start_to_start` etc.) blocken den Statuswechsel nicht auf dieselbe
  Art, da sie keine reine Vorher/Nachher-Reihenfolge ausdrücken.
- **Vorwärts-Traversierung**: `dependencies` zeigt nur rückwärts (Nachfolger → Vorgänger). Um eine
  Chain vorwärts aufzulösen ("was folgt auf 'waschen'?", z. B. für eine Chain-/Gantt-Ansicht),
  braucht `TaskQuery` (siehe [Storage-Abstraktion](#storage-abstraktion)) ein
  `dependsOnTaskId`-Filter, das alle Tasks liefert, die `taskId` als `finish_to_start`-Vorgänger
  eingetragen haben. Damit lässt sich eine ganze Chain rekursiv auflösen, ohne einen eigenen
  Graph-Store zu brauchen: `list({ dependsOnTaskId: 'waschen' })` → `aufhaengen` →
  `list({ dependsOnTaskId: 'aufhaengen' })` → ...

### TaskLink

```ts
export type TaskLink = {
  url: string;
  label?: string;
};
```

Externe Referenzen (PRs, Docs, Tickets in anderen Systemen). Bewusst von `dependencies` getrennt:
Links sind unstrukturierte externe Referenzen, Dependencies sind strukturierte Task-zu-Task-
Beziehungen mit Scheduling-Semantik.

### Epic

```ts
export type Epic = {
  id: string;
  title: string;
  description?: string;
  color?: string; // für Gantt-/Board-Visualisierung
  startDate?: Date;
  targetDate?: Date;
  status: 'open' | 'closed';
};
```

Grobe Klammer über mehrere Tasks (`task.epicId`). Kein eigener Task-Typ, sondern eigene Entität —
vermeidet Sonderfälle im `Task`-Type.

### Milestone

```ts
export type Milestone = {
  id: string;
  title: string;
  dueDate: Date;
  epicId?: string;
  status: 'open' | 'reached' | 'missed';
};
```

Zeitpunkt (kein Zeitraum, keine `duration`), dem Tasks zugeordnet werden (`task.milestoneId`).
Klassische Gantt-Raute.

## Eisenhower-Matrix

`important` und `urgent` sind zwei explizite, vom Konsumenten gesetzte Felder auf `Task` (siehe
oben) — kein abgeleiteter Wert aus `deadline`, kein separates Klassifikations-Service/Domain
nötig. Der Quadrant ergibt sich trivial aus der Kombination der beiden Booleans:

| `important` | `urgent` | Quadrant     |
| ------------ | -------- | ------------ |
| true         | true     | Do now       |
| true         | false    | Schedule     |
| false        | true     | Delegate     |
| false        | false    | Eliminate    |

Das ist bewusst kein eigener Domain-Typ (`EisenhowerQuadrant`) in der Lib — die Zuordnung ist eine
reine 2×2-Fallunterscheidung, die Konsumenten bei Bedarf selbst inline bilden können.

## Gantt-Unterstützung

Datenbasis liegt komplett im `Task`-Type: `startDate`, `deadline`, `durationDays`, `progress`,
`dependencies`, `scheduleType`. Die Library selbst rendert kein Gantt, liefert aber alles, was
ein Gantt-Renderer (z. B. `dhtmlx-gantt`, `frappe-gantt`) als Datenquelle braucht:

- `fixed` Tasks: `startDate` + `deadline` sind bindend, werden vom Renderer nicht verschoben.
- `flexible` Tasks: nur `durationDays` + `dependencies` nötig, Start ergibt sich aus
  Vorgänger-Tasks (Auto-Scheduling ist Aufgabe eines späteren `scheduling`-Domains, nicht v1).

## Storage-Abstraktion

Port/Adapter-Pattern, konsistent mit dem bestehenden `XxxService`-Pattern der Lib:

```ts
export type TaskQuery = {
  status?: TaskStatus[];
  epicId?: TaskId;
  parentId?: TaskId;
  milestoneId?: string;
  assignee?: string;
  tag?: string;
  dependsOnTaskId?: TaskId; // Vorwärts-Traversierung für Task-Chains, siehe TaskDependency
};

export interface TaskStorage {
  create(task: Task): Promise<Task>;
  findById(id: TaskId): Promise<Task | undefined>;
  update(id: TaskId, patch: Partial<Task>): Promise<Task | undefined>;
  delete(id: TaskId): Promise<boolean>;
  list(query?: TaskQuery): Promise<Task[]>;
}
```

`TaskService` bekommt eine `TaskStorage`-Implementierung injiziert (Constructor-DI, wie im
bestehenden `GroupService`-Pattern) und kapselt Business-Logik (Validierung von Dependencies,
`OrFail`-Varianten). `InMemoryTaskStorage` ist die einzige Implementierung in v1; künftige Adapter
(`SqlTaskStorage`, `RedisTaskStorage`, ...) implementieren dasselbe Interface und landen als
eigene Pakete/Module, ohne `TaskService` anzufassen.

## Vorgeschlagene Domain-/Ordnerstruktur

```text
src/
  task/
    task.types.ts
    task.service.ts
    task.service.test.ts
    task.mocks.ts
    index.ts
  task-storage/
    task-storage.types.ts        - TaskStorage-Interface, TaskQuery
    in-memory-task-storage.service.ts
    in-memory-task-storage.service.test.ts
    in-memory-task-storage.mocks.ts
    index.ts
  epic/
    epic.types.ts
    epic.service.ts
    ...
  milestone/
    milestone.types.ts
    milestone.service.ts
    ...
  index.ts
```

Jede Domain folgt der bestehenden Konvention (Barrel-`index.ts`, `OrFail`-Pattern,
`static createInstance(...)`-Factory, Mocks in `*.mocks.ts`).

## Verhältnis zu `lib-timetetris-engine`

`lib-tasks` und `lib-timetetris-engine` sind unabhängige Libraries mit unterschiedlichem Scope
(CRUD/State vs. reine, zustandslose Scheduling-Algorithmen). Eine konsumierende App kann beide
kombinieren: `lib-tasks` als Quelle der Wahrheit, die Engine als reine `solve`-Funktion pro
Aufruf, deren Ergebnis über `TaskService`/`TaskStorage` zurückgeschrieben wird. Das passt
architektonisch gut zusammen (Storage/State hier, Pure-Function-Solver dort), erfordert aber ein
bewusstes Mapping zwischen den beiden Datenmodellen:

- **Zeit-Repräsentation**: `lib-tasks` bleibt bei `Date` (absolute Wall-Clock-Zeit) — passend zu
  seinem Scope als allgemeines, framework-agnostisches Task-Management. Die Engine ist bewusst
  wall-clock-frei (Minuten seit Horizon-Start). Die Umrechnung (`Date` ↔
  `minutesSinceHorizonStart`, inkl. Zeitzone) ist bewusst **weder** Aufgabe von `lib-tasks` **noch**
  der Engine, sondern der konsumierenden App bzw. eines künftigen dünnen Adapter-Pakets — beide
  Libraries bleiben so frei von Timezone-Logik.
- **Fixed/Flexible-Mapping**: `scheduleType: 'fixed' | 'flexible'` bleibt ein einzelnes
  Anzeige-/Verhaltens-Flag auf dem `Task`-Type (praktisch für CRUD/Board-Ansichten mit einem
  einheitlichen Task-Modell). Für die Engine gilt beim Mapping: `scheduleType === 'fixed'` →
  Engine-`FixedEvent` (dort werden `priority`/`important`/`urgent` ohnehin ignoriert, da
  `FixedEvent` in der Engine bewusst untiered bleibt); `scheduleType === 'flexible'` →
  Engine-`Task`/`Habit`. Kein Modellwechsel in `lib-tasks` nötig — nur eine Mapping-Regel im
  Adapter.
- **`priority` / `postponeCount`**: `priority` ist jetzt `number` statt String-Enum, `postponeCount`
  neu auf `Task` (siehe oben) — beide passen sich damit direkt an die numerischen
  Priorisierungs-Bausteine der Engine an (`basePriority`, `postponeEscalationFactor *
  postponeCount²`), ohne fix an deren 4-Tier-Modell (`P1`–`P4`) gebunden zu sein.
- **Busy/Free**: `lib-tasks` modelliert das gar nicht (mehr) — kein `busy`/`blocksCalendar`-Feld
  auf `Task`, siehe Nicht-Ziele. Free/Busy ist Kalender-Domain, keine Task-Eigenschaft. Damit gibt
  es auch keine Namenskollision mit der Engine mehr zu vermeiden: `defenseStatus: 'free' | 'busy'`
  bleibt ein rein von der Engine pro platziertem Chunk berechneter Output, unabhängig von
  `lib-tasks`. Falls eine konsumierende App einen statischen "blockt Kalenderzeit"-Flag pro Task
  braucht, gehört der in die Kalender-/Scheduling-Schicht der App, nicht in den Task-Datentyp.
- **Sub-Tasks vs. Task-Chunking**: bewusst unterschiedliche Konzepte, bleiben getrennt. `parentId`
  in `lib-tasks` bildet eigenständig trackbare Kind-Tasks ab (organisatorische Zerlegung); die
  Engine zerlegt beim Chunking einen einzelnen Task in reine Kalender-Zeitblöcke
  (`TimeInterval[]`, keine eigenen Entitäten). Kein Mapping zwischen beiden nötig oder sinnvoll.
- **Dependencies**: `TaskDependency` (Gantt) bleibt vorerst ohne Engine-Äquivalent — die Engine
  plant nicht abhängigkeitsbewusst, sondern rein priority-/deadline-getrieben. Dependency-aware
  Auto-Scheduling ist aktuell nicht möglich, wenn beide Libraries kombiniert werden.

## Offene Punkte / spätere Erweiterungen

- **Recurring Tasks**: Wiederholungsregeln (RRULE-artig) — bewusst aus v1 ausgeklammert, da
  eigenes Scheduling-Konzept nötig.
- **Time Tracking**: `loggedHours`/`estimatedHours` getrennt von `durationDays`, falls
  Aufwandserfassung gebraucht wird.
- **Custom Fields**: generisches `metadata: Record<string, unknown>` für Konsumenten-spezifische
  Erweiterungen, ohne den Core-Type aufzublähen.
- **Events/Hooks**: `onTaskCompleted`, `onDependencyBlocked` etc. für Konsumenten, die auf
  State-Änderungen reagieren wollen.
- **Critical-Path-Berechnung**: eigener `scheduling`-Domain, sobald Auto-Scheduling für
  `flexible` Tasks gebraucht wird.
- **Audit/History**: History von Statuswechseln, falls Nachvollziehbarkeit gebraucht wird.
- **Weitere Storages**: SQL (Postgres/SQLite), Redis, Datei-basiert (JSON) — alle gegen
  `TaskStorage` implementiert.
- **Kalender-Domain (separat)**: Busy/Free-Semantik, ICS-Export etc. sind bewusst kein Teil des
  Task-Datentyps (siehe Nicht-Ziele) — falls später gebraucht, als eigenes Package/Domain, das auf
  `startDate`/`deadline`/`scheduleType` aufsetzt statt den `Task`-Type um Kalender-Felder zu
  erweitern.
- **Chain-/Task-Templates**: wiederverwendbare Vorlage für wiederkehrende Multi-Step-Routinen
  (z. B. "Wäsche machen" = waschen → aufhängen → falten), die bei Instanziierung mehrere Tasks
  inkl. `finish_to_start`-Dependencies in einem Aufruf erzeugt, statt sie jedes Mal einzeln
  verdrahten zu müssen. Verwandt mit Recurring Tasks, aber orthogonal — eine Chain kann auch
  einmalig sein.

## Hinweis zur Umsetzung

Gemäß Workflow in `CLAUDE.md` beginnt die Implementierung erst mit einem GitHub Issue pro
Teilbereich. Die 7 Epics/Milestones und 22 Issues sind bereits angelegt (siehe
[Roadmap](#roadmap-epics)) und mit dem GitHub Project verknüpft. Wenn sich das Konzept ändert,
zuerst dieses Dokument aktualisieren, dann die betroffenen Issues/Milestones nachziehen — nicht
umgekehrt.
