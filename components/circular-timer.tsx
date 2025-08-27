interface CircularTimerProps {
  progress: number
  timeDisplay: string
  size?: number
  isActive?: boolean
  isPaused?: boolean
}

export function CircularTimer({
  progress,
  timeDisplay,
  size = 280,
  isActive = false,
  isPaused = false,
}: CircularTimerProps) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="oklch(0.2 0.05 270 / 0.3)"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${isActive ? "animate-pulse" : ""}`}
          style={{
            filter: `drop-shadow(0 0 ${isActive ? "12px" : "8px"} oklch(0.65 0.25 320 / ${isActive ? "0.8" : "0.5"}))`,
          }}
        />
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isActive ? "oklch(0.7 0.3 320)" : "oklch(0.65 0.25 320)"} />
            <stop offset="100%" stopColor={isActive ? "oklch(0.75 0.35 320)" : "oklch(0.7 0.3 320)"} />
          </linearGradient>
        </defs>
      </svg>

      {/* Time Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-5xl font-bold text-foreground font-mono tracking-wider transition-all duration-300 ${isActive ? "scale-110" : ""}`}
        >
          {timeDisplay}
        </span>
        {isPaused && <span className="text-sm text-muted-foreground mt-2 animate-pulse">Paused</span>}
      </div>

      {/* Pulsing ring effect when active */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{
            background: `conic-gradient(from 0deg, oklch(0.65 0.25 320 / 0.3), oklch(0.7 0.3 320 / 0.3), oklch(0.65 0.25 320 / 0.3))`,
          }}
        />
      )}
    </div>
  )
}
