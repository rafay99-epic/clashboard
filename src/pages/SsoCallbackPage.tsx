import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export function SsoCallbackPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">Finishing sign-in…</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/overview"
        signUpFallbackRedirectUrl="/overview"
      />
    </>
  );
}
