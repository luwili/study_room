import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { SyncToast } from './components/SyncToast';
import { triggerOneClickSync, SyncStatus } from './utils/scheduleSync';

// Core pages (eager loaded for instant first paint on mobile)
import { HomePage } from './pages/HomePage';
import { SchedulePage } from './pages/SchedulePage';

// Lazy loaded secondary pages & heavy modals
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then(m => ({ default: m.SubjectsPage })));
const TopicsPage = lazy(() => import('./pages/TopicsPage').then(m => ({ default: m.TopicsPage })));
const ExamPrepPage = lazy(() => import('./pages/ExamPrepPage').then(m => ({ default: m.ExamPrepPage })));
const TeachersPage = lazy(() => import('./pages/TeachersPage').then(m => ({ default: m.TeachersPage })));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage').then(m => ({ default: m.DepartmentsPage })));
const InstitutePage = lazy(() => import('./pages/InstitutePage').then(m => ({ default: m.InstitutePage })));
const GratitudePage = lazy(() => import('./pages/GratitudePage').then(m => ({ default: m.GratitudePage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const WidgetDownloadModal = lazy(() => import('./components/WidgetDownloadModal').then(m => ({ default: m.WidgetDownloadModal })));

const PageSkeleton = () => (
  <div className="space-y-6 pb-12 animate-pulse">
    <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
      <div className="h-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
    </div>
  </div>
);

import { 
  getStoredItem, 
  setStoredItem, 
  STORAGE_KEYS 
} from './utils/storage';

export function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = getStoredItem<string | null>(STORAGE_KEYS.THEME, null);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Navigation tab state (synced with URL hash)
  const getTabFromHash = (): string => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const tabName = hash.split('?')[0];
    const validTabs = [
      'home', 'schedule', 'subjects', 'topics', 
      'exam', 'teachers', 'departments', 
      'institute', 'gratitude', 'favorites'
    ];
    return validTabs.includes(tabName) ? tabName : 'home';
  };

  const [currentTab, setCurrentTab] = useState<string>(getTabFromHash);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');
  const [scheduleTargetWeek, setScheduleTargetWeek] = useState<number | undefined>(undefined);

  // Modals & Drawers
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1-Click Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleStartOneClickSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    triggerOneClickSync((status) => {
      setSyncStatus(status);
      if (status.state === 'error' || status.state === 'idle') {
        setIsSyncing(false);
      }
    });
  };

  // User Local State
  const [favorites, setFavorites] = useState<string[]>(() => {
    return getStoredItem<string[]>(STORAGE_KEYS.FAVORITES, ['gp-para-1', 'gpp-para-1', 'ugolov-t1']);
  });

  const [knownCards, setKnownCards] = useState<string[]>(() => {
    return getStoredItem<string[]>(STORAGE_KEYS.EXAM_KNOWN, ['eq-4']);
  });

  const [repeatCards, setRepeatCards] = useState<string[]>(() => {
    return getStoredItem<string[]>(STORAGE_KEYS.EXAM_REPEAT, []);
  });

  // Sync dark mode with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      setStoredItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      setStoredItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [darkMode]);

  // Sync hash changes (browser back/forward button)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = `/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setStoredItem(STORAGE_KEYS.FAVORITES, next);
      return next;
    });
  };

  const handleMarkKnown = (id: string) => {
    setKnownCards((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      setStoredItem(STORAGE_KEYS.EXAM_KNOWN, next);
      return next;
    });
    setRepeatCards((prev) => {
      const next = prev.filter((x) => x !== id);
      setStoredItem(STORAGE_KEYS.EXAM_REPEAT, next);
      return next;
    });
  };

  const handleMarkRepeat = (id: string) => {
    setRepeatCards((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      setStoredItem(STORAGE_KEYS.EXAM_REPEAT, next);
      return next;
    });
    setKnownCards((prev) => {
      const next = prev.filter((x) => x !== id);
      setStoredItem(STORAGE_KEYS.EXAM_KNOWN, next);
      return next;
    });
  };

  const handleResetExamProgress = () => {
    setKnownCards([]);
    setRepeatCards([]);
    setStoredItem(STORAGE_KEYS.EXAM_KNOWN, []);
    setStoredItem(STORAGE_KEYS.EXAM_REPEAT, []);
  };

  // Cross-page navigation handlers
  const handleNavigateTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    handleSelectTab('topics');
  };

  const handleNavigateSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    handleSelectTab('subjects');
  };

  const handleNavigateTeacher = (teacherName: string) => {
    setTeacherSearchQuery(teacherName);
    handleSelectTab('teachers');
  };

  const handleSelectDepartment = (deptName: string) => {
    setTeacherSearchQuery(deptName);
    handleSelectTab('teachers');
  };

  const handleGlobalNavigate = (tab: string, itemId?: string) => {
    if (tab === 'topics' && itemId) setSelectedTopicId(itemId);
    if (tab === 'subjects' && itemId) setSelectedSubjectId(itemId);
    if (tab === 'teachers' && itemId) setTeacherSearchQuery('');
    if (tab === 'schedule' && itemId) setScheduleTargetWeek(Number(itemId));
    handleSelectTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        favoritesCount={favorites.length}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenWidgetModal={() => setWidgetModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          favoritesCount={favorites.length}
          onOpenWidgetModal={() => setWidgetModalOpen(true)}
        />

        {/* Content Page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full overflow-hidden">
          {currentTab === 'home' && (
            <HomePage 
              onNavigate={handleGlobalNavigate} 
              onOpenSync={handleStartOneClickSync}
              isSyncing={isSyncing}
              onOpenWidgetModal={() => setWidgetModalOpen(true)}
            />
          )}

          {currentTab === 'schedule' && (
            <SchedulePage
              initialWeek={scheduleTargetWeek}
              onNavigateTeacher={handleNavigateTeacher}
              onNavigateSubject={handleNavigateSubject}
              onOpenSync={handleStartOneClickSync}
              isSyncing={isSyncing}
              onOpenWidgetModal={() => setWidgetModalOpen(true)}
            />
          )}

          <Suspense fallback={<PageSkeleton />}>
            {currentTab === 'subjects' && (
              <SubjectsPage
                onNavigateTopic={handleNavigateTopic}
                onNavigateTeacher={handleNavigateTeacher}
                selectedSubjectId={selectedSubjectId}
              />
            )}

            {currentTab === 'topics' && (
              <TopicsPage
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                selectedTopicId={selectedTopicId}
              />
            )}

            {currentTab === 'exam' && (
              <ExamPrepPage
                knownCards={knownCards}
                repeatCards={repeatCards}
                onMarkKnown={handleMarkKnown}
                onMarkRepeat={handleMarkRepeat}
                onResetProgress={handleResetExamProgress}
                onNavigateSubject={handleNavigateSubject}
                onNavigateTopic={handleNavigateTopic}
              />
            )}

            {currentTab === 'teachers' && (
              <TeachersPage
                initialSearch={teacherSearchQuery}
                onNavigateSubject={handleNavigateSubject}
              />
            )}

            {currentTab === 'departments' && (
              <DepartmentsPage
                onSelectDepartment={handleSelectDepartment}
              />
            )}

            {currentTab === 'institute' && (
              <InstitutePage />
            )}

            {currentTab === 'gratitude' && (
              <GratitudePage />
            )}

            {currentTab === 'favorites' && (
              <FavoritesPage
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onNavigateTopic={handleNavigateTopic}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 no-print pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Неофициальный учебный кабинет группы ПОНБ-УП-304С
            </span>
            <span className="mx-2 hidden sm:inline">·</span>
            <span>Институт права УУНиТ (г. Уфа)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleSelectTab('gratitude')}
              className="text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
            >
              <span>Искренняя благодарность</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setWidgetModalOpen(true)}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline transition-colors flex items-center space-x-1"
            >
              <span>Виджет для Android (APK v1.2.0)</span>
            </button>
            <span>·</span>
            <a
              href="https://law-bsu.ru/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 dark:text-brand-400 hover:underline"
            >
              Официальный сайт института (law-bsu.ru)
            </a>
            <span>·</span>
            <span className="text-slate-400">Часовой пояс: Asia/Yekaterinburg (UTC+5)</span>
          </div>
        </div>
      </footer>

      {/* Bottom bar for mobile smartphones */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Search Modal (loaded on demand) */}
      {searchModalOpen && (
        <Suspense fallback={null}>
          <SearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            onNavigate={handleGlobalNavigate}
          />
        </Suspense>
      )}

      {/* Android Widget Download Modal */}
      {widgetModalOpen && (
        <Suspense fallback={null}>
          <WidgetDownloadModal
            isOpen={widgetModalOpen}
            onClose={() => setWidgetModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Sync Notification Toast */}
      <SyncToast
        status={syncStatus}
        onDismiss={() => {
          setSyncStatus(null);
          setIsSyncing(false);
        }}
        onReloadNow={() => window.location.reload()}
      />
    </div>
  );
}
