# Регламент обновления проекта Study Room (ПОНБ-УП-304С)

Данный документ описывает строгий порядок и архитектурные правила синхронизации расписания, сборки нативного Android-виджета и деплоя на сайт.

---

## 1. Архитектура данных расписания

Расписание группы ПОНБ-УП-304С хранится синхронно в трёх файлах:
- `src/data/schedule.json` — основной источник для React SPA
- `public/data/schedule.json` — статический CDN-эндпоинт для виджета и сторонних клиентов
- `android/app/src/main/assets/schedule.json` — оффлайн-снапшот, упаковываемый внутрь APK при компиляции

### Правила целостности:
1. **Сохранение всех 245 пар семестра**: массив `semesterPairs` (недели 1–17) никогда не должен обнуляться или усекаться при сбоях парсера ИСУ. Если сервер ИСУ УУНиТ не вернул пары на какую-то неделю, сохраняются существующие пары из локального файла.
2. **Параметры текущей недели**:
   - `currentWeekNumber`: актуальный номер недели (1..17).
   - `weekType`: `"odd"` (нечётная) или `"even"` (чётная).
   - `days`: массив дней текущей недели (понедельник – суббота) с датами в формате `YYYY-MM-DD`.
3. **Окна (перерывы)**:
   - В дни с разрывами между занятиями (например, вторник: пары 1, 2 и 4) автоматически формируются карточки перерывов (3 пара 11:10–12:30 «Пары нет / Окно / Коворкинг»).

---

## 2. Нативный виджет Android (`android/`)

### 00:00 Автообновление (полночь):
- В `TimeUtils.kt` реализован расчёт `getNextMidnightMillis()` с точностью до миллисекунды для часового пояса `Asia/Yekaterinburg` (UTC+5, Уфа).
- В `ScheduleWidgetProvider.kt`:
  - `scheduleMidnightAlarm(context)` использует `AlarmManager.RTC_WAKEUP` через `setExactAndAllowWhileIdle` (с fallback на `setAndAllowWhileIdle`).
  - Приёмник обрабатывает `ACTION_MIDNIGHT_UPDATE`: сразу же перезаводит будильник на следующие сутки, обновляет RemoteViews и запускает фоновую сверку с сетью.
  - Будильник автоматически перевзводится при:
    * `BOOT_COMPLETED` (перезагрузка устройства)
    * `MY_PACKAGE_REPLACED` (обновление APK)
    * `TIME_SET` / `TIMEZONE_CHANGED` (ручной перевод часов / смена пояса)
    * `ACTION_USER_PRESENT` (включение экрана утром: проверяет `hasDateRolledOver()` и мгновенно переключает день)
    * `onEnabled()` / `onUpdate()` (добавление или стандартный тик виджета)
- Все тяжелые операции в `BroadcastReceiver` выполняются через `goAsync()` и Kotlin Coroutines, предотвращая `Application Not Responding` (ANR) на любых прошивках (Samsung One UI, Xiaomi HyperOS, ColorOS, Pixel).

### Версионирование:
- При обновлении Android-кода или логики виджета:
  - Инкрементировать `versionCode` и `versionName` в `android/app/build.gradle`.
  - Обновить `APK_VERSION` в `src/components/WidgetDownloadModal.tsx`.
  - Обновить версию в `package.json` и `README.md`.

---

## 3. Прямая раздача APK с веб-сайта (GitHub Pages)

### ⚠️ ВАЖНОЕ ПРАВИЛО: НЕ коммитить бинарные `.apk` в Git!
- Бинарные файлы `*.apk` (~5-6 МБ) **запрещено** коммитить в git-репозиторий (во избежание ошибки `RPC failed; HTTP 408 curl 22` из-за таймаута загрузки больших git pack по HTTPS).
- В `.gitignore` внесены правила:
  ```gitignore
  *.apk
  public/*.apk
  ```

### Механизм автоматической публикации APK на сайте:
1. При пуше изменений в `android/**` срабатывает `.github/workflows/build-apk.yml`:
   - Собирает `StudyRoom-Widget.apk` с помощью Java 17 и Gradle 8.5.
   - Загружает его в релиз GitHub Releases с тегом `widget-apk-latest`.
   - В финальном шаге запускает `.github/workflows/deploy.yml` через `gh workflow run deploy.yml`.
2. В рабочем процессе `.github/workflows/deploy.yml`:
   - Перед `npm run build` автоматически скачивает актуальный `StudyRoom-Widget.apk` из релиза `widget-apk-latest` в директорию `public/`:
     ```bash
     curl -L -s -f "https://github.com/${{ github.repository }}/releases/download/widget-apk-latest/StudyRoom-Widget.apk" -o public/StudyRoom-Widget.apk
     ```
   - Команда `npm run build` (Vite) копирует `public/StudyRoom-Widget.apk` в `./dist/StudyRoom-Widget.apk`.
   - GitHub Pages раздаёт готовый бинарник по прямому URL:
     `https://luwili.github.io/study_room/StudyRoom-Widget.apk`
3. Все ссылки и кнопки скачивания в интерфейсе сайта ведут на относительный путь `./StudyRoom-Widget.apk` (с дополнительной кнопкой-зеркалом на GitHub Releases).

---

## 4. Пошаговый чек-лист обновления

При выполнении обновлений строго следовать этому порядку:

1. **Внесение изменений**:
   - Обновить код виджета / расписания / веб-интерфейса.
   - Проверить форматирование и типизацию.
2. **Локальная проверка сборки**:
   ```bash
   npm run build
   ```
   Убедиться, что сборка Vite завершается кодом 0 без ошибок TypeScript.
3. **Синхронизация с удалённым репозиторием**:
   - Проверить наличие автокоммитов бота синхронизации ИСУ:
     ```bash
     git pull --rebase origin main
     ```
4. **Фиксация и пуш**:
   ```bash
   git add <изменённые_файлы>
   git commit -m "feat/fix: описание изменений"
   git push origin main
   ```
5. **Контроль CI/CD (GitHub Actions)**:
   ```bash
   gh run list --limit 3
   ```
   Дождаться успешного завершения (`✓`) пайплайнов `Build Android Widget APK` и `Deploy to GitHub Pages`.
6. **Верификация раздачи**:
   - Проверить ответ сервера сайта:
     ```bash
     curl -s -I "https://luwili.github.io/study_room/StudyRoom-Widget.apk"
     ```
     Должен возвращать: `HTTP/2 200` и `content-type: application/vnd.android.package-archive`.
   - Проверить главную страницу сайта:
     ```bash
     curl -s -I "https://luwili.github.io/study_room/"
     ```
