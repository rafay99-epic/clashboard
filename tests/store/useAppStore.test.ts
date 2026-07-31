import { expect, test, beforeEach } from "bun:test";
import { useAppStore } from "@/store/useAppStore";

beforeEach(() => {
  useAppStore.setState({
    activeTag: null,
    activeBase: "home",
    syncStatus: "idle",
    lastSyncAt: null,
    lastError: null,
  });
});

test("setting the active tag normalises it and clears stale sync state", () => {
  useAppStore.setState({ syncStatus: "error", lastError: "boom" });
  useAppStore.getState().setActiveTag("#20q09y0ju");

  const state = useAppStore.getState();
  expect(state.activeTag).toBe("20Q09Y0JU");
  expect(state.syncStatus).toBe("idle");
  expect(state.lastError).toBeNull();
});

test("clearing the active tag leaves no selection behind", () => {
  useAppStore.getState().setActiveTag("2PP");
  useAppStore.getState().setActiveTag(null);
  expect(useAppStore.getState().activeTag).toBeNull();
});

test("resetSession drops the session but keeps the chosen base", () => {
  useAppStore.getState().setActiveBase("builder");
  useAppStore.getState().setActiveTag("2PP");
  useAppStore.setState({ lastSyncAt: 5, lastError: "x", syncStatus: "error" });

  useAppStore.getState().resetSession();
  const state = useAppStore.getState();
  expect(state.activeTag).toBeNull();
  expect(state.lastSyncAt).toBeNull();
  expect(state.lastError).toBeNull();
  expect(state.activeBase).toBe("builder");
});
