import React from 'react';
import {
  Home,
  Calendar,
  BookOpen,
  FileText,
  GraduationCap,
  Users,
  Building2,
  ExternalLink,
  Bookmark,
  X,
  Phone,
  MapPin,
  HeartHandshake,
  Smartphone,
  Download,
  Info
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  favoritesCount?: number;
  onOpenWidgetModal?: () => void;
}

export const NAV_ITEMS = [
  { id: 'home', label: 'Главная', icon: Home, badge: null },
  { id: 'schedule', label: 'Расписание', icon: Calendar, badge: 'Неделя 9' },
  { id: 'subjects', label: 'Предметы', icon: BookOpen, badge: '10' },
  { id: 'topics', label: 'Темы и конспекты', icon: FileText, badge: '28' },
  { id: 'exam', label: 'Подготовка к экзаменам', icon: GraduationCap, badge: 'Карточки' },
  { id: 'teachers', label: 'Преподаватели', icon: Users, badge: '186' },
  { id: 'departments', label: 'Кафедры', icon: Building2, badge: '8' },
  { id: 'institute', label: 'Институт и ссылки', icon: ExternalLink, badge: null },
  { id: 'gratitude', label: 'Искренняя благодарность', icon: HeartHandshake, badge: null },
  { id: 'favorites', label: 'Избранное', icon: Bookmark, badgeKey: 'favorites' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  favoritesCount = 0,
  onOpenWidgetModal
}) => {
  const handleNavClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Curricular Tag */}
        <div className="px-4 py-3 mb-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-900/60">
          <div className="text-[11px] font-bold text-brand-900 dark:text-brand-300 uppercase tracking-wider">
            Специалитет 40.05.01
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
            Правовое обеспечение нацбезопасности
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>5 семестр (3 курс)</span>
            <span className="font-semibold text-brand-700 dark:text-brand-400">Очная</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            let badgeText = item.badge;
            if (item.badgeKey === 'favorites' && favoritesCount > 0) {
              badgeText = `${favoritesCount}`;
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-sm dark:bg-brand-600'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {badgeText && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[11px] font-semibold rounded-md flex-shrink-0 ${
                      isActive
                        ? 'bg-brand-800/80 text-amber-200 dark:bg-brand-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        {/* Android Widget Banner */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Smartphone className="w-4 h-4" />
              <span>Виджет Android</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-slate-950 uppercase">
              v1.2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">
            Расписание и звонки прямо на главном экране телефона.
          </p>
          <div className="mt-2.5 flex items-center space-x-1.5">
            <a
              href="https://github.com/luwili/study_room/releases/download/widget-apk-latest/StudyRoom-Widget.apk"
              download="StudyRoom-Widget.apk"
              className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 text-center"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Скачать APK</span>
            </a>
            {onOpenWidgetModal && (
              <button
                onClick={onOpenWidgetModal}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                title="Инструкция по установке и настройке"
                aria-label="Инструкция"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curator & University Footer */}
      <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            Куратор группы ПОНБ-УП-304С
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Нурмухаметов Руслан Наилевич
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Кафедра уголовного права и процесса
          </div>
        </div>

        <div className="px-1 text-[11px] space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
            <MapPin className="w-3 h-3 flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <span className="truncate">Уфа, ул. Достоевского, 131</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
            <Phone className="w-3 h-3 flex-shrink-0 text-brand-600 dark:text-brand-400" />
            <span>8-987-103-80-00</span>
          </div>
          <a
            href="https://law-bsu.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-brand-700 dark:text-brand-400 hover:underline pt-1"
          >
            <span>Официальный сайт law-bsu.ru</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto max-h-[calc(100vh-4rem)] sticky top-16">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-slate-900 shadow-2xl p-4 flex flex-col z-50 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                Навигация по разделам
              </span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Закрыть меню"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
