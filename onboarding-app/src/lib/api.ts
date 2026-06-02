import type { OnboardingStep } from "@/data/types";

// Typed fetch wrappers for the edge API. Every call throws on a non-2xx response,
// surfacing the server's `error` message so the UI can show it inline (no silent
// failures, no optimistic updates).
async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Non-JSON error body (e.g. a platform 500) — keep the status message.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function listSteps(): Promise<OnboardingStep[]> {
  const { steps } = await request<{ steps: OnboardingStep[] }>("/api/steps");
  return steps;
}

export async function createStep(input: {
  title: string;
  body: string;
}): Promise<OnboardingStep> {
  const { step } = await request<{ step: OnboardingStep }>("/api/steps", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return step;
}

export async function updateStep(
  id: string,
  input: { title?: string; body?: string },
): Promise<OnboardingStep> {
  const { step } = await request<{ step: OnboardingStep }>(
    `/api/steps/${id}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  return step;
}

export async function deleteStep(id: string): Promise<OnboardingStep> {
  const { step } = await request<{ step: OnboardingStep }>(
    `/api/steps/${id}`,
    { method: "DELETE" },
  );
  return step;
}
