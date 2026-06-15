# Allocation Engine Specification

The hybrid allocation engine is the deterministic core of Focus OS. It transforms wake time, user configuration, clients, tasks, and protected block templates into an ordered daily schedule. The same inputs must produce the same output. AI does not participate in this module.

## Goals

1. Honor non-negotiable protected blocks first.
2. Place fixed client windows next without overlap violations.
3. Reserve buffer time per daily settings.
4. Distribute remaining workable minutes across active clients by weight.
5. Fill client blocks with highest-priority, deadline-aware tasks.
6. On long break return, preserve protected blocks, compress client work proportionally, and defer low-priority work when blocks would fall below minimum viable size.

Staleness tracking does **not** change allocation order or durations; it only surfaces alerts in parallel (see [Staleness Interaction](#staleness-interaction)).

## Definitions

| Term | Meaning |
|------|---------|
| **Day window** | Interval from user wake time on `schedule_date` to sleep target (or default end of day, e.g. 23:00 if unset). |
| **Protected block** | Block from `protected_blocks` template: morning_routine, faith, meal, micro_break, winddown. |
| **Fixed client block** | Client with `fixed_block_enabled` and defined start/duration. |
| **Weighted client block** | Flexible time slot assigned by weight % among active clients. |
| **Buffer block** | Reserved slack time; not assigned to tasks. |
| **Minimum viable block (MVB)** | Configurable floor (`min_viable_block_minutes`, default 15). Below this, block is not created and tasks bump. |
| **Bump** | Task `deferred_to_date` set to next calendar day; removed from today's fill queue. |

## Inputs

```typescript
interface AllocationInput {
  scheduleDate: string;           // YYYY-MM-DD
  wakeTime: string;               // ISO local
  sleepTargetTime?: string;       // optional upper bound
  bufferPercent: number;        // 0-100 from daily_settings
  protectedBlocks: ProtectedBlockTemplate[];
  clients: ClientInput[];         // includes weights, fixed windows, is_active
  tasks: TaskInput[];             // pending/in_progress for fill
  minViableBlockMinutes: number;
  existingBreaks?: BreakInput[];  // for re-allocation context
}
```

## Outputs

```typescript
interface AllocationOutput {
  blocks: ScheduleBlock[];        // ordered planned blocks
  bumpedTaskIds: number[];
  warnings: string[];             // e.g. insufficient time, normalization applied
  remainingUnallocatedMinutes: number;
  metadata: {
    totalProtectedMinutes: number;
    totalFixedClientMinutes: number;
    totalWeightedMinutes: number;
    bufferMinutes: number;
  };
}
```

## Step-by-Step: Full Day Allocation

Execute steps in order. Each step operates on a **remaining timeline** (initially the full day window minus wake instant).

### Step 0: Initialize

1. Parse wake time and sleep target; compute `total_day_minutes`.
2. If wake time is after sleep target, return error/warning and empty blocks.
3. Build empty block list and mutable free intervals on the timeline (may use interval merging internally).
4. Load tasks queue: status `pending` or `in_progress`, not already deferred to a future date, sorted for fill (see [Task Ordering](#task-ordering)).

### Step 1: Place Protected Blocks

For each enabled `protected_blocks` row in `sort_order`:

1. Resolve start time from `anchor_type`:
   - `wake_offset`: wake + `anchor_value` minutes
   - `fixed_time`: clock time on schedule date
   - `relative`: encoded rule (e.g. before winddown)
2. Insert block with `block_type = protected` and `protected_subtype` set.
3. Remove occupied interval from free time.
4. Protected blocks are **immovable** in later steps except whole-day regeneration.

Multiple `meal` rows allowed (breakfast, lunch, dinner templates).

### Step 2: Place Fixed Client Blocks

For each active client with `fixed_block_enabled`:

1. Compute `[start, start + duration)`.
2. If overlap with existing protected block:
   - Prefer protected block; shift fixed client block later if gap exists, else mark warning and skip or shorten per implementation policy: **skip fixed placement and add warning** (documented: do not truncate protected blocks).
3. Insert block with `block_type = fixed_client`, `client_id` set.
4. Remove interval from free time.

Fixed blocks consume time but **task fill** happens in Step 5 per client block.

### Step 3: Apply Buffer

1. Compute **flexible minutes** (the pool shared between buffer and weighted client blocks):
   - When `capacityMinutes` is provided (`remaining_minutes_at_wake`):
     `flexible_minutes = max(0, capacityMinutes - protectedMinutes - fixedMinutes)`
   - When `capacityMinutes` is omitted (tests / legacy callers):
     `flexible_minutes = sum(timeline free gaps after Steps 1-2)`
2. `requested_buffer = floor(flexible_minutes * buffer_percent / 100)`
3. `buffer_minutes = min(requested_buffer, max_buffer_minutes)` (default cap: 60)
4. `distributable_minutes = flexible_minutes - buffer_minutes` (passed to Step 4 for weighted clients)
5. Allocate buffer as one `block_type = buffer` segment (prefer immediately before winddown, else first-fit in free intervals). If physical gaps cannot fit the computed duration, shorten placement and return freed minutes to the weighted pool.
6. Subtract buffer interval from timeline free gaps.

Buffer is not task-fillable. Clamped buffer excess is redistributed to weighted client allocation, not discarded.

### Step 4: Weighted Distribution of Remaining Time

1. Consider only **active** clients with `weight_percent > 0`.
2. If sum of weights ≠ 100, **normalize**: `effective_weight = weight / sum * 100`.
3. `distributable_minutes` is supplied from Step 3 (flexible pool minus buffer). Physical placement is limited by remaining timeline gaps.
4. For each client: `allocated = floor(distributable_minutes * effective_weight / 100)`.
5. Assign minutes to free intervals in timeline order (first-fit contiguous segments):
   - Create `block_type = weighted_client` blocks per client.
   - If a client's allocation cannot fit contiguously, split into multiple blocks ≥ MVB when possible; fragments < MVB merge into neighbor free space or convert to unallocated warnings.

6. Remove assigned intervals from free pool.

**Priority order among clients for same slot contention**: higher weight first, then lower `sort_order`, then lower `id`.

### Step 5: Task Filling by Priority and Deadline

For each client block (fixed and weighted), in chronological block order:

1. Select candidate tasks for that `client_id` from queue.
2. Assign tasks greedily until block `planned_duration_minutes` is filled by sum of `estimated_minutes` (default estimate 25 if null).
3. Primary assigned task stored in `task_id`; additional tasks may be listed in `metadata_json` if block spans multiple.
4. Partial last task: allowed if at least MVB worth of block remains dedicated to that task; otherwise leave block partially empty or pull smaller task.

Remove assigned tasks from queue when fully consumed; partial consumption reduces task estimate remainder for same day if supported, else treat as full slot assignment.

#### Task Ordering

Sort candidates by:

1. `deadline_date` ascending (nulls last)
2. `priority` ascending (1 before 5)
3. `created_at` ascending

Overdue deadlines (before schedule_date) sort before same-day deadlines.

### Step 6: Finalize

1. Assign `priority_order` monotonic by `planned_start`.
2. Compute metadata totals.
3. Any unused free minutes → `remainingUnallocatedMinutes` and optional warning.

Persist via main process to `daily_schedule` and update `daily_settings.allocation_version`.

## Re-Allocation After Long Break

Triggered when user ends a long break at `returnTime`. Input includes existing day blocks and completed/past blocks frozen.

### Freeze Rules

1. Blocks with `planned_end <= returnTime` or status `completed`: **unchanged**.
2. All **protected** blocks with `planned_start >= returnTime` or overlapping return: **unchanged** in duration and subtype (may shift only if originally tied to wake and wake unchanged; typically protected blocks stay fixed on clock).
3. Protected blocks that were **in progress** during break: preserve full planned duration from original plan (do not compress faith/meals/winddown).

### Compress Client Blocks

For all future blocks where `block_type` in (`fixed_client`, `weighted_client`) and `planned_start >= returnTime`:

1. Compute `remaining_client_minutes` = sum of planned durations of these future client blocks.
2. Compute `available_client_window` = free time from `returnTime` to day end minus immovable protected/buffer/winddown segments still scheduled ahead.
3. If `remaining_client_minutes <= available_client_window`: shift starts earlier/later to pack contiguously; no compression ratio needed.
4. If insufficient: apply **proportional compression**:
   - `ratio = available_client_window / remaining_client_minutes` (floor at 0)
   - Each client block new duration = `max(0, floor(old_duration * ratio))`
   - Mark blocks with reduced duration status `compressed` in metadata

5. Mark superseded rows in DB; insert new block rows (audit trail).

### Minimum Viable Block and Task Bumping

After compression:

1. Any client block with `planned_duration_minutes < min_viable_block_minutes`:
   - Remove block from schedule.
   - Tasks assigned only to that block return to bump evaluation.

2. **Bump order** (low priority first): sort by priority descending (5 before 1), then deadline nulls first, then latest deadline.
3. For each bumped task: set `deferred_to_date` to next calendar day, status remains `pending`.
4. Record bumped IDs in output.

High-priority tasks may steal time from lower-priority **future** blocks within same client if recomputation pass enabled: optional second pass tries to merge MVB-freed minutes into highest-priority incomplete blocks (same client first).

### Re-Run Task Fill

On compressed/resized client blocks, re-run Step 5 fill only for affected blocks with remaining task queue (excluding bumped tasks).

### Warnings

- "Schedule over-constrained after long break; N tasks deferred."
- "Client X below minimum block size; tasks moved to tomorrow."

## Day Re-Planned Summary (User-Facing)

After long-break re-allocation completes, the renderer shows a modal or inline summary titled **Day re-planned**. This is display-only; the schedule has already been persisted by the main process.

### Summary Contents

| Section | Data source |
|---------|-------------|
| Return time | User-confirmed end of long break |
| Time lost | Long break duration in minutes |
| Blocks removed | Client blocks dropped because compressed below MVB |
| Blocks compressed | Client blocks shortened with before/after durations |
| Tasks bumped to tomorrow | Task titles and client names from `bumpedTaskIds` |
| Protected blocks unchanged | Count and labels of protected blocks that were not modified |
| New timeline preview | Ordered list of remaining blocks from return time to end of day |

### UX Rules

- User must acknowledge the summary before returning to the active workspace (single primary button: "Got it" or "Continue day").
- Summary is also accessible from Schedule screen history for the current day (link: "View re-plan from [time]").
- If no blocks were compressed and no tasks bumped, show a lighter message: "Schedule adjusted for your return. No tasks moved to tomorrow."
- Staleness alerts may appear alongside the summary but are visually separate (notification bell, not inside the re-plan modal body).

## Micro-Breaks vs Scheduled micro_break

- **Popup micro-breaks** (~90 min): logged in `breaks_log`; do not automatically remove schedule blocks unless user extends into long break.
- **Protected `micro_break` template**: scheduled slot in Step 1 like other protected types.

Timer service triggers popups; engine may also place small protected micro_break slots if user enabled them in settings.

## Staleness Interaction

Staleness is **orthogonal** to allocation:

1. `clients_projects.last_touched_at` updated when user completes a block or task for that client.
2. Background checker compares `now - last_touched_at` to threshold (per-client override or global default).
3. Alerts emitted via IPC; Dashboard and Daily Insight display them.
4. Engine **does not** boost weight, insert extra blocks, or reorder tasks based on staleness in v0.1.0.

Future enhancement (not in scope): optional "stale client nudge" in Daily Insight text only.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No active clients | Only protected, buffer, and winddown blocks; warn |
| All weights zero | Normalize fails; no weighted blocks; warn |
| Wake time very late | Few or zero client blocks; bump excess tasks |
| Task estimates exceed block | Fill until full; remainder stays in queue |
| No tasks for client | Empty client block still shown (focus time without task) |
| Fixed block collision | Protected wins; fixed skipped with warning |
| Long break until after winddown | Only protected honored; all remaining client work bumped |
| Same task deadline multiple clients | Per-block fill; no cross-client task sharing |

## Constants (Defaults)

| Constant | Default | Source |
|----------|---------|--------|
| `min_viable_block_minutes` | 15 | app_settings |
| `max_buffer_minutes` | 60 | app_settings |
| `buffer_percent` | 10 | daily_settings / app_settings default |
| `default_task_estimate_minutes` | 25 | engine constant |
| Weight normalization | always if sum ≠ 100 | engine rule |

## Testing Requirements

Unit tests must cover:

1. Protected-first ordering and overlap rejection
2. Fixed client placement and collision with protected
3. Buffer subtraction correctness
4. Weight normalization (weights 20/30/50 and 10/10/10 edge)
5. Task ordering by deadline and priority
6. Long break 50% compression with MVB bumping
7. Empty client list and late wake time
8. Re-allocation idempotency given same return time and frozen past

## Module API

```typescript
// src/shared/allocation/index.ts
export function allocateDay(input: AllocationInput): AllocationOutput;

export function reallocateAfterLongBreak(
  input: AllocationInput,
  existingBlocks: ScheduleBlock[],
  returnTime: string,
  longBreakDurationMinutes: number
): AllocationOutput;
```

Pure functions only. Main process handles DB mapping and transactions.

## Related Documents

- [SCHEMA.md](./SCHEMA.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [rules.md](./rules.md)
