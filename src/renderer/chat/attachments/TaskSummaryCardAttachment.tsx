import type { TaskSummaryCardAttachment } from '@shared/types/chat'

interface TaskSummaryCardAttachmentViewProps {
  attachment: TaskSummaryCardAttachment
}

export function TaskSummaryCardAttachmentView({
  attachment,
}: TaskSummaryCardAttachmentViewProps): React.JSX.Element {
  return (
    <div className="mt-2 rounded-panel border border-surface-border/80 bg-surface-elevated/40 p-3">
      <p className="focus-kicker mb-2">Tasks</p>
      <ul className="space-y-2">
        {attachment.tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-button border border-surface-border/60 bg-surface-card/50 px-2.5 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-text-primary">{task.title}</span>
              <span className="text-text-muted">P{task.priority}</span>
            </div>
            <p className="mt-1 text-text-muted">
              {task.clientName}
              {task.deadlineDate ? ` · due ${task.deadlineDate}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
