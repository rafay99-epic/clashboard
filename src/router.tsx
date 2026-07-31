import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { RootLayout } from "@/components/layout/RootLayout";
import { RouteError, RouteNotFound } from "@/components/layout/RouteStates";
import { SetupPage } from "@/pages/SetupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RosterPage } from "@/pages/RosterPage";
import { BattlesPage } from "@/pages/BattlesPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { playerTag } = useAppStore.getState();
    if (!playerTag) {
      throw redirect({ to: "/setup" });
    }
  },
  component: DashboardPage,
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: SetupPage,
});

const rosterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roster",
  validateSearch: () => ({}),
  beforeLoad: () => {
    const { playerTag } = useAppStore.getState();
    if (!playerTag) {
      throw redirect({ to: "/setup" });
    }
  },
  component: RosterPage,
});

const battlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battles",
  beforeLoad: () => {
    const { playerTag } = useAppStore.getState();
    if (!playerTag) {
      throw redirect({ to: "/setup" });
    }
  },
  component: BattlesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  setupRoute,
  rosterRoute,
  battlesRoute,
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
