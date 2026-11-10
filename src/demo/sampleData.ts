// Sample board for Demo mode and for building the UI before Todoist is wired up.

import type { Flower, Landing } from '../domain/types';
import { HIVE_PROJECT_KEY } from '../domain/types';
import { displayColor } from '../todoist/colors';
import { colors } from '../ui/theme';

const todoist = (
  id: string,
  title: string,
  projectKey: string,
  projectName: string,
  colorName: string,
  daysLate?: number,
): Flower => ({
  id: `todoist:${id}`,
  source: 'todoist',
  title,
  projectKey,
  projectName,
  color: displayColor(colorName),
  ...(daysLate ? { daysLate } : {}),
});

const hive = (id: string, title: string): Flower => ({
  id: `hive:${id}`,
  source: 'hive',
  title,
  projectKey: HIVE_PROJECT_KEY,
  projectName: 'Hive',
  color: colors.hive,
});

export const sampleFlowers: Flower[] = [
  todoist('1', 'pocket goblin', 'megadog', 'Mega Dog', 'magenta', 2),
  todoist('2', 'drawing app?', 'inbox', 'Inbox', 'charcoal', 2),
  todoist('3', 'remove a ff photo', 'inbox', 'Inbox', 'charcoal', 2),
  todoist('4', 'review deck', 'work', 'Work', 'sky_blue'),
  todoist('5', 'reply to sam', 'work', 'Work', 'sky_blue', 1),
  hive('1', 'Sketch 10 min'),
  hive('2', 'Tidy the desk'),
  hive('3', 'Read 20 pages'),
  hive('4', 'Gym'),
];

export const sampleLog: string[] = [
  'HIVE.EXE v2.0',
  '08:14 > sync todoist ... +5 new',
  '08:14 > load hive ...... ok (4)',
  '08:14 > 3 flowers overdue',
  '08:14 > ready.',
];

export const sampleHistory: Landing[] = [
  {
    flowerId: 'todoist:1',
    title: 'pocket goblin',
    projectName: 'Mega Dog',
    color: displayColor('magenta'),
    at: '2026-11-10T08:16:00',
  },
  {
    flowerId: 'hive:4',
    title: 'Gym',
    projectName: 'Hive',
    color: colors.hive,
    at: '2026-11-10T07:15:00',
  },
];

export const sampleDone = 2;
export const sampleSeed = 11;
