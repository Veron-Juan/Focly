"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CircularTimer } from "@/components/circular-timer"
import { SessionModal } from "@/components/session-modal"
import { DistractionModal } from "@/components/distraction-modal"
import { WeeklyProgressChart, DistractionBreakdown, SessionStatistics } from "@/components/analytics-cards"
import { Navbar } from "@/components/navbar"
import { SocialSharingCard } from "@/components/social-sharing-card"
import { Play, Pause, Square, RotateCcw } from "lucide-react"

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [totalTime, setTotalTime] = useState(25 * 60)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDistractionModalOpen, setIsDistractionModalOpen] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [totalFocusTime, setTotalFocusTime] = useState(0)
  const [distractions, setDistractions] = useState<{ [key: string]: number }>({})
  const [showCelebration, setShowCelebration] = useState(false)

  const playNotificationSound = useCallback(() => {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      setIsPaused(false)

      const completedSession = {
        id: Date.now().toString(),
        duration: totalTime, // in seconds
        completedAt: new Date().toISOString(),
        type: "completed",
      }

      const existingSessions = JSON.parse(localStorage.getItem("focusSessions") || "[]")
      const newSessions = [...existingSessions, completedSession]
      localStorage.setItem("focusSessions", JSON.stringify(newSessions))
      setSessionsCompleted((prev) => prev + 1)
      setTotalFocusTime((prev) => prev + Math.round((totalTime / 3600) * 10) / 10)
      setShowCelebration(true)
      playNotificationSound()

      // Hide celebration after 3 seconds
      setTimeout(() => setShowCelebration(false), 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused, timeLeft, totalTime, playNotificationSound])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return // Don't trigger when typing in inputs

      switch (event.key.toLowerCase()) {
        case " ":
          event.preventDefault()
          if (isActive) {
            setIsPaused(!isPaused)
          }
          break
        case "r":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleReset()
          }
          break
        case "d":
          if (isActive && !isPaused) {
            setIsDistractionModalOpen(true)
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isActive, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  const handleStartSession = (duration: number) => {
    setTimeLeft(duration)
    setTotalTime(duration)
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  const handleReset = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeLeft(totalTime)
  }

  const handleDistraction = (distractionType: string) => {
    setIsActive(false)
    setIsPaused(false)

    // Calculate time focused before distraction
    const timeFocused = totalTime - timeLeft // in seconds

    if (timeFocused > 0) {
      const distractionSession = {
        id: Date.now().toString(),
        duration: timeFocused, // in seconds
        completedAt: new Date().toISOString(),
        type: "distracted",
        distractionType: distractionType,
      }

      const existingSessions = JSON.parse(localStorage.getItem("focusSessions") || "[]")
      const newSessions = [...existingSessions, distractionSession]
      localStorage.setItem("focusSessions", JSON.stringify(newSessions))
      const timeFocusedHours = timeFocused / 3600 // Convert to hours for display
      setTotalFocusTime((prev) => prev + Math.round(timeFocusedHours * 10) / 10)
    }

    setDistractions((prev) => ({
      ...prev,
      [distractionType]: (prev[distractionType] || 0) + 1,
    }))

    // Reset timer to original duration
    setTimeLeft(totalTime)
  }

  const hasAnalyticsData = sessionsCompleted > 0

  return (
    <>
      <Navbar />

      <main className="min-h-screen p-6 relative">
        {/* Celebration overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="glass-strong rounded-3xl p-8 text-center animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
              <p className="text-muted-foreground">Great job staying focused!</p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Main Timer Section */}
          <div className="flex flex-col items-center justify-center mb-12 pt-16">
            <div className="mb-8">
              <CircularTimer
                progress={progress}
                timeDisplay={formatTime(timeLeft)}
                size={280}
                isActive={isActive && !isPaused}
                isPaused={isPaused}
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              {!isActive ? (
                <Button
                  size="lg"
                  className="px-8 py-4 text-lg font-medium rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                  onClick={() => setIsModalOpen(true)}
                >
                  Choose Goal & Start
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 rounded-full glass border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 bg-transparent"
                    onClick={handlePauseResume}
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 rounded-full glass border-border/50 hover:border-destructive/50 hover:bg-destructive/10 transition-all duration-300 bg-transparent"
                    onClick={handleReset}
                  >
                    <Square className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 py-3 rounded-full glass border-border/50 hover:border-accent/50 hover:bg-accent/10 transition-all duration-300 bg-transparent"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="px-6 py-2 text-sm font-medium rounded-full glass border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 bg-transparent"
                  onClick={() => setIsDistractionModalOpen(true)}
                  disabled={isPaused}
                >
                  I Got Distracted
                </Button>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Shortcuts: <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to pause/resume,
                <kbd className="px-2 py-1 bg-muted rounded text-xs ml-1">D</kbd> for distraction,
                <kbd className="px-2 py-1 bg-muted rounded text-xs ml-1">Ctrl+R</kbd> to reset
              </p>
            </div>
          </div>

          {/* Analytics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Main Progress Chart - Full Width */}
            <div className="md:col-span-2 glass rounded-2xl p-6 h-full hover:glass-strong transition-all duration-300">
              <WeeklyProgressChart />
            </div>

            {/* Distraction Breakdown */}
            <div className="glass rounded-2xl p-6 h-full hover:glass-strong transition-all duration-300">
              <DistractionBreakdown
                hasData={hasAnalyticsData && Object.keys(distractions).length > 0}
                distractions={distractions}
              />
            </div>

            {/* Session Statistics */}
            <div className="glass rounded-2xl p-6 h-full hover:glass-strong transition-all duration-300">
              <SessionStatistics
                sessionsCompleted={sessionsCompleted}
                currentStreak={sessionsCompleted} // Simple streak calculation for now
                totalHours={totalFocusTime}
              />
            </div>
          </div>

          <div className="mt-6">
            <SocialSharingCard />
          </div>
        </div>

        <SessionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onStartSession={handleStartSession} />
        <DistractionModal
          isOpen={isDistractionModalOpen}
          onClose={() => setIsDistractionModalOpen(false)}
          onSelectDistraction={handleDistraction}
        />
      </main>
    </>
  )
}
