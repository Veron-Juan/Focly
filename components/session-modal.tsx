"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  onStartSession: (duration: number) => void
}

export function SessionModal({ isOpen, onClose, onStartSession }: SessionModalProps) {
  const [customDuration, setCustomDuration] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<number | null>(25) // Default to 25 minutes

  const presetDurations = [
    { label: "5 min", value: 5 },
    { label: "15 min", value: 15 },
    { label: "25 min", value: 25 },
    { label: "50 min", value: 50 },
  ]

  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        handleStartSession()
      } else if (event.key === "Escape") {
        onClose()
      } else if (event.key >= "1" && event.key <= "4") {
        const index = Number.parseInt(event.key) - 1
        if (presetDurations[index]) {
          setSelectedPreset(presetDurations[index].value)
          setCustomDuration("")
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isOpen, selectedPreset, customDuration])

  const handlePresetClick = (duration: number) => {
    setSelectedPreset(duration)
    setCustomDuration("")
  }

  const handleCustomChange = (value: string) => {
    setCustomDuration(value)
    setSelectedPreset(null)
  }

  const handleStartSession = () => {
    const duration = selectedPreset || Number.parseInt(customDuration) || 25
    onStartSession(duration * 60) // Convert to seconds
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-strong rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Focus Time</h2>
          <p className="text-muted-foreground">Select a preset duration or set your own</p>
        </div>

        {/* Preset Buttons */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-foreground mb-3 block">Quick Select</Label>
          <div className="grid grid-cols-2 gap-3">
            {presetDurations.map((preset, index) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? "default" : "outline"}
                className={`rounded-full py-3 transition-all duration-200 relative ${
                  selectedPreset === preset.value
                    ? "bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 scale-105"
                    : "glass border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:scale-105"
                }`}
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
                <span className="absolute -top-1 -right-1 text-xs text-muted-foreground">{index + 1}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div className="mb-8">
          <Label htmlFor="custom-duration" className="text-sm font-medium text-foreground mb-3 block">
            Custom Duration (minutes)
          </Label>
          <Input
            id="custom-duration"
            type="number"
            placeholder="Enter minutes..."
            value={customDuration}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="glass border-border/50 focus:border-primary/50 focus:ring-primary/25 rounded-xl py-3 transition-all duration-200"
            min="1"
            max="120"
          />
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartSession}
          className="w-full py-4 text-lg font-medium rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
        >
          Start Session
        </Button>

        {/* Keyboard shortcuts hint */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">1-4</kbd> for presets,{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to start
        </p>
      </div>
    </div>
  )
}
