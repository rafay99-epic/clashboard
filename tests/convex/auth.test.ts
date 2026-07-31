import { expect, test } from "bun:test";
import { ownsTag } from "../../convex/lib/auth";

const links = [{ playerTag: "20Q09Y0JU" }, { playerTag: "2PP" }];

test("ownsTag matches linked tags whatever the formatting", () => {
  expect(ownsTag(links, "#20q09y0ju")).toBe(true);
  expect(ownsTag(links, " 2pp ")).toBe(true);
});

test("ownsTag rejects tags the user has not linked", () => {
  expect(ownsTag(links, "2QQ")).toBe(false);
  expect(ownsTag([], "20Q09Y0JU")).toBe(false);
});
