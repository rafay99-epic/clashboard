import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const clamp = (n: number) => Math.max(0, Math.min(1, n)) * 100;

export function Meter({
  value,
  solid,
  tone = "gold",
  thick,
  className,
}: {
  value: number;
  solid?: number;
  tone?: "gold" | "success" | "dim";
  thick?: boolean;
  className?: string;
}) {
  const pct = clamp(value);
  const fill =
    tone === "success"
      ? "bg-success"
      : tone === "dim"
        ? "bg-muted-foreground/40"
        : "bg-primary";
  return (
    <div
      className={cn(
        "bg-foreground/8 relative w-full overflow-hidden rounded-full",
        thick ? "h-[6px]" : "h-[3px]",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full transition-[width] duration-500",
          fill,
          solid === undefined ? "" : "opacity-35",
        )}
        style={{ width: `${pct}%` }}
      />
      {solid === undefined ? null : (
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-[width] duration-500",
            fill,
          )}
          style={{ width: `${clamp(solid)}%` }}
        />
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "gold" | "default";
}) {
  return (
    <div className="border-hairline flex min-w-0 flex-col gap-0.5 border-l pr-4 pl-4 first:border-l-0 first:pl-0">
      <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
        {label}
      </span>
      <span
        className={cn(
          "tnum truncate text-xl leading-tight font-semibold",
          tone === "gold" && "text-primary",
        )}
      >
        {value}
      </span>
      {hint ? (
        <span className="text-muted-foreground truncate text-xs">{hint}</span>
      ) : null}
    </div>
  );
}

export function SectionHead({
  title,
  meta,
  right,
  id,
}: {
  title: string;
  meta?: ReactNode;
  right?: ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="border-hairline flex scroll-mt-24 items-baseline justify-between gap-4 border-b pb-2"
    >
      <div className="flex items-baseline gap-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {meta ? (
          <span className="text-muted-foreground tnum text-xs">{meta}</span>
        ) : null}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      {icon ? <div className="text-muted-foreground/50">{icon}</div> : null}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {body ? (
        <p className="text-muted-foreground max-w-sm text-sm">{body}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorNote({
  message,
  onRetry,
  retrying,
  className,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/40 bg-destructive/10 flex items-start gap-3 border-l-2 py-2.5 pr-3 pl-3 text-sm",
        className,
      )}
    >
      <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-destructive-foreground/90 break-words">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="text-destructive-foreground/80 hover:text-destructive-foreground inline-flex shrink-0 items-center gap-1.5 text-xs font-medium underline-offset-4 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", retrying && "animate-spin")} />
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-5", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "-mb-px border-b-2 pb-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className="text-muted-foreground tnum ml-1.5 text-xs">
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
