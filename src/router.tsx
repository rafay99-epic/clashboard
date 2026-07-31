import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RootLayout } from "@/components/layout/RootLayout";
import { RouteError, RouteNotFound } from "@/components/layout/RouteStates";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { LandingPage } from "@/pages/LandingPage";
import { SsoCallbackPage } from "@/pages/SsoCallbackPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RosterPage } from "@/pages/RosterPage";
import { BattlesPage } from "@/pages/BattlesPage";

function guarded(children: ReactNode, requireAccount = true) {
  return (
    <RequireAuth>
      {requireAccount ? <RequireAccount>{children}</RequireAccount> : children}
    </RequireAuth>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const ssoCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sso-callback",
  component: SsoCallbackPage,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: () => guarded(<DashboardPage />),
});

const rosterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roster",
  validateSearch: () => ({}),
  component: () => guarded(<RosterPage />),
});

const battlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battles",
  component: () => guarded(<BattlesPage />),
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: () => guarded(<AccountsPage />, false),
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  ssoCallbackRoute,
  overviewRoute,
  rosterRoute,
  battlesRoute,
  accountsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: RouteNotFound,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
