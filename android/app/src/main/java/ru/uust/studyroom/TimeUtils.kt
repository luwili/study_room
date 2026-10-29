package ru.uust.studyroom

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

object TimeUtils {
    private val UFA_TIMEZONE = TimeZone.getTimeZone("Asia/Yekaterinburg")
    private val RUSSIAN_LOCALE = Locale("ru", "RU")

    fun getUfaCalendar(): Calendar {
        return Calendar.getInstance(UFA_TIMEZONE)
    }

    /**
     * Day of week (1 = Mon ... 7 = Sun)
     */
    fun getUfaDayOfWeek(): Int {
        val cal = getUfaCalendar()
        return when (cal.get(Calendar.DAY_OF_WEEK)) {
            Calendar.MONDAY -> 1
            Calendar.TUESDAY -> 2
            Calendar.WEDNESDAY -> 3
            Calendar.THURSDAY -> 4
            Calendar.FRIDAY -> 5
            Calendar.SATURDAY -> 6
            Calendar.SUNDAY -> 7
            else -> 1
        }
    }

    fun getUfaDateString(): String {
        val cal = getUfaCalendar()
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        sdf.timeZone = UFA_TIMEZONE
        return sdf.format(cal.time)
    }

    fun getFormattedHeaderDate(): String {
        val cal = getUfaCalendar()
        val dayFormat = SimpleDateFormat("EEEE, d MMMM", RUSSIAN_LOCALE)
        dayFormat.timeZone = UFA_TIMEZONE
        val raw = dayFormat.format(cal.time)
        return raw.replaceFirstChar { if (it.isLowerCase()) it.titlecase(RUSSIAN_LOCALE) else it.toString() }
    }

    /**
     * Dynamically calculates current semester week number (1..17).
     * Semester began 2026-09-01 (Tuesday), so Monday of week 1 was 2026-08-31.
     * Guarantees accurate week determination even when offline or cache is old.
     */
    fun calculateCurrentWeek(cal: Calendar = getUfaCalendar()): Int {
        val startMonday = Calendar.getInstance(UFA_TIMEZONE).apply {
            set(Calendar.YEAR, 2026)
            set(Calendar.MONTH, Calendar.AUGUST)
            set(Calendar.DAY_OF_MONTH, 31)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val diffMillis = cal.timeInMillis - startMonday.timeInMillis
        if (diffMillis < 0) return 1
        val diffDays = (diffMillis / (1000L * 60 * 60 * 24)).toInt()
        val week = (diffDays / 7) + 1
        return week.coerceIn(1, 17)
    }

    /**
     * Checks if current Ufa time is within [timeStart] (e.g. "08:00") and [timeEnd] (e.g. "09:20")
     */
    fun isPairNow(timeStart: String, timeEnd: String): Boolean {
        try {
            val cal = getUfaCalendar()
            val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

            val (startH, startM) = timeStart.trim().split(":").map { it.toInt() }
            val (endH, endM) = timeEnd.trim().split(":").map { it.toInt() }

            val startTotal = startH * 60 + startM
            val endTotal = endH * 60 + endM

            return currentMinutes in startTotal..endTotal
        } catch (_: Exception) {
            return false
        }
    }
}
