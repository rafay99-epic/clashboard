import {
  Crosshair,
  Gauge,
  Layers,
  Shield,
  Swords,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const FEATURES: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}[] = [
  {
    icon: Gauge,
    title: "Know what is left",
    body: "Every hero, pet, equipment, troop and spell measured against its max, with the exact number of upgrade levels still ahead of you.",
  },
  {
    icon: Layers,
    title: "All three villages",
    body: "Home Village, Builder Base and Clan Capital on one page. Search any unit, filter to what is mid-upgrade, maxed or still locked.",
  },
  {
    icon: Crosshair,
    title: "Battles worth reading",
    body: "Attacks and defenses as a timeline, with destruction, loot taken or lost, and defenses you actually held.",
  },
  {
    icon: Swords,
    title: "Armies decoded",
    body: "Open any battle to see the army used against you — heroes, pets, equipment, troops, spells — and copy it straight into the game.",
  },
  {
    icon: UsersRound,
    title: "Every account you play",
    body: "Track as many tags as you like and switch between them in one click. Verify a tag is yours with the in-game API token.",
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-col gap-20 py-10">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <span className="text-primary flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase">
            <Shield className="h-4 w-4" />
            Clashboard
          </span>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            Your village, measured against{" "}
            <span className="text-primary">max</span>.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
            A progress tracker for Clash of Clans that answers one question
            honestly: what is actually left to upgrade. Sign in, paste your
            player tag, and every village you play stays in one place.
          </p>

          <div className="border-hairline flex max-w-md flex-col gap-4 border-t pt-6">
            <Unauthenticated>
              <GoogleButton size="lg" />
              <p className="text-muted-foreground text-xs">
                Sign in with Google, then add your player tag. Tracked villages
                stay private to your account.
              </p>
            </Unauthenticated>
            <Authenticated>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link to="/overview">Open your dashboard</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/accounts">Add a player tag</Link>
                </Button>
              </div>
            </Authenticated>
          </div>
        </div>

        <div className="border-hairline relative hidden overflow-hidden rounded-2xl border p-8 lg:block">
          <div className="bg-primary/10 absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Home village
              </span>
              <span className="tnum text-primary text-3xl font-semibold">
                68%
              </span>
            </div>
            {[
              { label: "Heroes", value: 0.74, solid: 0.33 },
              { label: "Hero Equipment", value: 0.52, solid: 0.18 },
              { label: "Pets", value: 0.61, solid: 0.25 },
              { label: "Troops", value: 0.83, solid: 0.55 },
              { label: "Spells", value: 0.9, solid: 0.7 },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium">{row.label}</span>
                  <span className="tnum text-muted-foreground">
                    {Math.round(row.value * 100)}%
                  </span>
                </div>
                <div className="bg-foreground/8 relative h-[6px] w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary/35 h-full"
                    style={{ width: `${row.value * 100}%` }}
                  />
                  <div
                    className="bg-primary absolute inset-y-0 left-0"
                    style={{ width: `${row.solid * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-muted-foreground/70 text-[11px]">
              Solid gold is fully maxed. Translucent is levels earned so far.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className="border-hairline border-b pb-3 text-sm font-semibold tracking-wide uppercase">
          What you get
        </h2>
        <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2.5">
              <feature.icon className="text-primary h-5 w-5" />
              <h3 className="text-[15px] font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-hairline flex flex-col gap-3 border-t pt-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Where the data comes from
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Everything is pulled from the official Clash of Clans API and cached
          on the backend, so nothing is scraped and nothing is guessed. Building
          levels are the one gap — the API does not expose them, so buildings
          are listed for reference only. This material is unofficial and is not
          endorsed by Supercell.
        </p>
      </section>
    </div>
  );
}
