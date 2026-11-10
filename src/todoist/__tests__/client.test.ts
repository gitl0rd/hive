import {
  assertReadOnly,
  buildUrl,
  type FetchLike,
  TodoistError,
  todoistGet,
  todoistGetAll,
} from '../client';

function fakeFetch(responses: { status?: number; body?: unknown }[]) {
  const calls: { url: string; method: string; headers: Record<string, string> }[] = [];
  let i = 0;
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, ...init });
    const r = responses[Math.min(i++, responses.length - 1)];
    const status = r.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => r.body };
  };
  return { fetch, calls };
}

async function failure(p: Promise<unknown>): Promise<TodoistError> {
  try {
    await p;
  } catch (e) {
    return e as TodoistError;
  }
  throw new Error('expected a rejection');
}

describe('todoist client', () => {
  it('only allows GET', () => {
    expect(() => assertReadOnly('GET')).not.toThrow();
    expect(() => assertReadOnly('get')).not.toThrow();
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
      expect(() => assertReadOnly(m)).toThrow(TodoistError);
    }
  });

  it('builds URLs on api.todoist.com with encoded params', () => {
    expect(buildUrl('/tasks/filter', { query: 'today | overdue', limit: '200' })).toBe(
      'https://api.todoist.com/api/v1/tasks/filter?query=today+%7C+overdue&limit=200',
    );
    expect(buildUrl('projects')).toBe('https://api.todoist.com/api/v1/projects');
  });

  it('keeps odd-looking paths on the API host', () => {
    for (const p of ['@evil.example.com/x', '//evil.example.com/x', '../../x']) {
      expect(new URL(buildUrl(p)).host).toBe('api.todoist.com');
    }
  });

  it('sends GET with a bearer token', async () => {
    const { fetch, calls } = fakeFetch([{ body: { ok: 1 } }]);
    await expect(todoistGet('/projects', 'tok123', { limit: '1' }, { fetch })).resolves.toEqual({
      ok: 1,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].headers).toEqual({ Authorization: 'Bearer tok123' });
  });

  it('errors carry the status but never the token', async () => {
    const { fetch } = fakeFetch([{ status: 401 }]);
    const err = await failure(todoistGet('/projects', 'secret-token', {}, { fetch }));
    expect(err).toBeInstanceOf(TodoistError);
    expect(err.status).toBe(401);
    expect(String(err.message)).not.toContain('secret-token');
  });

  it('wraps network failures without leaking the token', async () => {
    const fetch: FetchLike = async () => {
      throw new Error('boom Bearer secret-token');
    };
    const err = await failure(todoistGet('/projects', 'secret-token', {}, { fetch }));
    expect(err).toBeInstanceOf(TodoistError);
    expect(String(err.message)).not.toContain('secret-token');
  });

  it('follows next_cursor until null', async () => {
    const { fetch, calls } = fakeFetch([
      { body: { results: [1, 2], next_cursor: 'c1' } },
      { body: { results: [3], next_cursor: 'c2' } },
      { body: { results: [4], next_cursor: null } },
    ]);
    await expect(todoistGetAll('/projects', 't', { limit: '200' }, { fetch })).resolves.toEqual([
      1, 2, 3, 4,
    ]);
    expect(calls.map((c) => new URL(c.url).searchParams.get('cursor'))).toEqual([null, 'c1', 'c2']);
    expect(calls.every((c) => c.method === 'GET')).toBe(true);
  });

  it('reads `items` pages when asked', async () => {
    const { fetch } = fakeFetch([{ body: { items: ['a'], next_cursor: null } }]);
    await expect(todoistGetAll('/x', 't', {}, { fetch, key: 'items' })).resolves.toEqual(['a']);
  });

  it('stops after maxPages', async () => {
    const { fetch } = fakeFetch([{ body: { results: [1], next_cursor: 'again' } }]);
    await expect(todoistGetAll('/x', 't', {}, { fetch, maxPages: 3 })).rejects.toThrow(
      TodoistError,
    );
  });
});
