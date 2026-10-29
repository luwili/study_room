import React, { useMemo, useState } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Users, 
  Building2, 
  Pin, 
  ArrowRight, 
  Sparkles,
  FileText,
  Bookmark,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Smartphone,
  Download
} from 'lucide-react';
import emblemImg from '../assets/emblem.png';
import scheduleData from '../data/schedule.json';
import rawAnnouncements from '../data/announcements.json';
import topicsMetadata from '../data/topics-metadata.json';
import subjectsData from '../data/subjects.json';
import { getUfaTimeInfo } from '../utils/time';
import { Announcement, TopicMetadata } from '../types';

const announcementsData: Announcement[] = rawAnnouncements as unknown as Announcement[];
const topicsData: TopicMetadata[] = topicsMetadata as TopicMetadata[];

interface HomePageProps {
  onNavigate: (tab: string, itemId?: string) => void;
  onOpenSync?: () => void;
  isSyncing?: boolean;
  onOpenWidgetModal?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenSync, isSyncing = false, onOpenWidgetModal }) => {
  const timeInfo = getUfaTimeInfo();
  const [announcementFilter, setAnnouncementFilter] = useState<string>('all');
  const [showAllAnnouncements, setShowAllAnnouncements] = useState<boolean>(false);

  // Filtered and sorted announcements
  const filteredAnnouncements = useMemo(() => {
    if (announcementFilter === 'all') return announcementsData;
    return announcementsData.filter((a) => a.tag === announcementFilter);
  }, [announcementFilter]);

  const displayedAnnouncements = useMemo(() => {
    return showAllAnnouncements ? filteredAnnouncements : filteredAnnouncements.slice(0, 6);
  }, [filteredAnnouncements, showAllAnnouncements]);

  // Find schedule for today (or Monday if Sunday)
  const todayDayOfWeek = timeInfo.dayOfWeek > 6 ? 1 : timeInfo.dayOfWeek;
  const todaySchedule = useMemo(() => {
    return scheduleData.days.find((d) => d.dayOfWeek === todayDayOfWeek) || scheduleData.days[0];
  }, [todayDayOfWeek]);

  // Featured study notes
  const featuredTopics = useMemo(() => {
    return topicsData.slice(0, 4);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner styled after the new Emblem */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#06101f] via-[#091b38] to-[#040812] text-white p-6 sm:p-8 shadow-2xl border border-amber-500/30 ring-1 ring-amber-400/20">
        <div className="relative z-10 max-w-xl lg:max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Институт права УУНиТ · Уфа</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm">
            Кабинет группы ПОНБ-УП-304С
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mb-6">
            Специальность «Правовое обеспечение национальной безопасности», специализация: уголовно-правовая. 5&nbsp;семестр (3&nbsp;курс), очная форма обучения.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('schedule')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 border border-amber-300/60 transition-all hover:scale-105 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Расписание пар</span>
            </button>

            <button
              onClick={() => onNavigate('topics')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0c2244]/80 hover:bg-[#12315e] text-white font-medium text-sm backdrop-blur-md border border-amber-400/20 hover:border-amber-400/40 shadow-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Конспекты ({topicsData.length})</span>
            </button>

            <button
              onClick={() => onNavigate('exam')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-950/40 to-amber-950/30 hover:from-rose-900/50 hover:to-amber-900/40 text-rose-200 hover:text-white font-medium text-sm backdrop-blur-md border border-rose-500/30 hover:border-rose-400/50 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Сессия (4 экз. · 10 зач.)</span>
            </button>

            <button
              onClick={() => onNavigate('subjects')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0c2244]/80 hover:bg-[#12315e] text-white font-medium text-sm backdrop-blur-md border border-amber-400/20 hover:border-amber-400/40 shadow-sm transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Предметы семестра</span>
            </button>

            {onOpenWidgetModal && (
              <button
                onClick={onOpenWidgetModal}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-sm backdrop-blur-md border border-amber-400/35 hover:border-amber-300 shadow-sm transition-all"
              >
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span>Виджет Android (v1.2.0)</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background insignia styled after the emblem */}
        <div className="absolute -right-10 sm:-right-6 md:-right-2 lg:right-6 -bottom-14 sm:-bottom-10 md:top-1/2 md:-bottom-auto md:-translate-y-1/2 pointer-events-none select-none flex items-center justify-center">
          {/* Ambient sapphire & golden halo glow */}
          <div className="absolute w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full bg-gradient-to-tr from-amber-500/20 via-blue-600/25 to-amber-300/10 blur-3xl -z-10" />
          <img
            src={emblemImg}
            alt="Эмблема ПОНБ"
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-88 md:h-88 lg:w-[390px] lg:h-[390px] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] opacity-40 sm:opacity-75 md:opacity-90 lg:opacity-95 transition-opacity duration-500"
          />
        </div>
      </div>

      {/* Android Widget Update Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0b2447] to-[#071328] border border-amber-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm sm:text-base">Виджет расписания для Android</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-slate-950 uppercase">
                v1.2.0 (Белые списки & VPN)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Новая версия: работа через белые списки и VPN (6 CDN-зеркал), мгновенная передача расписания из браузера в виджет.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto flex-shrink-0">
          <a
            href="https://github.com/luwili/study_room/releases/download/widget-apk-latest/StudyRoom-Widget.apk"
            download="StudyRoom-Widget.apk"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать APK</span>
          </a>
          {onOpenWidgetModal && (
            <button
              onClick={onOpenWidgetModal}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
            >
              Инструкция
            </button>
          )}
        </div>
      </div>

      {/* Grid: Today's Schedule & Study Notes Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    Расписание: {todaySchedule.dayName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Неделя {(scheduleData as any).currentWeekNumber || 8} · {timeInfo.dateString}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {onOpenSync && (
                  <button
                    onClick={onOpenSync}
                    disabled={isSyncing}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSyncing
                        ? 'text-amber-500 animate-spin cursor-wait'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                    title="Запустить синхронизацию расписания с ИСУ УУНиТ"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onNavigate('schedule')}
                  className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline flex items-center space-x-1"
                >
                  <span>Вся неделя</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List of pairs */}
            <div className="space-y-3">
              {todaySchedule.pairs.map((p) => {
                const isCurrentPair = timeInfo.currentPair === p.pairNumber && timeInfo.dayOfWeek === todaySchedule.dayOfWeek;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentPair
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Пара</span>
                          <span className="text-sm font-extrabold text-brand-900 dark:text-brand-300 leading-none">
                            {p.pairNumber}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {p.subjectName}
                            </span>
                            {isCurrentPair && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                                СЕЙЧАС
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                            {p.teacher}
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-semibold text-brand-700 dark:text-brand-400">{p.type}</span>
                            <span>·</span>
                            <span>{p.room}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {p.timeStart} – {p.timeEnd}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick jump to upcoming weeks */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Следующие 2 недели:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => onNavigate('schedule', '9')}
                  className="px-2.5 py-1 rounded-lg font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 hover:bg-amber-200 dark:hover:bg-amber-900/80 transition-colors"
                >
                  Неделя 9 (26.10–01.11) →
                </button>
                <button
                  onClick={() => onNavigate('schedule', '10')}
                  className="px-2.5 py-1 rounded-lg font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/80 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors"
                >
                  Неделя 10 (02–08.11) →
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Звонки: 08:00, 09:30, 11:10, 12:40 (1 см.) · 14:10, 15:40, 17:20 (2 см.)</span>
            </span>
            <span className="font-medium text-slate-600 dark:text-slate-400">ул. Достоевского, 131</span>
          </div>
        </div>

        {/* Right col: Study Notes Quick Access */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    Конспекты лекций
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {topicsData.length} лекций из архива Study
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('topics')}
                className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline flex items-center space-x-1"
              >
                <span>Все</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {featuredTopics.map((topic) => {
                const sub = subjectsData.find((s) => s.id === topic.subjectId);
                const readTime = topic.readTimeMinutes || 5;
                return (
                  <div
                    key={topic.id}
                    onClick={() => onNavigate('topics', topic.id)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold text-brand-700 dark:text-brand-400 mb-1">
                      <span className="truncate">{sub?.shortTitle || sub?.title || 'Конспект'}</span>
                      <span className="text-slate-400 font-mono flex-shrink-0">{readTime} мин</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
                      {topic.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {topic.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Гражданское, Уголовное, Процесс, СМЭ
            </span>
            <button
              onClick={() => onNavigate('topics')}
              className="text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline"
            >
              Открыть каталог →
            </button>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Объявления института и куратора
                </h2>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Синхронизировано с ИСУ УУНиТ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Актуальные новости для студентов группы ПОНБ-УП-304С
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenSync && (
              <button
                onClick={onOpenSync}
                disabled={isSyncing}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/70 dark:hover:bg-brand-900 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors"
                title="Синхронизировать расписание и объявления с ИСУ УУНиТ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
                <span>{isSyncing ? 'Синхронизация...' : 'Обновить из ИСУ'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
          {['all', 'Куратор', 'Институт', 'Расписание', 'Наука'].map((tag) => {
            const label = tag === 'all' ? 'Все новости' : tag;
            const count = tag === 'all' 
              ? announcementsData.length 
              : announcementsData.filter(a => a.tag === tag).length;
            if (count === 0 && tag !== 'all') return null;
            return (
              <button
                key={tag}
                onClick={() => setAnnouncementFilter(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  announcementFilter === tag
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label} <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${
                ann.isPinned
                  ? 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800/60 ring-1 ring-brand-300/50 dark:ring-brand-800/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        ann.tag === 'Куратор'
                          ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : ann.tag === 'Институт'
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : ann.tag === 'Расписание'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {ann.tag}
                    </span>
                    {ann.isPinned && (
                      <span className="flex items-center space-x-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>Важно</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {ann.date}
                  </span>
                </div>

                {ann.imageUrl && (
                  <div className="mb-2.5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36">
                    <img
                      src={ann.imageUrl}
                      alt={ann.title}
                      className="w-full h-28 object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}

                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1.5">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                  {ann.content}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate font-medium">{ann.author}</span>
                {ann.url && (
                  <a
                    href={ann.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 font-semibold ml-2 flex-shrink-0"
                  >
                    <span>В ИСУ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expand / Collapse Button */}
        {filteredAnnouncements.length > 6 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span>{showAllAnnouncements ? 'Свернуть объявления' : `Показать все объявления (${filteredAnnouncements.length})`}</span>
              {showAllAnnouncements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Быстрый переход по разделам
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {[
            { id: 'subjects', title: 'Предметы', desc: '10 дисциплин семестра', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
            { id: 'topics', title: 'Конспекты лекций', desc: '28 лекций из архива Study', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
            { id: 'schedule', title: 'Расписание', desc: 'Звонки и пары на неделю', icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
            { id: 'exam', title: 'Сессия и экзамены', desc: '4 экзамена, 10 зачётов ИСУ', icon: Sparkles, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
            { id: 'teachers', title: 'Преподаватели', desc: 'Справочник института (186)', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
            { id: 'departments', title: 'Кафедры', desc: '8 кафедр Института права', icon: Building2, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' },
            { id: 'gratitude', title: 'Благодарность', desc: 'Спонсоры проекта', icon: HeartHandshake, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
            { id: 'institute', title: 'Институт УУНиТ', desc: 'Контакты, справки, ссылки', icon: ArrowRight, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
            { id: 'favorites', title: 'Избранное', desc: 'Сохраненные лекции', icon: Bookmark, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all text-left group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {item.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
