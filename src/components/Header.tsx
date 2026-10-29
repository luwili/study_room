import React, { useEffect, useState } from 'react';
import { 
  Sun, 
  Moon, 
  Search, 
  Bookmark, 
  Clock, 
  Menu, 
  Building,
  Smartphone
} from 'lucide-react';
import emblemIcon from '../assets/emblem-icon.png';
import { getUfaTimeInfo, UfaTimeInfo } from '../utils/time';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
  favoritesCount: number;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWidgetModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleTheme,
  onOpenSearch,
  onOpenMobileMenu,
  favoritesCount,
  onSelectTab,
  onOpenWidgetModal
}) => {
  const [timeInfo, setTimeInfo] = useState<UfaTimeInfo>(getUfaTimeInfo());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(getUfaTimeInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: mobile hamburger + brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button 
              onClick={() => onSelectTab('home')}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#06101e] via-[#0b2447] to-[#12386c] flex items-center justify-center shadow-md ring-1 ring-amber-400/40 group-hover:ring-amber-300/70 group-hover:scale-105 transition-all p-1 overflow-hidden flex-shrink-0">
                <img 
                  src={emblemIcon} 
                  alt="Эмблема ПОНБ-УП-304С" 
                  className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" 
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none group-hover:text-brand-700 dark:group-hover:text-amber-300 transition-colors">
                    ПОНБ-УП-304С
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-amber-300 border border-brand-200 dark:border-amber-500/30 leading-none">
                    УУНиТ
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight hidden sm:inline-block">
                  Институт права · Уфа
                </span>
              </div>
            </button>
          </div>

          {/* Center section: Live Ufa clock & Pair status */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{timeInfo.timeString}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">(Уфа, UTC+5)</span>
            </div>

            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />

            {timeInfo.currentPairStatus === 'ongoing' ? (
              <span className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Идет {timeInfo.currentPair}-я пара</span>
              </span>
            ) : timeInfo.currentPairStatus === 'break' ? (
              <span className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{timeInfo.pairDetails?.description}</span>
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Занятия завершены
              </span>
            )}
          </div>

          {/* Right section: Widget, Search, Favorites, Theme */}
          <div className="flex items-center space-x-2">
            {onOpenWidgetModal && (
              <button
                onClick={onOpenWidgetModal}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-200 dark:border-amber-500/30 transition-all shadow-sm active:scale-95"
                title="Скачать нативный виджет расписания для Android (APK v1.1.0)"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Виджет</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-bold">APK</span>
              </button>
            )}

            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Поиск по сайту (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Поиск...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => onSelectTab('favorites')}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Избранное"
              aria-label="Избранное"
            >
              <Bookmark className="w-5 h-5 text-slate-600 dark:text-slate-300 hover:text-amber-500" />
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={darkMode ? "Включить светлую тему" : "Включить тёмную тему"}
              aria-label="Переключить тему"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-brand-900" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
