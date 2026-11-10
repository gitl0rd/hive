// Fixture-based: recorded Todoist v1 response shapes, no live calls.
import { fetchTodoistBoard, TODAY_FILTER, validateToken } from '../api';
import type { FetchLike } from '../client';
import { displayColor } from '../colors';
import completed from './fixtures/completed.json';
import projects from './fixtures/projects.json';
import page1 from './fixtures/tasksFilter.json';
import page2 from './fixtures/tasksFilterPage2.json';

const now = new Date(2026, 10, 10, 9, 0);

function router(overrides: Partial<Record<string, { status?: number; body?: unknown }>> = {}) {
  const calls: { url: URL; method: string; auth: string }[] = [];
  const fetch: FetchLike = async (url, init) => {
    const u = new URL(url);
    calls.push({ url: u, method: init.method, auth: init.headers.Authorization });
    const path = u.pathname.replace('/api/v1', '');
    const key =
      path === '/tasks/filter' ? (u.searchParams.get('cursor') ? 'filter2' : 'filter') : path;
    const table: Record<string, { status?: number; body?: unknown }> = {
      filter: { body: page1 },
      filter2: { body: page2 },
      '/projects': { body: projects },
      '/tasks/completed/by_completion_date': { body: completed },
      ...overrides,
    };
    const r = table[key] ?? { status: 404 };
    const status = r.status ?? 200;
    return { ok: status < 300, status, json: async () => r.body };
  };
  return { fetch, calls };
}

describe('todoist api', () => {
  it('maps today + overdue tasks (all pages) to flowers with project names and colours', async () => {
    const { fetch } = router();
    const { flowers, completedToday } = await fetchTodoistBoard('tok', now, { fetch });
    expect(flowers).toEqual([
      {
        id: 'todoist:6X7rM8997g3RQmvh',
        source: 'todoist',
        title: 'pocket goblin',
        projectKey: '6Jf8VQXxpwv56VQ7',
        projectName: 'Mega Dog',
        color: displayColor('magenta'),
        daysLate: 2,
      },
      {
        id: 'todoist:6X7rfFVPjhvv84XG',
        source: 'todoist',
        title: 'drawing app?',
        projectKey: '6Jf8VQXxpwv56VQ8',
        projectName: 'Inbox',
        color: displayColor('charcoal'),
      },
      {
        // project not in the list (e.g. shared/archived): falls back gracefully
        id: 'todoist:6X7rfFVPjhvv84XH',
        source: 'todoist',
        title: 'reply to sam',
        projectKey: '6Jf8VQXxpwv56VQ9',
        projectName: 'Todoist',
        color: displayColor(undefined),
      },
    ]);
    expect(completedToday).toBe(3);
  });

  it('sends only GETs with the right paths and params', async () => {
    const { fetch, calls } = router();
    await fetchTodoistBoard('tok', now, { fetch });
    expect(calls.every((c) => c.method === 'GET')).toBe(true);
    expect(calls.every((c) => c.auth === 'Bearer tok')).toBe(true);
    const filter = calls.find((c) => c.url.pathname === '/api/v1/tasks/filter')!;
    expect(filter.url.searchParams.get('query')).toBe(TODAY_FILTER);
    expect(filter.url.searchParams.get('limit')).toBe('200');
    const done = calls.find(
      (c) => c.url.pathname === '/api/v1/tasks/completed/by_completion_date',
    )!;
    expect(new Date(done.url.searchParams.get('since')!).getTime()).toBe(
      new Date(2026, 10, 10).getTime(),
    );
    expect(new Date(done.url.searchParams.get('until')!).getTime()).toBe(now.getTime());
  });

  it('still syncs if the completed endpoint fails (DONE then counts Hive only)', async () => {
    const { fetch } = router({ '/tasks/completed/by_completion_date': { status: 500 } });
    const r = await fetchTodoistBoard('tok', now, { fetch });
    expect(r.flowers).toHaveLength(3);
    expect(r.completedToday).toBeUndefined();
  });

  it('fails the sync (with status) when tasks fail, e.g. bad token', async () => {
    const { fetch } = router({ filter: { status: 401 } });
    await expect(fetchTodoistBoard('bad', now, { fetch })).rejects.toMatchObject({ status: 401 });
  });

  it('validateToken uses GET /projects?limit=1', async () => {
    const { fetch, calls } = router();
    await validateToken('tok', { fetch });
    expect(calls).toHaveLength(1);
    expect(calls[0].url.pathname).toBe('/api/v1/projects');
    expect(calls[0].url.searchParams.get('limit')).toBe('1');
  });
});
