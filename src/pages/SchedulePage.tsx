import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  ExternalLink, 
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Smartphone,
  Download
} from 'lucide-react';
import scheduleData from '../data/schedule.json';
import { getUfaTimeInfo } from '../utils/time';
import { ScheduleDay, ScheduleItem, ScheduleWeek } from '../types';

interface SchedulePageProps {
  onNavigateTeacher?: (teacherName: string) => void;
  onNavigateSubject?: (subjectId: string) => void;
  onOpenSync?: () => void;
  isSyncing?: boolean;
  initialWeek?: number;
  onOpenWidgetModal?: () => void;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  onNavigateTeacher,
  onNavigateSubject,
  onOpenSync,
  isSyncing = false,
  initialWeek,
  onOpenWidgetModal
}) => {
  const timeInfo = getUfaTimeInfo();
  const currentWeekNumber = scheduleData.currentWeekNumber || 8;
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek || currentWeekNumber);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  useEffect(() => {
    if (initialWeek) {
      setSelectedWeek(initialWeek);
    }
  }, [initialWeek]);
  
  // Default selected day: today (1..6), or 1 (Mon) on Sunday
  const initialDay = timeInfo.dayOfWeek >= 1 && timeInfo.dayOfWeek <= 6 ? timeInfo.dayOfWeek : 1;
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const weeksMap = (scheduleData as any).weeks as Record<string, ScheduleWeek> | undefined;
  const activeWeekData: ScheduleWeek = weeksMap?.[String(selectedWeek)] || {
    weekNumber: selectedWeek,
    weekType: selectedWeek % 2 === 0 ? 'even' : 'odd',
    startDate: '',
    endDate: '',
    label: `Неделя ${selectedWeek}`,
    totalPairs: scheduleData.days.reduce((acc: number, d: any) => acc + d.pairs.length, 0),
    days: scheduleData.days as unknown as ScheduleDay[]
  };

  const days: ScheduleDay[] = (activeWeekData.days || scheduleData.days) as unknown as ScheduleDay[];
  const currentDayData: ScheduleDay = days.find((d: ScheduleDay) => d.dayOfWeek === selectedDay) || days[0] || {
    dayOfWeek: selectedDay,
    dayName: 'День',
    date: '',
    pairs: []
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wider mb-1">
            <span>Институт права УУНиТ · Уфа</span>
            <span>•</span>
            <span>Неделя {selectedWeek} ({activeWeekData.weekType === 'even' ? 'Четная' : 'Нечетная'})</span>
            {(scheduleData as any).lastSyncedAt && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 normal-case font-medium">
                  ИСУ УУНиТ: {(scheduleData as any).lastSyncedAt}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Расписание занятий ПОНБ-УП-304С
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Время Уфы (Asia/Yekaterinburg, UTC+5). Корпус: ул. Достоевского, 131.
          </p>
        </div>

        {/* Actions & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {onOpenSync && (
            <button
              onClick={onOpenSync}
              disabled={isSyncing}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                isSyncing
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 cursor-wait'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 hover:scale-105 active:scale-95'
              }`}
              title="Запустить синхронизацию расписания с ИСУ УУНиТ в один клик"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Синхронизация в фоне...' : 'Обновить расписание'}</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-brand-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Режим: День
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-brand-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Режим: Вся неделя
            </button>
          </div>
        </div>
      </div>

      {/* Android Widget Companion Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25">
        <div className="flex items-center space-x-2.5">
          <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">Нативный виджет расписания для Android (v1.2.0):</span> пары и звонки прямо на домашнем экране телефона.
          </div>
        </div>
        <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
          <a
            href="https://github.com/luwili/study_room/releases/download/widget-apk-latest/StudyRoom-Widget.apk"
            download="StudyRoom-Widget.apk"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать APK</span>
          </a>
          {onOpenWidgetModal && (
            <button
              onClick={onOpenWidgetModal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              Инструкция
            </button>
          )}
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Prev / Next & Current Week Indicator */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek <= 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
              title="Предыдущая неделя"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Неделя {selectedWeek}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {activeWeekData.weekType === 'even' ? 'Четная' : 'Нечетная'}
              </span>
              {selectedWeek === currentWeekNumber && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Текущая
                </span>
              )}
              {selectedWeek === currentWeekNumber + 1 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Следующая неделя
                </span>
              )}
              {selectedWeek === currentWeekNumber + 2 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                  Через 2 недели
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedWeek((w) => Math.min(17, w + 1))}
              disabled={selectedWeek >= 17}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
              title="Следующая неделя"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick jump presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">Переход:</span>
            <button
              onClick={() => setSelectedWeek(currentWeekNumber)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedWeek === currentWeekNumber
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              8 (тек.)
            </button>
            <button
              onClick={() => setSelectedWeek(currentWeekNumber + 1)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedWeek === currentWeekNumber + 1
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              9 (след., 26.10–01.11)
            </button>
            <button
              onClick={() => setSelectedWeek(currentWeekNumber + 2)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedWeek === currentWeekNumber + 2
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              10 (+2 нед., 02–08.11)
            </button>

            {/* Select dropdown for all 17 weeks */}
            <div className="relative inline-block ml-1">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer font-medium"
              >
                {Array.from({ length: 17 }, (_, i) => i + 1).map((w) => {
                  const wMeta = weeksMap?.[String(w)];
                  const label = wMeta?.label ? ` (${wMeta.label})` : '';
                  const total = wMeta?.totalPairs ? ` · ${wMeta.totalPairs} пар` : '';
                  const suffix = w === currentWeekNumber ? ' [текущая]' : w === currentWeekNumber + 1 ? ' [след.]' : w === currentWeekNumber + 2 ? ' [+2 нед.]' : '';
                  return (
                    <option key={w} value={w}>
                      Неделя {w}{label}{total}{suffix}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Date and total pairs subtitle */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>
              Период: <strong className="text-slate-700 dark:text-slate-200">{activeWeekData.label || 'Семестр'}</strong>
            </span>
            <span>•</span>
            <span>Всего пар на неделю: <strong className="text-slate-700 dark:text-slate-200">{activeWeekData.totalPairs ?? days.reduce((a: number, d: any) => a + d.pairs.length, 0)}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400">
            Официальные данные ИСУ УУНиТ для группы ПОНБ-УП-304С
          </div>
        </div>
      </div>

      {/* Day Selector (for 'day' mode) */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {days.map((d) => {
            const isSelected = d.dayOfWeek === selectedDay;
            const isToday = selectedWeek === currentWeekNumber && d.dayOfWeek === timeInfo.dayOfWeek;
            return (
              <button
                key={d.dayOfWeek}
                onClick={() => setSelectedDay(d.dayOfWeek)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-brand-900 text-white border-brand-800 shadow-md dark:bg-brand-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span className="font-bold text-xs sm:text-sm">{d.dayName}</span>
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" title="Сегодня" />
                  )}
                </div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-brand-200' : 'text-slate-400'}`}>
                  {d.date.slice(5).replace('-', '.')} · {d.pairs.length} пар
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Single Day View */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>{currentDayData.dayName}, {currentDayData.date}</span>
                {selectedWeek === currentWeekNumber && currentDayData.dayOfWeek === timeInfo.dayOfWeek && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    Сегодня
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Всего пар на день: {currentDayData.pairs.length}
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Неделя {selectedWeek} ({activeWeekData.weekType === 'even' ? 'четная' : 'нечетная'})
            </div>
          </div>

          {currentDayData.pairs.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Нет занятий
              </div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                В этот день пар по расписанию нет (выходной или нерабочий праздничный день).
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDayData.pairs.map((p) => {
                const isCurrentPair = 
                  selectedWeek === currentWeekNumber &&
                  currentDayData.dayOfWeek === timeInfo.dayOfWeek && 
                  timeInfo.currentPair === p.pairNumber;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentPair
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center flex-shrink-0 text-center shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Пара</span>
                          <span className="text-base font-extrabold text-brand-900 dark:text-brand-300 leading-none">
                            {p.pairNumber}
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => onNavigateSubject?.(p.subjectId)}
                              className="font-bold text-slate-900 dark:text-white text-base hover:text-brand-700 dark:hover:text-brand-400 transition-colors text-left"
                            >
                              {p.subjectName}
                            </button>
                            {isCurrentPair && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                                ИДЕТ СЕЙЧАС
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 mt-1">
                            <button
                              onClick={() => onNavigateTeacher?.(p.teacher)}
                              className="inline-flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400"
                            >
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium underline decoration-dotted">{p.teacher}</span>
                            </button>

                            <span className="inline-flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.room}</span>
                            </span>
                          </div>

                          {p.notes && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5">
                              Тема: {p.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {p.timeStart} – {p.timeEnd}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mt-1">
                          {p.type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Week Grid View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map((d) => {
            const isToday = selectedWeek === currentWeekNumber && d.dayOfWeek === timeInfo.dayOfWeek;
            return (
              <div
                key={d.dayOfWeek}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${
                  isToday
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {d.dayName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {d.date}
                      </p>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                        Сегодня
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {d.pairs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                        Нет занятий (выходной / праздник)
                      </div>
                    ) : (
                      d.pairs.map((p) => {
                        const isCurrentPair = isToday && timeInfo.currentPair === p.pairNumber;
                        return (
                          <div
                            key={p.id}
                            className={`p-3 rounded-xl border text-xs ${
                              isCurrentPair
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-brand-900 dark:text-brand-300">
                                {p.pairNumber} пара · {p.timeStart}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500">
                                {p.type === 'Лекция' ? 'Лекция' : 'Семинар'}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-2">
                              {p.subjectName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                              {p.teacher}
                            </div>
                            <div className="text-[10px] text-brand-700 dark:text-brand-400 mt-0.5 font-medium">
                              {p.room}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bell Schedule Reference */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Расписание звонков Института права УУНиТ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Официальная сетка звонков для первой и второй смены с длительностью перемен.
            </p>
          </div>
        </div>

        {/* 1st Shift */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-100 dark:bg-brand-950 text-brand-900 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              1-я смена
            </span>
            <span className="text-xs text-slate-400">Пары 1 – 4 (08:00 – 14:00)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {scheduleData.bellSchedule.filter((b: any) => b.shift === 1 || !b.shift && b.pair <= 4).map((b: any) => (
              <div 
                key={b.pair} 
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center hover:border-brand-400 transition-colors"
              >
                <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  {b.label || `${b.pair} ПАРА`}
                </span>
                <div className="font-mono font-extrabold text-base text-slate-900 dark:text-white my-1">
                  {b.timeStart} – {b.timeEnd}
                </div>
                {b.break ? (
                  <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    Перерыв: {b.break}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">—</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2nd Shift */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              2-я смена
            </span>
            <span className="text-xs text-slate-400">Пары 1 – 5 (14:10 – 21:40)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {scheduleData.bellSchedule.filter((b: any) => b.shift === 2 || !b.shift && b.pair > 4).map((b: any) => (
              <div 
                key={b.pair} 
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center hover:border-indigo-400 transition-colors"
              >
                <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  {b.label || `${b.pair - 4} ПАРА`}
                </span>
                <div className="font-mono font-extrabold text-base text-slate-900 dark:text-white my-1">
                  {b.timeStart} – {b.timeEnd}
                </div>
                {b.break ? (
                  <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    Перерыв: {b.break}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400">—</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Сетка звонков зафиксирована локально и защищена от перезаписи из ИСУ</span>
          <span className="text-slate-400 font-mono">ул. Достоевского, 131</span>
        </div>
      </div>
    </div>
  );
};
