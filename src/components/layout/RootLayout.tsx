import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Crosshair,
  Gauge,
  LogOut,
  RefreshCw,
  Settings2,
  Shield,
  Swords,
  WifiOff,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useSync } from "@/hooks/useSync";
import { useBackendOnline } from "@/hooks/useBackendStatus";
import { relativeTime, cn } from "@/lib/utils";

const NAV: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { to: "/overview", label: "Overview", icon: Gauge },
  { to: "/roster", label: "Roster", icon: Swords },
  { to: "/battles", label: "Battles", icon: Crosshair },
  { to: "/accounts", label: "Accounts", icon: Settings2 },
];

function NavItem({
  to,
  label,
  icon: Icon,
  compactLayout,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  compactLayout?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group text-muted-foreground hover:text-foreground relative flex items-center gap-3 text-sm font-medium transition-colors",
        compactLayout
          ? "flex-col gap-1 py-2 text-[11px]"
          : "[&.active]:text-foreground py-2.5 pl-4",
      )}
      activeProps={{ className: "text-foreground active" }}
    >
      {!compactLayout && (
        <span className="bg-primary absolute top-1/2 left-0 h-0 w-[2px] -translate-y-1/2 transition-all group-[.active]:h-5" />
      )}
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function RootLayout() {
  const playerTag = useAppStore((s) => s.playerTag);
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const reset = useAppStore((s) => s.reset);
  const accounts = useAppStore((s) => s.accounts);
  const switchAccount = useAppStore((s) => s.switchAccount);
  const { sync, syncing, syncStatus } = useSync();
  const online = useBackendOnline();
  const navigate = useNavigate();

  const forget = async () => {
    reset();
    if (!useAppStore.getState().playerTag) await navigate({ to: "/" });
  };

  const showNav = Boolean(playerTag);
  const current = accounts.find((a) => a.tag === playerTag);
  const others = accounts.filter((a) => a.tag !== playerTag);

  const syncControl = (
    <button
      type="button"
      onClick={sync}
      disabled={syncing}
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium transition-colors disabled:opacity-60"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
      {syncing ? "Syncing…" : "Sync now"}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      {showNav && (
        <aside className="border-hairline sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r px-6 py-7 md:flex">
          <Link to="/overview" className="flex items-center gap-2.5">
            <Shield className="text-primary h-5 w-5" />
            <span className="text-[15px] font-semibold tracking-tight">
              Clashboard
            </span>
          </Link>

          <nav className="mt-9 flex flex-col">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          <div className="border-hairline mt-auto flex flex-col gap-2 border-t pt-4">
            <p className="truncate text-sm font-semibold">
              {current?.name ?? `#${playerTag}`}
            </p>
            {current ? (
              <p className="text-muted-foreground tnum -mt-1.5 truncate text-xs">
                #{playerTag}
              </p>
            ) : null}

            {others.length ? (
              <div className="flex flex-col gap-1 py-1">
                <span className="text-muted-foreground/70 text-[10px] tracking-wide uppercase">
                  Switch to
                </span>
                {others.map((account) => (
                  <button
                    key={account.tag}
                    type="button"
                    onClick={() => switchAccount(account.tag)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 truncate text-xs transition-colors"
                  >
                    <ArrowLeftRight className="h-3 w-3 shrink-0" />
                    <span className="truncate">{account.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  syncStatus === "error"
                    ? "bg-destructive"
                    : syncing
                      ? "bg-warning animate-pulse"
                      : "bg-success",
                )}
              />
              <span className="text-muted-foreground truncate text-xs">
                {syncStatus === "error"
                  ? "Sync failed"
                  : `Updated ${relativeTime(lastSyncAt)}`}
              </span>
            </div>
            {syncControl}
            <button
              type="button"
              onClick={forget}
              className="text-muted-foreground hover:text-destructive mt-1 inline-flex items-center gap-2 text-xs transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Forget this account
            </button>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {!online && (
          <div className="bg-destructive/15 border-destructive/40 text-destructive-foreground/90 flex items-center gap-2 border-b px-5 py-2 text-xs md:px-10">
            <WifiOff className="text-destructive h-3.5 w-3.5 shrink-0" />
            Lost connection to the tracker backend — showing the last data
            loaded. Check that <code className="mx-1">
              bun run convex:dev
            </code>{" "}
            is running.
          </div>
        )}

        {showNav && (
          <header className="border-hairline bg-background/80 sticky top-0 z-30 flex items-center justify-between gap-4 border-b px-5 py-3 backdrop-blur md:hidden">
            <Link
              to="/overview"
              className="flex items-center gap-2 font-semibold"
            >
              <Shield className="text-primary h-4.5 w-4.5" />
              Clashboard
              <span className="text-muted-foreground tnum text-xs font-normal">
                #{playerTag}
              </span>
            </Link>
            {syncControl}
          </header>
        )}

        <main
          className={cn(
            "mx-auto w-full flex-1 px-5 py-8 md:px-10 md:py-10",
            showNav ? "max-w-5xl" : "max-w-6xl",
            showNav && "pb-24 md:pb-10",
          )}
        >
          <Outlet />
        </main>

        {showNav && (
          <nav className="border-hairline bg-background/95 fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 backdrop-blur md:hidden">
            {NAV.map((item) => (
              <NavItem key={item.to} {...item} compactLayout />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
