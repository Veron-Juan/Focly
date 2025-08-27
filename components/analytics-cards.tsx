"use client"

import { Area, AreaChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useState, useEffect } from "react"

const chartConfig = {
  minutes: {
    label: "Focus Minutes",
    color: "oklch(0.65 0.25 320)",
  },
}

function getSessionData() {
  if (typeof window === "undefined") return []
  const sessions = localStorage.getItem("focusSessions")
  return sessions ? JSON.parse(sessions) : []
}

function aggregateDataByPeriod(sessions: any[], period: "day" | "week" | "month") {
  const now = new Date()
  const data: { [key: string]: number } = {}

  if (period === "day") {
    // Group by hour for today
    const today = now.toDateString()
    const todaySessions = sessions.filter((session) => new Date(session.completedAt).toDateString() === today)

    for (let hour = 0; hour < 24; hour++) {
      const hourKey = `${hour.toString().padStart(2, "0")}:00`
      data[hourKey] = 0
    }

    todaySessions.forEach((session) => {
      const sessionDate = new Date(session.completedAt)
      const hourKey = `${sessionDate.getHours().toString().padStart(2, "0")}:00`
      data[hourKey] += Math.round(session.duration / 60) // Convert seconds to minutes
    })

    return Object.entries(data)
      .filter(([_, minutes]) => minutes > 0 || Object.keys(data).indexOf(_) % 4 === 0) // Show every 4th hour or hours with data
      .map(([time, minutes]) => ({ time, minutes }))
      .slice(0, 12) // Limit to 12 data points
  }

  if (period === "week") {
    // Group by day for this week
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    days.forEach((day) => (data[day] = 0))

    sessions.forEach((session) => {
      const sessionDate = new Date(session.completedAt)
      if (sessionDate >= weekStart) {
        const dayName = days[sessionDate.getDay()]
        data[dayName] += Math.round(session.duration / 60) // Convert seconds to minutes
      }
    })

    return days.map((day) => ({ day, minutes: data[day] }))
  }

  if (period === "month") {
    // Group by week for this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    for (let week = 1; week <= 4; week++) {
      data[`Week ${week}`] = 0
    }

    sessions.forEach((session) => {
      const sessionDate = new Date(session.completedAt)
      if (sessionDate >= monthStart) {
        const weekOfMonth = Math.ceil(sessionDate.getDate() / 7)
        const weekKey = `Week ${Math.min(weekOfMonth, 4)}`
        data[weekKey] += Math.round(session.duration / 60) // Convert seconds to minutes
      }
    })

    return Object.entries(data).map(([day, minutes]) => ({ day, minutes }))
  }

  return []
}

