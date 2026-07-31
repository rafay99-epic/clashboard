import { KeyRound } from "lucide-react";

export function MissingClerkKey() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-6">
      <KeyRound className="text-primary h-7 w-7" />
      <h1 className="text-2xl font-semibold tracking-tight">
        Clashboard is not configured
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Authentication is handled by Clerk, and no publishable key was found.
        Create an application at dashboard.clerk.com, then add its key to
        <code className="mx-1">.env.local</code>:
      </p>
      <pre className="border-hairline overflow-x-auto rounded-lg border p-4 text-xs">
        VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
      </pre>
      <p className="text-muted-foreground text-sm leading-relaxed">
        The backend needs the matching JWT issuer domain from the Clerk JWT
        template named <code className="mx-1">convex</code>:
      </p>
      <pre className="border-hairline overflow-x-auto rounded-lg border p-4 text-xs">
        npx convex env set CLERK_JWT_ISSUER_DOMAIN
        https://your-app.clerk.accounts.dev
      </pre>
    </div>
  );
}
