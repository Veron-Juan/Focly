"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        // Refresca la página en login/logout para recargar datos del servidor
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          router.refresh();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Redirige al usuario a esta página después del login
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/20 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/90"></div>
            </div>
            <span className="ml-3 text-xl font-bold text-foreground">
              FocusFlow
            </span>
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
            {loading ? (
              // 1. Muestra un esqueleto de carga mientras se verifica la sesión
              <div className="h-10 w-32 rounded-full bg-muted/30 animate-pulse" />
            ) : user ? (
              // 2. Si hay un usuario, muestra su avatar y el botón de logout
              <>
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || "User Avatar"}
                  className="w-10 h-10 rounded-full border-2 border-primary/50"
                />
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="rounded-full"
                >
                  Log out
                </Button>
              </>
            ) : (
              // 3. Si no hay usuario, muestra los botones de login/signup
              <>
                <Button
                  variant="ghost"
                  onClick={handleGoogleLogin}
                  className="px-6 py-2 rounded-full text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  Log in
                </Button>
                <Button
                  onClick={handleGoogleLogin} // Ambos botones hacen lo mismo
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
