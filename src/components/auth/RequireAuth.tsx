import type { ReactNode } from "react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ShieldQuestion } from "lucide-react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { EmptyState } from "@/components/ui/bits";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthPending() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function SignInWall() {
  return (
    <EmptyState
      icon={<ShieldQuestion className="h-8 w-8" />}
      title="Sign in to see this"
      body="Villages are tied to your Clashboard account, so tracked tags and battle logs stay private to you."
      action={<GoogleButton />}
    />
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <AuthPending />
      </AuthLoading>
      <Unauthenticated>
        <SignInWall />
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}
