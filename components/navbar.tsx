"use client"

import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/20 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/90"></div>
            </div>
            <span className="ml-3 text-xl font-bold text-foreground">FocusFlow</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              About
            </a>
            <a
              href="#solutions"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              Solutions
            </a>
            <a
              href="#enterprise"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              Enterprise
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="px-6 py-2 rounded-full text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              Log in
            </Button>
            <Button className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
