interface RawSnapshotPanelProps {
  content: string
}

export function RawSnapshotPanel({ content }: RawSnapshotPanelProps): React.JSX.Element {
  return (
    <section className="rounded-button border border-amber-400/30 bg-amber-400/5 p-5">
      <h3 className="text-sm font-semibold text-amber-100">Local Data Summary</h3>
      <p className="mt-1 text-xs text-text-muted">
        AI providers were unavailable. Here is a readable summary from your local data.
      </p>
      <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-secondary">
        {content}
      </pre>
    </section>
  )
}
