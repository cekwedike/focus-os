interface WeightTotalBannerProps {
  total: number
}

export function WeightTotalBanner({ total }: WeightTotalBannerProps): React.JSX.Element {
  const isBalanced = Math.abs(total - 100) < 0.01
  const hasClients = total > 0

  if (!hasClients) {
    return (
      <div className="focus-subpanel px-3 py-2 text-sm text-text-secondary">
        When you add clients, give each a percentage of your flexible work time. Aim for 100%
        total so your day splits fairly.
      </div>
    )
  }

  return (
    <div
      className={`rounded-button border px-3 py-2 text-sm ${
        isBalanced
          ? 'border-accent-mint/30 bg-accent-mint/10 text-accent-mint'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      }`}
    >
      {isBalanced
        ? `Your active clients add up to ${total.toFixed(0)}% of flexible work time.`
        : `Your active clients add up to ${total.toFixed(0)}%. Try to reach 100% so Focus OS knows how to divide your day.`}
    </div>
  )
}
