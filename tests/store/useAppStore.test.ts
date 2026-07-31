import { expect, test, beforeEach } from "bun:test";
import { useAppStore } from "@/store/useAppStore";

const reset = () =>
  useAppStore.setState({ playerTag: null, accounts: [], lastError: null });

beforeEach(reset);

test("adding accounts switches to the new one and keeps the old", () => {
  const s = useAppStore.getState();
  s.addAccount("#20Q09Y0JU", "Rafay99");
  s.addAccount("2PP", "Alt");

  const { accounts, playerTag } = useAppStore.getState();
  expect(accounts.map((a) => a.tag)).toEqual(["20Q09Y0JU", "2PP"]);
  expect(playerTag).toBe("2PP");
});

test("re-adding a tag updates the name instead of duplicating", () => {
  const s = useAppStore.getState();
  s.addAccount("2PP", "Old");
  s.addAccount("#2pp", "New");
  expect(useAppStore.getState().accounts).toEqual([
    { tag: "2PP", name: "New" },
  ]);
});

test("switching clears stale sync state", () => {
  const s = useAppStore.getState();
  s.addAccount("2PP", "A");
  s.addAccount("2QQ", "B");
  useAppStore.setState({ lastError: "boom", syncStatus: "error" });

  useAppStore.getState().switchAccount("2PP");
  const after = useAppStore.getState();
  expect(after.playerTag).toBe("2PP");
  expect(after.lastError).toBeNull();
  expect(after.syncStatus).toBe("idle");
});

test("verification sticks to the account and survives a re-add", () => {
  const s = useAppStore.getState();
  s.addAccount("2PP", "A");
  s.markVerified("#2pp", 1234);
  expect(useAppStore.getState().accounts[0].verifiedAt).toBe(1234);

  useAppStore.getState().addAccount("2PP", "A renamed");
  expect(useAppStore.getState().accounts[0]).toEqual({
    tag: "2PP",
    name: "A renamed",
    verifiedAt: 1234,
  });
});

test("removing the active account falls back to another", () => {
  const s = useAppStore.getState();
  s.addAccount("2PP", "A");
  s.addAccount("2QQ", "B");

  useAppStore.getState().removeAccount("2QQ");
  expect(useAppStore.getState().playerTag).toBe("2PP");

  useAppStore.getState().removeAccount("2PP");
  expect(useAppStore.getState().playerTag).toBeNull();
  expect(useAppStore.getState().accounts).toEqual([]);
});
