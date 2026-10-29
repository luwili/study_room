package ru.uust.studyroom

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ScheduleWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_REFRESH = "ru.uust.studyroom.ACTION_REFRESH"
        private const val WEB_CABINET_URL = "https://luwili.github.io/study_room/#/schedule"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val schedule = ScheduleRepository.getTodaySchedule(context)

            val remoteViews = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // Responsive Layouts (API 31+)
                val compactRows = buildCompactRowsViews(context, appWidgetId, schedule)
                val columnsView = buildColumnsViews(context, appWidgetId, schedule)
                val expandedView = buildExpandedViews(context, appWidgetId, schedule)

                val viewMapping = mapOf(
                    SizeF(100f, 50f) to compactRows,
                    SizeF(170f, 60f) to columnsView,
                    SizeF(240f, 170f) to expandedView
                )
                RemoteViews(viewMapping)
            } else {
                // Pre-Android 12 size detection
                val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
                val width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 260)
                val height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 140)

                when {
                    height >= 170 && width >= 240 -> buildExpandedViews(context, appWidgetId, schedule)
                    width >= 170 -> buildColumnsViews(context, appWidgetId, schedule)
                    else -> buildCompactRowsViews(context, appWidgetId, schedule)
                }
            }

            appWidgetManager.updateAppWidget(appWidgetId, remoteViews)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.list_pairs)
        }

        /**
         * Horizontal Columns Layout (for 4x1, 4x2, 3x2, wide widgets).
         * Direct binding without asynchronous ListView ensures 100% reliability and zero empty boxes.
         */
        private fun buildColumnsViews(
            context: Context,
            appWidgetId: Int,
            schedule: DaySchedule
        ): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_schedule_columns)

            // Header date without squishing "Неделя"
            val headerDate = if (schedule.isToday) {
                schedule.dayName
            } else {
                "Завтра (${schedule.dayName})"
            }
            views.setTextViewText(R.id.tv_header_date, "· $headerDate")

            // Empty state
            if (schedule.pairs.isEmpty()) {
                views.setViewVisibility(R.id.layout_empty, View.VISIBLE)
                views.setViewVisibility(R.id.layout_columns, View.GONE)
            } else {
                views.setViewVisibility(R.id.layout_empty, View.GONE)
                views.setViewVisibility(R.id.layout_columns, View.VISIBLE)

                val pairs = schedule.pairs
                val slotIds = listOf(R.id.slot_col_1, R.id.slot_col_2, R.id.slot_col_3, R.id.slot_col_4)
                val numIds = listOf(R.id.col1_tv_num, R.id.col2_tv_num, R.id.col3_tv_num, R.id.col4_tv_num)
                val timeIds = listOf(R.id.col1_tv_time, R.id.col2_tv_time, R.id.col3_tv_time, R.id.col4_tv_time)
                val abbrIds = listOf(R.id.col1_tv_abbr, R.id.col2_tv_abbr, R.id.col3_tv_abbr, R.id.col4_tv_abbr)
                val subjectIds = listOf(R.id.col1_tv_subject, R.id.col2_tv_subject, R.id.col3_tv_subject, R.id.col4_tv_subject)
                val roomIds = listOf(R.id.col1_tv_room, R.id.col2_tv_room, R.id.col3_tv_room, R.id.col4_tv_room)

                val openPendingIntent = createOpenWebPendingIntent(context)

                for (i in 0 until 4) {
                    val slotId = slotIds[i]
                    if (i < pairs.size) {
                        val pair = pairs[i]
                        views.setViewVisibility(slotId, View.VISIBLE)
                        views.setTextViewText(numIds[i], pair.pairNumber.toString())
                        // Звонки
                        views.setTextViewText(timeIds[i], "${pair.timeStart}–${pair.timeEnd}")
                        // Сокращение (УП, СПП, АСП)
                        views.setTextViewText(abbrIds[i], pair.abbr)
                        // Компактное название предмета
                        views.setTextViewText(subjectIds[i], pair.shortName)
                        // Аудитория
                        views.setTextViewText(roomIds[i], pair.cleanRoom)

                        if (pair.isCurrent) {
                            views.setInt(slotId, "setBackgroundResource", R.drawable.bg_pair_item_current)
                        } else {
                            views.setInt(slotId, "setBackgroundResource", R.drawable.bg_pair_item)
                        }
                        views.setOnClickPendingIntent(slotId, openPendingIntent)
                    } else {
                        views.setViewVisibility(slotId, View.GONE)
                    }
                }
            }

            // Refresh action
            val refreshPendingIntent = createRefreshPendingIntent(context)
            views.setOnClickPendingIntent(R.id.btn_refresh, refreshPendingIntent)

            return views
        }

        /**
         * Compact Vertical Rows Layout (for narrow widgets like 2x2, 2x3).
         */
        private fun buildCompactRowsViews(
            context: Context,
            appWidgetId: Int,
            schedule: DaySchedule
        ): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_schedule_compact_rows)

            if (schedule.pairs.isEmpty()) {
                views.setViewVisibility(R.id.layout_empty, View.VISIBLE)
                views.setViewVisibility(R.id.layout_rows, View.GONE)
            } else {
                views.setViewVisibility(R.id.layout_empty, View.GONE)
                views.setViewVisibility(R.id.layout_rows, View.VISIBLE)

                val pairs = schedule.pairs
                val slotIds = listOf(R.id.slot_row_1, R.id.slot_row_2, R.id.slot_row_3, R.id.slot_row_4)
                val numIds = listOf(R.id.row1_tv_num, R.id.row2_tv_num, R.id.row3_tv_num, R.id.row4_tv_num)
                val nameIds = listOf(R.id.row1_tv_name, R.id.row2_tv_name, R.id.row3_tv_name, R.id.row4_tv_name)
                val timeIds = listOf(R.id.row1_tv_time, R.id.row2_tv_time, R.id.row3_tv_time, R.id.row4_tv_time)

                val openPendingIntent = createOpenWebPendingIntent(context)

                for (i in 0 until 4) {
                    val slotId = slotIds[i]
                    if (i < pairs.size) {
                        val pair = pairs[i]
                        views.setViewVisibility(slotId, View.VISIBLE)
                        views.setTextViewText(numIds[i], pair.pairNumber.toString())
                        // Название и аудитория
                        views.setTextViewText(nameIds[i], "${pair.abbr} · ${pair.cleanRoom}")
                        // Звонки
                        views.setTextViewText(timeIds[i], pair.timeStart)

                        if (pair.isCurrent) {
                            views.setInt(slotId, "setBackgroundResource", R.drawable.bg_pair_item_current)
                        } else {
                            views.setInt(slotId, "setBackgroundResource", R.drawable.bg_pair_item)
                        }
                        views.setOnClickPendingIntent(slotId, openPendingIntent)
                    } else {
                        views.setViewVisibility(slotId, View.GONE)
                    }
                }
            }

            // Refresh action
            val refreshPendingIntent = createRefreshPendingIntent(context)
            views.setOnClickPendingIntent(R.id.btn_refresh, refreshPendingIntent)

            return views
        }

        /**
         * Expanded Tall Layout (for 3x3, 4x3, 4x4 widgets).
         */
        private fun buildExpandedViews(
            context: Context,
            appWidgetId: Int,
            schedule: DaySchedule
        ): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_schedule)

            views.setTextViewText(R.id.tv_week_badge, "Неделя ${schedule.weekNumber}")
            val headerDate = if (schedule.isToday) {
                "${TimeUtils.getFormattedHeaderDate()} (${schedule.dayName})"
            } else {
                "Завтра: ${schedule.dayName}, ${schedule.date}"
            }
            views.setTextViewText(R.id.tv_header_date, headerDate)

            val serviceIntent = Intent(context, ScheduleWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                putExtra("is_compact", false)
                data = Uri.parse("ru.uust.studyroom://widget/$appWidgetId/expanded")
            }
            views.setRemoteAdapter(R.id.list_pairs, serviceIntent)
            views.setEmptyView(R.id.list_pairs, R.id.layout_empty)

            if (schedule.pairs.isEmpty()) {
                views.setViewVisibility(R.id.layout_empty, View.VISIBLE)
                views.setViewVisibility(R.id.list_pairs, View.GONE)
            } else {
                views.setViewVisibility(R.id.layout_empty, View.GONE)
                views.setViewVisibility(R.id.list_pairs, View.VISIBLE)
            }

            val refreshPendingIntent = createRefreshPendingIntent(context)
            views.setOnClickPendingIntent(R.id.btn_refresh, refreshPendingIntent)

            val openWebPendingIntent = createOpenWebPendingIntent(context)
            views.setOnClickPendingIntent(R.id.btn_open_web, openWebPendingIntent)
            views.setPendingIntentTemplate(R.id.list_pairs, openWebPendingIntent)

            return views
        }

        private fun createRefreshPendingIntent(context: Context): PendingIntent {
            val refreshIntent = Intent(context, ScheduleWidgetProvider::class.java).apply {
                action = ACTION_REFRESH
            }
            return PendingIntent.getBroadcast(
                context,
                0,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun createOpenWebPendingIntent(context: Context): PendingIntent {
            val openWebIntent = Intent(Intent.ACTION_VIEW, Uri.parse(WEB_CABINET_URL)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return PendingIntent.getActivity(
                context,
                1,
                openWebIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, ScheduleWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (widgetId in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId)
            }
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val updated = ScheduleRepository.fetchAndCache(context)
                if (updated) {
                    withContext(Dispatchers.Main) {
                        updateAllWidgets(context)
                    }
                }
            } catch (_: Exception) {
            } finally {
                pendingResult.finish()
            }
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_REFRESH -> {
                // 1. Immediately refresh views with local data for instant tactile feedback
                updateAllWidgets(context)

                // 2. Fetch fresh network data with goAsync() so Samsung One UI will not freeze/kill the thread
                val pendingResult = goAsync()
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val updated = ScheduleRepository.fetchAndCache(context)
                        if (updated) {
                            withContext(Dispatchers.Main) {
                                updateAllWidgets(context)
                            }
                        }
                    } catch (_: Exception) {
                    } finally {
                        pendingResult.finish()
                    }
                }
            }
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_SET,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_DATE_CHANGED,
            Intent.ACTION_USER_PRESENT -> {
                // Instantly update on screen unlock or day rollover
                updateAllWidgets(context)

                // Background sync if more than 15 mins since last sync
                if (ScheduleRepository.shouldRefreshNetwork(context)) {
                    val pendingResult = goAsync()
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val updated = ScheduleRepository.fetchAndCache(context)
                            if (updated) {
                                withContext(Dispatchers.Main) {
                                    updateAllWidgets(context)
                                }
                            }
                        } catch (_: Exception) {
                        } finally {
                            pendingResult.finish()
                        }
                    }
                }
            }
        }
    }
}
