// The ONLY code allowed to talk to api.todoist.com. Read-only: GET, nothing else. (docs/PLAN.md §0, §4)
// Never log the token. Never add another method here; see CLAUDE.md.

export const TODOIST_API_BASE = 'https://api.todoist.com/api/v1';

const ALLOWED = new Set(['GET']);

export class TodoistError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'TodoistError';
  }
}

/** Throws for anything but GET. Every request goes through this. */
export function assertReadOnly(method: string): void {
  if (!ALLOWED.has(method.toUpperCase())) {
    throw new TodoistError(`Hive is read-only: ${method} to Todoist is not allowed`);
  }
}

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface ClientOptions {
  /** Injected in tests; defaults to global fetch. */
  fetch?: FetchLike;
}

export function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(TODOIST_API_BASE + (path.startsWith('/') ? path : `/${path}`));
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  if (url.host !== 'api.todoist.com') throw new TodoistError('Unexpected Todoist host');
  return url.toString();
}

export async function todoistGet<T>(
  path: string,
  token: string,
  params?: Record<string, string>,
  opts: ClientOptions = {},
): Promise<T> {
  const method = 'GET';
  assertReadOnly(method);
  const doFetch: FetchLike = opts.fetch ?? (globalThis.fetch as unknown as FetchLike);
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await doFetch(buildUrl(path, params), {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new TodoistError('Network error talking to Todoist');
  }
  if (!res.ok) {
    // Status only — never echo the request (it carries the token).
    throw new TodoistError(`Todoist responded ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

interface Page<T> {
  results?: T[];
  items?: T[];
  next_cursor?: string | null;
}

/** GET a cursor-paginated list, following next_cursor until it's null. */
export async function todoistGetAll<T>(
  path: string,
  token: string,
  params: Record<string, string> = {},
  opts: ClientOptions & { key?: 'results' | 'items'; maxPages?: number } = {},
): Promise<T[]> {
  const key = opts.key ?? 'results';
  const maxPages = opts.maxPages ?? 50;
  const out: T[] = [];
  let cursor: string | null | undefined;
  for (let page = 0; page < maxPages; page++) {
    const body = await todoistGet<Page<T>>(
      path,
      token,
      cursor ? { ...params, cursor } : params,
      opts,
    );
    out.push(...(body[key] ?? []));
    cursor = body.next_cursor;
    if (!cursor) return out;
  }
  throw new TodoistError('Too many pages from Todoist');
}
