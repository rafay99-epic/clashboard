import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/bits";
import { useAccounts } from "@/hooks/useAccounts";
import { AuthPending } from "@/components/auth/RequireAuth";

export function RequireAccount({ children }: { children: ReactNode }) {
  const { accounts, loading } = useAccounts();

  if (loading) return <AuthPending />;

  if (!accounts.length) {
    return (
      <EmptyState
        icon={<Swords className="h-8 w-8" />}
        title="No village linked yet"
        body="Add your Clash of Clans player tag to start tracking upgrades, roster and battles."
        action={
          <Button asChild>
            <Link to="/accounts">Add a player tag</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
