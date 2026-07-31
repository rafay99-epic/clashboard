import { expect, test } from "bun:test";
import { pickActiveAccount, sortAccounts } from "@/lib/accounts";
import type { TrackedAccount } from "@/types";

const account = (playerTag: string, createdAt: number): TrackedAccount => ({
  playerTag,
  name: `Player ${playerTag}`,
  createdAt,
});

const accounts = [account("2PP", 2), account("20Q09Y0JU", 1)];

test("picks the requested account regardless of tag formatting", () => {
  expect(pickActiveAccount(accounts, "#20q09y0ju")?.playerTag).toBe(
    "20Q09Y0JU",
  );
});

test("falls back to the first account when the tag is unknown or unset", () => {
  expect(pickActiveAccount(accounts, "NOPE")?.playerTag).toBe("2PP");
  expect(pickActiveAccount(accounts, null)?.playerTag).toBe("2PP");
});

test("returns null when nothing is linked", () => {
  expect(pickActiveAccount([], "2PP")).toBeNull();
  expect(pickActiveAccount([], null)).toBeNull();
});

test("sorts by link order without mutating the input", () => {
  const sorted = sortAccounts(accounts);
  expect(sorted.map((a) => a.playerTag)).toEqual(["20Q09Y0JU", "2PP"]);
  expect(accounts[0].playerTag).toBe("2PP");
});
