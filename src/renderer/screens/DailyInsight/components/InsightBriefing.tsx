import ReactMarkdown from 'react-markdown'

interface InsightBriefingProps {
  content: string
  source: string
}

export function InsightBriefing({ content, source }: InsightBriefingProps): React.JSX.Element {
  return (
    <section className="focus-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="focus-section-title">Today&apos;s Briefing</h3>
        <span className="focus-badge focus-badge-mint capitalize">{source}</span>
      </div>
      <div className="prose prose-invert prose-sm mt-4 max-w-none text-text-secondary">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </section>
  )
}
