import React from 'react';
import { X, Download, Smartphone, CheckCircle2, ShieldCheck, Zap, RefreshCw, ExternalLink } from 'lucide-react';
import emblemIcon from '../assets/emblem-icon.png';

interface WidgetDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APK_DOWNLOAD_URL = 'https://github.com/luwili/study_room/releases/download/widget-apk-latest/StudyRoom-Widget.apk';
export const APK_VERSION = '1.1.0';

export const WidgetDownloadModal: React.FC<WidgetDownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#06101f] via-[#0b2447] to-[#12386c] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-1 flex items-center justify-center shadow-lg ring-2 ring-amber-300/40 flex-shrink-0">
              <img src={emblemIcon} alt="Эмблема" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Виджет расписания Android</h3>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-400 text-slate-950 uppercase">
                  v{APK_VERSION}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Группа ПОНБ-УП-304С · Институт права УУНиТ
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Features Callout */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-2.5">
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Samsung & Xiaomi</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Надежная работа без засыпания</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-2.5">
              <RefreshCw className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white">Автообновление</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">При включении экрана и в полночь</div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="space-y-2">
            <a
              href={APK_DOWNLOAD_URL}
              download="StudyRoom-Widget.apk"
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 border border-amber-300/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Скачать StudyRoom-Widget.apk (v{APK_VERSION})</span>
            </a>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
              Размер ~2.5 МБ · Для Android 8.0+ (Samsung One UI, Xiaomi HyperOS/MIUI, Honor, Pixel)
            </p>
          </div>

          {/* Quick installation / update guide */}
          <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Как установить или обновить приложение:</span>
            </div>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside pl-1">
              <li>
                Скачайте файл <strong>StudyRoom-Widget.apk</strong> по кнопке выше.
              </li>
              <li>
                Откройте загруженный файл и нажмите <strong>«Установить»</strong> (или «Обновить», если приложение уже установлено).
              </li>
              <li>
                <strong>Для добавления виджета:</strong> зажмите пустую область на рабочем столе телефона → выберите <em>«Виджеты»</em> → найдите <em>«ПОНБ-УП-304С»</em>.
              </li>
            </ol>
          </div>

          {/* Samsung & Xiaomi battery hint */}
          <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
            <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Важно для пользователей Samsung и Xiaomi:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[12px]">
              Чтобы виджет никогда не зависал при выключенном экране, откройте установленное приложение и нажмите кнопку 
              <strong> «Настроить батарею»</strong> (выберите режим <em>«Без ограничений»</em> / <em>«Не ограничено»</em>).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Репозиторий проекта на GitHub</span>
          <a
            href="https://github.com/luwili/study_room/releases/tag/widget-apk-latest"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-brand-600 dark:text-amber-400 hover:underline font-medium"
          >
            <span>Релизы</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