export function WeeklyProgressChart({ hasData = true }: { hasData?: boolean }) {
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month">("week")
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const sessions = getSessionData()
    const aggregatedData = aggregateDataByPeriod(sessions, timePeriod)
    setChartData(aggregatedData)
  }, [timePeriod])

  useEffect(() => {
    const handleStorageChange = () => {
      const sessions = getSessionData()
      const aggregatedData = aggregateDataByPeriod(sessions, timePeriod)
      setChartData(aggregatedData)
    }

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleStorageChange)

    // Also check for changes periodically since localStorage changes in same tab don't trigger storage event
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [timePeriod])

  const actuallyHasData = chartData.some((item) => item.minutes > 0)


  if (!actuallyHasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-8">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-2xl" />
          <div className="absolute bottom-8 left-4 w-24 h-24 rounded-full bg-gradient-to-br from-accent/10 to-primary/5 blur-xl" />
        </div>

        <div className="relative z-10 mb-8">
          <div className="relative">
            {/* Mock chart lines */}
            <svg width="280" height="120" viewBox="0 0 280 120" className="opacity-30">
              <defs>
                <linearGradient id="mockGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.65 0.25 320)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.65 0.25 320)" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="mockGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.7 0.3 340)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.7 0.3 340)" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <g stroke="oklch(0.3 0.05 270 / 0.2)" strokeWidth="1">
                <line x1="0" y1="30" x2="280" y2="30" />
                <line x1="0" y1="60" x2="280" y2="60" />
                <line x1="0" y1="90" x2="280" y2="90" />
              </g>

              {/* Mock data lines */}
              <path
                d="M20 80 L60 65 L100 70 L140 45 L180 50 L220 30 L260 25"
                stroke="oklch(0.65 0.25 320)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M20 90 L60 85 L100 75 L140 70 L180 60 L220 55 L260 45"
                stroke="oklch(0.7 0.3 340)"
                strokeWidth="2"
                fill="none"
              />

              {/* Data points */}
              <circle cx="260" cy="25" r="3" fill="oklch(0.65 0.25 320)" className="animate-pulse" />
              <circle cx="260" cy="45" r="3" fill="oklch(0.7 0.3 340)" className="animate-pulse delay-300" />
            </svg>

            {/* Floating tooltip mockup */}
            <div className="absolute top-2 right-8 glass border border-border/50 rounded-lg p-3 text-xs ">
              <div className="text-muted-foreground mb-1">Today</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-foreground">Focus Time</span>
                <span className="text-muted-foreground ml-auto">0m</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-2xl font-bold text-foreground mb-3">Supercharge your focus journey</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            From first session to deep work mastery, understand exactly how your focus sessions drive productivity with
            our powerful analytics engine.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Focus Time This {timePeriod === "day" ? "Day" : timePeriod === "week" ? "Week" : "Month"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Your {timePeriod === "day" ? "hourly" : timePeriod === "week" ? "daily" : "weekly"} focus sessions in
            minutes
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-full glass border border-border/50">
          {(["day", "week", "month"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                timePeriod === period
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.25 320)" stopOpacity={0.8} />
                <stop offset="100%" stopColor="oklch(0.7 0.3 340)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.05 270 / 0.3)" />
            <XAxis
              dataKey={timePeriod === "day" ? "time" : "day"}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.7 0 0)", fontSize: 12 }}
              tickFormatter={(value) => `${value}m`}
            />
            <ChartTooltip content={<ChartTooltipContent />} formatter={(value: any) => [`${value}m`, "Focus Time"]} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="oklch(0.65 0.25 320)"
              strokeWidth={3}
              fill="url(#focusGradient)"
              dot={{ fill: "oklch(0.65 0.25 320)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "oklch(0.7 0.3 340)", stroke: "oklch(0.98 0 0)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

export function DistractionBreakdown({
  hasData = true,
  distractions = {},
}: {
  hasData?: boolean
  distractions?: { [key: string]: number }
}) {
  if (!hasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-6 ">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-6 left-6 w-20 h-20 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5 blur-xl" />
          <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 blur-lg" />
        </div>

        <div className="relative z-10 mb-6">
          {/* Mock pie chart */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg width="96" height="96" viewBox="0 0 96 96" className="opacity-20">
              <circle
                cx="48"
                cy="48"
                r="32"
                fill="none"
                stroke="oklch(0.6 0.2 280)"
                strokeWidth="12"
                strokeDasharray="100 100"
                className="animate-pulse"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-green-400">
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-bold text-foreground mb-2">Master your attention</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
            Track what breaks your focus and transform distractions into insights for deeper concentration.
          </p>
        </div>
      </div>
    )
  }

  // Convert distractions object to chart data
  const colors = [
    "oklch(0.65 0.25 320)",
    "oklch(0.6 0.2 280)",
    "oklch(0.7 0.3 340)",
    "oklch(0.55 0.15 300)",
    "oklch(0.75 0.25 310)",
  ]
  const totalDistractions = Object.values(distractions).reduce((sum, count) => sum + count, 0)

  const distractionData = Object.entries(distractions).map(([name, count], index) => ({
    name,
    value: Math.round((count / totalDistractions) * 100),
    count,
    color: colors[index % colors.length],
  }))

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Distractions</h3>
        <p className="text-sm text-muted-foreground">What breaks your focus</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distractionData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {distractionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 ml-4 space-y-2">
          {distractionData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-foreground">{item.name}</span>
              </div>
              <span className="text-muted-foreground">{item.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SessionStatistics({
  sessionsCompleted = 0,
  currentStreak = 0,
  totalHours = 0,
}: {
  sessionsCompleted?: number
  currentStreak?: number
  totalHours?: number
}) {
  const hasData = sessionsCompleted > 0 || currentStreak > 0 || totalHours > 0

  if (!hasData) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full text-center p-6">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-lg" />
          <div className="absolute bottom-6 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/5 blur-md" />
        </div>

        <div className="relative z-10 mb-6">
          {/* Mock stats cards */}
          <div className="space-y-3 w-full max-w-[200px] flex">
            <div className="glass border border-border/30 rounded-lg p-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                </div>
                <div className="flex-1">
                  <div className="w-8 h-4 bg-muted/30 rounded mb-1"></div>
                  <div className="w-16 h-2 bg-muted/20 rounded"></div>
                </div>
              </div>
            </div>

            <div className="glass border border-border/30 rounded-lg p-3 animate-pulse delay-150">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-orange-400/40"></div>
                </div>
                <div className="flex-1">
                  <div className="w-6 h-4 bg-muted/30 rounded mb-1"></div>
                  <div className="w-14 h-2 bg-muted/20 rounded"></div>
                </div>
              </div>
            </div>

            <div className="glass border border-border/30 rounded-lg p-3 animate-pulse delay-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-400">
                    <path
                      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-400">
                      <path
                        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalHours}h</div>
                  <div className="text-sm text-muted-foreground">Total Hours Focused</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-bold text-foreground mb-2">Build your legacy</h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Every session counts. Start your first focus session and watch your productivity metrics come to life.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Your Stats</h3>
        <p className="text-sm text-muted-foreground">Track your progress</p>
      </div>
      <div className="space-y-4">
        <div className="relative p-4 rounded-xl glass border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{sessionsCompleted}</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
          </div>
        </div>

        <div className="relative p-4 rounded-xl glass border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-orange-400">
                <path
                  d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
          </div>
        </div>

        <div className="relative p-4 rounded-xl glass border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-400">
                <path
                  d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">{totalHours}h</div>
              <div className="text-sm text-muted-foreground">Total Hours Focused</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
