// Raw Todoist API v1 shapes (snake_case, as on the wire). Only the fields Hive reads.
// Verified against @doist/todoist-sdk 11 (endpoints + zod schemas).

export interface TodoistDue {
  /** 'YYYY-MM-DD', or a date-time for timed tasks */
  date: string;
  is_recurring?: boolean;
  datetime?: string | null;
  string?: string;
}

export interface TodoistTask {
  id: string;
  content: string;
  project_id: string;
  parent_id?: string | null;
  labels?: string[];
  due?: TodoistDue | null;
  checked?: boolean;
  is_deleted?: boolean;
}

export interface TodoistProject {
  id: string;
  name: string;
  /** Colour name, e.g. 'berry_red', 'charcoal' */
  color: string;
  is_archived?: boolean;
  is_deleted?: boolean;
}
