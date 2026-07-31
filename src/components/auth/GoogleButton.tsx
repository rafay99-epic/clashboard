import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/bits";
import { friendlyError } from "@/lib/errors";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function GoogleButton({
  label = "Continue with Google",
  size = "default",
  variant = "default",
  className,
}: {
  label?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline";
  className?: string;
}) {
  const { signIn, isLoaded } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!isLoaded || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/overview",
      });
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={start}
        disabled={!isLoaded || busy}
      >
        {busy ? (
          <Loader2 className="animate-spin" />
        ) : (
          <GoogleMark className="h-4 w-4" />
        )}
        {busy ? "Opening Google…" : label}
      </Button>
      {error ? <ErrorNote className="mt-3" message={error} /> : null}
    </div>
  );
}
