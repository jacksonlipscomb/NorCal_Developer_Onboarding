import { describe, it, expect } from "vitest";
import {
  validateCreate,
  validatePatch,
  isUuid,
  readJsonBody,
} from "./validation";
import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH } from "../../src/data/types";

function jsonRequest(body: string, contentType = "application/json"): Request {
  return new Request("http://localhost/api/steps", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("isUuid", () => {
  it("accepts a well-formed v4 uuid", () => {
    expect(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true);
  });
  it("rejects malformed ids", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("123")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

describe("validateCreate", () => {
  it("accepts a valid payload and trims the title", () => {
    const r = validateCreate({ title: "  Slack  ", body: "Do the thing" });
    expect(r).toEqual({ ok: true, value: { title: "Slack", body: "Do the thing" } });
  });
  it("rejects a non-object body", () => {
    expect(validateCreate("nope").ok).toBe(false);
    expect(validateCreate(["a"]).ok).toBe(false);
    expect(validateCreate(null).ok).toBe(false);
  });
  it("rejects unknown keys", () => {
    const r = validateCreate({ title: "a", body: "b", position: 1 });
    expect(r.ok).toBe(false);
  });
  it("rejects missing or blank fields", () => {
    expect(validateCreate({ title: "a" }).ok).toBe(false);
    expect(validateCreate({ title: "   ", body: "b" }).ok).toBe(false);
    expect(validateCreate({ title: "a", body: "   " }).ok).toBe(false);
  });
  it("rejects non-string fields", () => {
    expect(validateCreate({ title: 5, body: "b" }).ok).toBe(false);
  });
  it("rejects oversized fields", () => {
    expect(
      validateCreate({ title: "x".repeat(TITLE_MAX_LENGTH + 1), body: "b" }).ok,
    ).toBe(false);
    expect(
      validateCreate({ title: "a", body: "x".repeat(BODY_MAX_LENGTH + 1) }).ok,
    ).toBe(false);
  });
});

describe("validatePatch", () => {
  it("accepts a single editable field", () => {
    expect(validatePatch({ title: "New" })).toEqual({
      ok: true,
      value: { title: "New" },
    });
    expect(validatePatch({ body: "New body" })).toEqual({
      ok: true,
      value: { body: "New body" },
    });
  });
  it("rejects an empty patch (no editable field)", () => {
    expect(validatePatch({}).ok).toBe(false);
  });
  it("rejects unknown keys", () => {
    expect(validatePatch({ deleted_at: null }).ok).toBe(false);
  });
  it("rejects blank or non-string values when present", () => {
    expect(validatePatch({ title: "  " }).ok).toBe(false);
    expect(validatePatch({ body: 7 }).ok).toBe(false);
  });
});

describe("readJsonBody", () => {
  it("accepts application/json with charset params", async () => {
    const r = await readJsonBody(
      jsonRequest('{"title":"a"}', "application/json; charset=utf-8"),
    );
    expect(r).toEqual({ ok: true, value: { title: "a" } });
  });
  it("rejects a non-JSON content type", async () => {
    const r = await readJsonBody(jsonRequest("{}", "text/plain"));
    expect(r.ok).toBe(false);
  });
  it("rejects a malformed MIME type that merely contains application/json", async () => {
    const r = await readJsonBody(
      jsonRequest("{}", "text/application/json-invalid"),
    );
    expect(r.ok).toBe(false);
  });
  it("rejects malformed JSON", async () => {
    const r = await readJsonBody(jsonRequest("{not json"));
    expect(r.ok).toBe(false);
  });
});
