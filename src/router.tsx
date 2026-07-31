import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { RootLayout } from "@/components/layout/RootLayout";
import { RouteError, RouteNotFound } from "@/components/layout/RouteStates";
import { LandingPage } from "@/pages/LandingPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RosterPage } from "@/pages/RosterPage";
import { BattlesPage } from "@/pages/BattlesPage";

function requireTag() {
  if (!useAppStore.getState().playerTag) {
    throw redirect({ to: "/" });
  }
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (useAppStore.getState().playerTag) {
      throw redirect({ to: "/overview" });
    }
  },
  component: LandingPage,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  beforeLoad: requireTag,
  component: DashboardPage,
});

const rosterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roster",
  validateSearch: () => ({}),
  beforeLoad: requireTag,
  component: RosterPage,
});

const battlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battles",
  beforeLoad: requireTag,
  component: BattlesPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  beforeLoad: requireTag,
  component: AccountsPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
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
