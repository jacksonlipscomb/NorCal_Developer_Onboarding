import { describe, it, expect, vi, afterEach } from "vitest";
import { withLogging, methodNotAllowed, json } from "./respond";
import type { Env } from "./env";

// Minimal context — withLogging/methodNotAllowed only read request.url and .method.
function ctx(
  method: string,
  url = "http://localhost/api/steps",
): EventContext<Env, string, unknown> {
  return {
    request: new Request(url, { method }),
  } as unknown as EventContext<Env, string, unknown>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("withLogging", () => {
  it("logs the real status on success and returns the response", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await withLogging(ctx("GET"), (requestId) =>
      Promise.resolve(json({ ok: true }, 200, requestId)),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();

    const logged = JSON.parse(log.mock.calls[0][0] as string);
    expect(logged.status).toBe(200);
    expect(logged.method).toBe("GET");
    expect(logged.path).toBe("/api/steps");
    expect(logged.requestId).toBeTruthy();
  });

  it("rethrows an unexpected error AND logs status 500 (fail-hard path)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const boom = new Error("db down");

    await expect(
      withLogging(ctx("GET"), () => Promise.reject(boom)),
    ).rejects.toThrow("db down");

    const logged = JSON.parse(log.mock.calls[0][0] as string);
    expect(logged.status).toBe(500);
  });
});

describe("methodNotAllowed", () => {
  it("returns a structured 405 with an Allow header and request id", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await methodNotAllowed(ctx("PUT"), "GET, POST");
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET, POST");
    expect(res.headers.get("x-request-id")).toBeTruthy();

    const body = (await res.json()) as { error: string; requestId: string };
    expect(body.error).toContain("GET, POST");
    expect(body.requestId).toBeTruthy();
  });
});
