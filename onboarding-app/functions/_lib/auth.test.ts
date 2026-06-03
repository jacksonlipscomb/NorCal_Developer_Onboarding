import { describe, it, expect } from "vitest";
import { isAuthorized } from "./auth";

const expected = "norcal:s3cret";
const header = (user: string, pass: string) =>
  "Basic " + btoa(`${user}:${pass}`);

describe("isAuthorized", () => {
  it("accepts the exact matching credential", () => {
    expect(isAuthorized(header("norcal", "s3cret"), expected)).toBe(true);
  });
  it("rejects a wrong password", () => {
    expect(isAuthorized(header("norcal", "nope"), expected)).toBe(false);
  });
  it("rejects a wrong user", () => {
    expect(isAuthorized(header("admin", "s3cret"), expected)).toBe(false);
  });
  it("rejects a missing header", () => {
    expect(isAuthorized(null, expected)).toBe(false);
  });
  it("rejects a non-Basic scheme", () => {
    expect(isAuthorized("Bearer abc", expected)).toBe(false);
  });
  it("rejects invalid base64", () => {
    expect(isAuthorized("Basic !!!notbase64!!!", expected)).toBe(false);
  });
  it("fails closed when the expected credential is empty (secret unset)", () => {
    expect(isAuthorized(header("norcal", "s3cret"), "")).toBe(false);
    expect(isAuthorized(header("", ""), "")).toBe(false);
  });
});
