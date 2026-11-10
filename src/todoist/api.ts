// Read-only Todoist calls Hive makes. Every request goes through client.ts (GET only).
// Paths/shapes verified against the official SDK (@doist/todoist-sdk 11). If one differs, fix it here.

import { daysLate } from '../domain/dates';
import type { Flower } from '../domain/types';
import { type ClientOptions, todoistGet, todoistGetAll } from './client';
import { displayColor } from './colors';
import type { TodoistProject, TodoistTask } from './types';

export const TODAY_FILTER = 'today | overdue';

/** Today's and overdue active tasks, all projects (incl. subtasks that are due). */
export function getTodayTasks(token: string, opts?: ClientOptions): Promise<TodoistTask[]> {
  return todoistGetAll<TodoistTask>(
    '/tasks/filter',
    token,
    { query: TODAY_FILTER, limit: '200' },
    opts,
  );
}

export function getProjects(token: string, opts?: ClientOptions): Promise<TodoistProject[]> {
  return todoistGetAll<TodoistProject>('/projects', token, { limit: '200' }, opts);
}

/** Number of tasks completed since local midnight. */
export async function getCompletedTodayCount(
  token: string,
  now: Date,
  opts?: ClientOptions,
): Promise<number> {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = await todoistGetAll<unknown>(
    '/tasks/completed/by_completion_date',
    token,
    { since: midnight.toISOString(), until: now.toISOString(), limit: '200' },
    { ...opts, key: 'items' },
  );
  return items.length;
}

/** Cheapest authenticated call, to check a token. */
export async function validateToken(token: string, opts?: ClientOptions): Promise<void> {
  await todoistGet('/projects', token, { limit: '1' }, opts);
}

export function taskToFlower(
  task: TodoistTask,
  projects: ReadonlyMap<string, TodoistProject>,
  now: Date,
): Flower {
  const project = projects.get(task.project_id);
  const late = task.due?.date ? daysLate(task.due.date, now) : 0;
  return {
    id: `todoist:${task.id}`,
    source: 'todoist',
    title: task.content,
    projectKey: task.project_id,
    projectName: project?.name ?? 'Todoist',
    color: displayColor(project?.color),
    ...(late > 0 ? { daysLate: late } : {}),
  };
}

/**
 * Everything a sync needs. The completed count is best-effort: if that endpoint fails, the sync
 * still succeeds and DONE counts Hive tasks only.
 */
export async function fetchTodoistBoard(
  token: string,
  now: Date,
  opts?: ClientOptions,
): Promise<{ flowers: Flower[]; completedToday?: number }> {
  const [tasks, projects, completed] = await Promise.all([
    getTodayTasks(token, opts),
    getProjects(token, opts),
    getCompletedTodayCount(token, now, opts).catch(() => undefined),
  ]);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const flowers = tasks
    .filter((t) => !t.checked && !t.is_deleted)
    .map((t) => taskToFlower(t, byId, now));
  return { flowers, completedToday: completed };
}
