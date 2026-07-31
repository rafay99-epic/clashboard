import { useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { LogOut, User } from "lucide-react";

export function AccountMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false);

  const name = user?.fullName ?? user?.username ?? "Signed in";
  const email = user?.primaryEmailAddress?.emailAddress;
  const avatar = user?.imageUrl;

  return (
    <div className="flex items-center gap-2.5">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="border-hairline h-7 w-7 shrink-0 rounded-full border object-cover"
        />
      ) : (
        <span className="bg-foreground/[0.06] flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
          <User className="text-muted-foreground h-3.5 w-3.5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{name}</span>
        {email ? (
          <span className="text-muted-foreground block truncate text-[11px]">
            {email}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signOut({ redirectUrl: "/" });
        }}
        className="text-muted-foreground hover:text-destructive shrink-0 transition-colors disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
