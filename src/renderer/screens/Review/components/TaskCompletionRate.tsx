interface TaskCompletionRateProps {
  rate: number | null
  scheduledTaskBlocks: number
  completedTaskBlocks: number
}

export function TaskCompletionRate({
  rate,
  scheduledTaskBlocks,
  completedTaskBlocks,
}: TaskCompletionRateProps): React.JSX.Element {
  return (
    <section className="focus-panel p-5">
      <h3 className="text-sm font-semibold text-text-primary">Task Completion Rate</h3>
      {rate === null ? (
        <p className="mt-4 text-sm text-text-muted">No scheduled task blocks in this range.</p>
      ) : (
        <div className="mt-4">
          <p className="text-3xl font-semibold text-accent-mint">{rate}%</p>
          <p className="mt-2 text-sm text-text-secondary">
            {completedTaskBlocks} of {scheduledTaskBlocks} scheduled task blocks completed
          </p>
        </div>
      )}
    </section>
  )
}
