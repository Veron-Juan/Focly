"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DistractionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectDistraction: (distraction: string) => void
}

const distractionTypes = [
  { label: "Social Media", icon: "📱" },
  { label: "Noise", icon: "🔊" },
  { label: "Thoughts", icon: "💭" },
  { label: "Phone Call", icon: "📞" },
  { label: "Email/Messages", icon: "✉️" },
  { label: "Hunger/Thirst", icon: "🍎" },
  { label: "Bathroom Break", icon: "🚿" },
  { label: "Other", icon: "❓" },
]

export function DistractionModal({ isOpen, onClose, onSelectDistraction }: DistractionModalProps) {
  const handleSelectDistraction = (distraction: string) => {
    onSelectDistraction(distraction)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-strong rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-primary/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">What Distracted You?</h2>
          <p className="text-muted-foreground">Select the type of distraction</p>
        </div>

        {/* Distraction Types */}
        <div className="grid grid-cols-2 gap-3">
          {distractionTypes.map((distraction) => (
            <Button
              key={distraction.label}
              variant="outline"
              className="glass border-border/50 hover:border-primary/50 hover:bg-primary/10 rounded-xl py-4 h-auto flex flex-col items-center gap-2 transition-all duration-200 hover:scale-[1.02] bg-transparent"
              onClick={() => handleSelectDistraction(distraction.label)}
            >
              <span className="text-2xl">{distraction.icon}</span>
              <span className="text-sm font-medium">{distraction.label}</span>
            </Button>
          ))}
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Don't worry! Tracking distractions helps you improve focus over time.
        </p>
      </div>
    </div>
  )
}
