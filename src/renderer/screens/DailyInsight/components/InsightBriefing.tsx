import ReactMarkdown from 'react-markdown'

interface InsightBriefingProps {
  content: string
  source: string
}

export function InsightBriefing({ content, source }: InsightBriefingProps): React.JSX.Element {
  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Briefing</h3>
        <span className="rounded-full border border-surface-border px-2 py-0.5 text-xs capitalize text-text-muted">
          {source}
        </span>
      </div>
      <div className="prose prose-invert prose-sm mt-4 max-w-none text-text-secondary">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </section>
  )
}
