import { Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Swords,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export function RootLayout() {
  const playerTag = useAppStore((s) => s.playerTag);
  const reset = useAppStore((s) => s.reset);

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Swords className="text-primary h-5 w-5" />
            <span>CoC Tracker</span>
          </Link>

          {playerTag ? (
            <nav className="flex items-center gap-1 text-sm">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/roster">
                  <Swords className="h-4 w-4" />
                  Roster
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/battles">
                  <Crosshair className="h-4 w-4" />
                  Battles
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/setup">
                  <Settings className="h-4 w-4" />
                  Setup
                </Link>
              </Button>
            </nav>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {playerTag ? (
              <>
                <span className="text-muted-foreground hidden text-sm sm:inline">
                  {playerTag}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={reset}
                  aria-label="Reset setup"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
