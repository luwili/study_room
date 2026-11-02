/**
 * Time utility functions for Ufa timezone (Asia/Yekaterinburg, UTC+5)
 */

export const UFA_TIMEZONE = 'Asia/Yekaterinburg';
export const SEMESTER_START_DATE = '2026-08-31';

/**
 * Dynamically calculates the current academic week number (1..17).
 * Academic semester starts on Monday 2026-08-31 (Week 1).
 */
export function calculateCurrentWeek(customDate?: Date): number {
  const now = customDate || new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: UFA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now);

  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);

  const [startYear, startMonth, startDay] = SEMESTER_START_DATE.split('-').map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const currentUtc = Date.UTC(year, month - 1, day);

  const diffDays = Math.floor((currentUtc - startUtc) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;

  return Math.max(1, Math.min(17, week));
}

/**
 * Returns week type ('even' or 'odd') based on week number.
 */
export function getWeekType(weekNumber: number): 'even' | 'odd' {
  return weekNumber % 2 === 0 ? 'even' : 'odd';
}

export interface UfaTimeInfo {
  date: Date;
  timeString: string;
  dateString: string;
  dayOfWeek: number; // 1 (Mon) - 7 (Sun)
  dayName: string;
  currentPair: number | null;
  currentPairStatus: 'ongoing' | 'break' | 'before' | 'after';
  pairDetails?: {
    pair: number;
    start: string;
    end: string;
    description: string;
  };
}

const BELL_SCHEDULE = [
  // 1-я смена
  { pair: 1, label: '1-я пара', start: '08:00', end: '09:20', startMins: 8 * 60, endMins: 9 * 60 + 20 },
  { pair: 2, label: '2-я пара', start: '09:30', end: '10:50', startMins: 9 * 60 + 30, endMins: 10 * 60 + 50 },
  { pair: 3, label: '3-я пара', start: '11:10', end: '12:30', startMins: 11 * 60 + 10, endMins: 12 * 60 + 30 },
  { pair: 4, label: '4-я пара', start: '12:40', end: '14:00', startMins: 12 * 60 + 40, endMins: 14 * 60 },
  // 2-я смена
  { pair: 5, label: '1-я пара (2 смена)', start: '14:10', end: '15:30', startMins: 14 * 60 + 10, endMins: 15 * 60 + 30 },
  { pair: 6, label: '2-я пара (2 смена)', start: '15:40', end: '17:00', startMins: 15 * 60 + 40, endMins: 17 * 60 },
  { pair: 7, label: '3-я пара (2 смена)', start: '17:20', end: '18:40', startMins: 17 * 60 + 20, endMins: 18 * 60 + 40 },
  { pair: 8, label: '4-я пара (2 смена)', start: '18:50', end: '20:10', startMins: 18 * 60 + 50, endMins: 20 * 60 + 10 },
  { pair: 9, label: '5-я пара (2 смена)', start: '20:20', end: '21:40', startMins: 20 * 60 + 20, endMins: 21 * 60 + 40 },
];

export function getUfaTimeInfo(customDate?: Date): UfaTimeInfo {
  const now = customDate || new Date();
  
  // Format in Asia/Yekaterinburg timezone
  const formatterTime = new Intl.DateTimeFormat('ru-RU', {
    timeZone: UFA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formatterDate = new Intl.DateTimeFormat('ru-RU', {
    timeZone: UFA_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const parts = formatterTime.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
  const currentTotalMins = hour * 60 + minute;

  // Day of week in Ufa
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: UFA_TIMEZONE,
    weekday: 'narrow'
  });
  // ru-RU weekday index:
  const dayNameRu = formatterDate.format(now).split(',')[0];
  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const dayIdx = dayNames.findIndex(d => dayNameRu.toLowerCase().includes(d));
  // 1 = Mon, 6 = Sat, 7 = Sun
  const dayOfWeek = dayIdx === 0 ? 7 : dayIdx;

  // Determine pair
  let currentPair: number | null = null;
  let status: 'ongoing' | 'break' | 'before' | 'after' = 'after';
  let pairDetails = undefined;

  if (currentTotalMins < BELL_SCHEDULE[0].startMins) {
    status = 'before';
    pairDetails = {
      pair: 1,
      start: BELL_SCHEDULE[0].start,
      end: BELL_SCHEDULE[0].end,
      description: 'До начала занятий'
    };
  } else if (currentTotalMins > BELL_SCHEDULE[BELL_SCHEDULE.length - 1].endMins) {
    status = 'after';
  } else {
    for (let i = 0; i < BELL_SCHEDULE.length; i++) {
      const p = BELL_SCHEDULE[i];
      if (currentTotalMins >= p.startMins && currentTotalMins <= p.endMins) {
        currentPair = p.pair;
        status = 'ongoing';
        pairDetails = {
          pair: p.pair,
          start: p.start,
          end: p.end,
          description: `Идет ${p.label}`
        };
        break;
      } else if (i < BELL_SCHEDULE.length - 1) {
        const nextP = BELL_SCHEDULE[i + 1];
        if (currentTotalMins > p.endMins && currentTotalMins < nextP.startMins) {
          status = 'break';
          pairDetails = {
            pair: nextP.pair,
            start: nextP.start,
            end: nextP.end,
            description: `Перемена перед ${nextP.label}`
          };
          break;
        }
      }
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeString = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  return {
    date: now,
    timeString,
    dateString: formatterDate.format(now),
    dayOfWeek,
    dayName: dayNameRu.charAt(0).toUpperCase() + dayNameRu.slice(1),
    currentPair,
    currentPairStatus: status,
    pairDetails
  };
}
