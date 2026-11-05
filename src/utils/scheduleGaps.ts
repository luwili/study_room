import { ScheduleItem } from '../types';

export interface WindowScheduleItem {
  id: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  label: string;
  durationMinutes: number;
}

export type ScheduleEntry = 
  | { isWindow: false; pair: ScheduleItem }
  | { isWindow: true; window: WindowScheduleItem };

export const BELL_PAIR_TIMES: Record<number, { start: string; end: string; label: string }> = {
  1: { start: '08:00', end: '09:20', label: '1 пара' },
  2: { start: '09:30', end: '10:50', label: '2 пара' },
  3: { start: '11:10', end: '12:30', label: '3 пара' },
  4: { start: '12:40', end: '14:00', label: '4 пара' },
  5: { start: '14:10', end: '15:30', label: '1 пара (2 смена)' },
  6: { start: '15:40', end: '17:00', label: '2 пара (2 смена)' },
  7: { start: '17:20', end: '18:40', label: '3 пара (2 смена)' },
  8: { start: '18:50', end: '20:10', label: '4 пара (2 смена)' },
  9: { start: '20:20', end: '21:40', label: '5 пара (2 смена)' },
};

/**
 * Returns schedule items with inserted "window" (free time) slots
 * between the first and last pair of the day.
 */
export function getScheduleEntriesWithWindows(
  pairs: ScheduleItem[],
  dayId?: number | string
): ScheduleEntry[] {
  if (!pairs || pairs.length <= 1) {
    return (pairs || []).map((p) => ({ isWindow: false, pair: p }));
  }

  const sorted = [...pairs].sort((a, b) => a.pairNumber - b.pairNumber);
  const minPair = sorted[0].pairNumber;
  const maxPair = sorted[sorted.length - 1].pairNumber;

  const pairsByNum = new Map<number, ScheduleItem[]>();
  for (const p of sorted) {
    const list = pairsByNum.get(p.pairNumber) || [];
    list.push(p);
    pairsByNum.set(p.pairNumber, list);
  }

  const result: ScheduleEntry[] = [];

  for (let pNum = minPair; pNum <= maxPair; pNum++) {
    const existing = pairsByNum.get(pNum);
    if (existing && existing.length > 0) {
      for (const p of existing) {
        result.push({ isWindow: false, pair: p });
      }
    } else {
      const bell = BELL_PAIR_TIMES[pNum] || { start: '—', end: '—', label: `${pNum} пара` };
      const windowId = dayId !== undefined ? `window-d${dayId}-p${pNum}` : `window-${pNum}`;
      result.push({
        isWindow: true,
        window: {
          id: windowId,
          pairNumber: pNum,
          timeStart: bell.start,
          timeEnd: bell.end,
          label: bell.label,
          durationMinutes: 80,
        }
      });
    }
  }

  return result;
}

/**
 * Counts how many window (free time) slots are present in a day schedule.
 */
export function countDayWindows(pairs: ScheduleItem[]): number {
  if (!pairs || pairs.length <= 1) return 0;
  const entries = getScheduleEntriesWithWindows(pairs);
  return entries.filter((e) => e.isWindow).length;
}
