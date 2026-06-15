interface JarvisWaveformProps {
  bars?: number
  active?: boolean
  className?: string
}

export function JarvisWaveform({
  bars = 12,
  active = true,
  className = '',
}: JarvisWaveformProps): React.JSX.Element {
  return (
    <div className={`flex h-8 items-end justify-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className={`w-1 rounded-full bg-gradient-to-t from-accent-cyan/30 to-accent-mint ${
            active ? 'jarvis-wave-bar' : 'opacity-30'
          }`}
          style={{
            height: `${30 + (index % 5) * 12}%`,
            animationDelay: active ? `${index * 0.08}s` : undefined,
          }}
        />
      ))}
    </div>
  )
}
