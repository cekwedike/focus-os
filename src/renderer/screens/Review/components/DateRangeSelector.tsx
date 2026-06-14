import { SegmentedControl } from '@renderer/components/ui/SegmentedControl'
import { TextInput } from '@renderer/components/ui/TextInput'
import type { ReviewRangePreset } from '../hooks/useReviewSummary'

interface DateRangeSelectorProps {
  preset: ReviewRangePreset
  startDate: string
  endDate: string
  onPresetChange: (preset: ReviewRangePreset) => void
  onCustomRangeChange: (startDate: string, endDate: string) => void
}

const presetOptions = [
  { value: 'this-week' as const, label: 'This Week' },
  { value: 'last-7' as const, label: 'Last 7 Days' },
  { value: 'last-30' as const, label: 'Last 30 Days' },
  { value: 'this-month' as const, label: 'This Month' },
  { value: 'custom' as const, label: 'Custom' },
]

export function DateRangeSelector({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onCustomRangeChange,
}: DateRangeSelectorProps): React.JSX.Element {
  return (
    <section className="rounded-button border border-surface-border bg-surface-card p-5">
      <h3 className="text-sm font-semibold text-text-primary">Date Range</h3>
      <div className="mt-3">
        <SegmentedControl
          value={preset}
          options={presetOptions}
          onChange={onPresetChange}
          ariaLabel="Review date range"
        />
      </div>
      {preset === 'custom' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs text-text-muted">Start Date</span>
            <TextInput
              value={startDate}
              onChange={(value) => onCustomRangeChange(value, endDate)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-text-muted">End Date</span>
            <TextInput
              value={endDate}
              onChange={(value) => onCustomRangeChange(startDate, value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
        </div>
      )}
    </section>
  )
}
