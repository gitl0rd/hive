// Links into the Todoist app/web. No API calls here.

/** 'todoist:123' -> '123'; null for non-Todoist ids. */
export function todoistTaskId(flowerId: string): string | null {
  return flowerId.startsWith('todoist:') ? flowerId.slice('todoist:'.length) : null;
}

export function todoistWebUrl(taskId: string): string {
  return `https://app.todoist.com/app/task/${encodeURIComponent(taskId)}`;
}

/** Android/iOS app deep link (verify on device). */
export function todoistAppUrl(taskId: string): string {
  return `todoist://task?id=${encodeURIComponent(taskId)}`;
}
