import { Link, useRouter } from "@tanstack/react-router";
import { Compass, RotateCcw, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/bits";
import { friendlyError } from "@/lib/errors";

export function RouteError({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  const router = useRouter();
  const message = friendlyError(error);

  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <ServerCrash className="text-destructive/70 h-9 w-9" />
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          This screen could not load
        </h1>
        <p className="text-muted-foreground text-sm break-words">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => {
            reset?.();
            void router.invalidate();
          }}
        >
          <RotateCcw />
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload app
        </Button>
      </div>
      <details className="text-muted-foreground/70 max-w-lg text-left text-xs">
        <summary className="cursor-pointer">Technical detail</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
          {error.stack ?? error.message}
        </pre>
      </details>
    </div>
  );
}

export function RouteNotFound() {
  return (
    <EmptyState
      icon={<Compass className="h-8 w-8" />}
      title="Nothing here"
      body="That page does not exist in the tracker."
      action={
        <Button asChild variant="outline">
          <Link to="/">Back to the start</Link>
        </Button>
      }
    />
  );
}
