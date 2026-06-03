import { describe, it, expect } from "vitest";
import { parseCompleted, toggleId } from "./completion";

describe("parseCompleted", () => {
  it("returns an empty list for null/empty", () => {
    expect(parseCompleted(null)).toEqual([]);
    expect(parseCompleted("")).toEqual([]);
  });
  it("parses a stored array of ids", () => {
    expect(parseCompleted('["a","b"]')).toEqual(["a", "b"]);
  });
  it("tolerates malformed or wrong-typed storage", () => {
    expect(parseCompleted("{not json")).toEqual([]);
    expect(parseCompleted('{"a":1}')).toEqual([]);
    expect(parseCompleted('["a",1,null]')).toEqual(["a"]);
  });
});

describe("toggleId", () => {
  it("adds an id that is absent", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
  });
  it("removes an id that is present", () => {
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
  it("does not mutate the input", () => {
    const input = ["a"];
    toggleId(input, "b");
    expect(input).toEqual(["a"]);
  });
});
