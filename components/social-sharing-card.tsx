"use client"

import { Button } from "@/components/ui/button"
import { Share2, Trophy, Users, Zap, ArrowRight } from "lucide-react"

export function SocialSharingCard() {
  return (
    <div className="glass rounded-2xl p-8 hover:glass-strong transition-all duration-300 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-xl"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Share Your Progress</h3>
              <p className="text-sm text-muted-foreground">Inspire others and stay motivated</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                42
              </div>
              <div>
                <p className="font-medium text-foreground">Sessions completed this week</p>
                <p className="text-xs text-muted-foreground">+15% from last week</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
              Share
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-sm">
                🔥
              </div>
              <div>
                <p className="font-medium text-foreground">7-day focus streak</p>
                <p className="text-xs text-muted-foreground">Your longest streak yet!</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10">
              Share
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Join the community</p>
            <p className="text-xs text-muted-foreground">Connect with 12,000+ focused individuals</p>
          </div>
          <Button className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105">
            Join Community
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
