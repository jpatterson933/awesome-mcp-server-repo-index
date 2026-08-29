import { delay } from "./delay.js";

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer");
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  return Number(error.status);
}

function retryAfterMs(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    typeof response !== "object" ||
    response === null ||
    !("headers" in response) ||
    typeof response.headers !== "object" ||
    response.headers === null
  ) {
    return undefined;
  }

  const headers = response.headers as Record<string, unknown>;
  const retryAfter = Number(headers["retry-after"]);
  return Number.isFinite(retryAfter) && retryAfter > 0
    ? retryAfter * 1_000
    : undefined;
}

export function isRetryableGithubError(error: unknown): boolean {
  const status = errorStatus(error);
  return status === 403 || status === 429 || (status !== undefined && status >= 500);
}

export async function withGithubRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1_000;
  const sleep = options.sleep ?? delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === attempts || !isRetryableGithubError(error)) throw error;
      const waitMs =
        retryAfterMs(error) ?? baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;
      await sleep(waitMs);
    }
  }

  throw new Error("Retry loop exited unexpectedly");
}
