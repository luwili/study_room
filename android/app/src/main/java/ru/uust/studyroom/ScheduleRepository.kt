package ru.uust.studyroom

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class PairItem(
    val id: String,
    val pairNumber: Int,
    val timeStart: String,
    val timeEnd: String,
    val subjectName: String,
    val teacher: String,
    val room: String,
    val type: String,
    val isCurrent: Boolean,
    val abbr: String = ScheduleRepository.getSubjectAbbr(subjectName),
    val shortName: String = ScheduleRepository.getShortSubjectName(subjectName),
    val cleanRoom: String = ScheduleRepository.cleanRoom(room)
)

data class DaySchedule(
    val dayName: String,
    val date: String,
    val weekNumber: Int,
    val isToday: Boolean,
    val pairs: List<PairItem>
)

object ScheduleRepository {
    private const val CACHE_FILE_NAME = "cached_schedule.json"
    private const val PREFS_NAME = "study_room_prefs"
    private const val KEY_LAST_SYNC = "last_sync_timestamp"

    /**
     * Multi-CDN mirror endpoints.
     * Even if GitHub Pages or Raw GitHub is blocked by white lists or VPN split tunneling,
     * jsDelivr Anycast (Cloudflare/Fastly/GCore) mirrors provide seamless connectivity in Russia.
     */
    val REPOSITORY_MIRRORS = listOf(
        // 1. Direct GitHub Pages CDN
        "https://luwili.github.io/study_room/data/schedule.json",
        // 2. Anycast jsDelivr CDN mirrors (direct caching servers in Russia/Europe)
        "https://cdn.jsdelivr.net/gh/luwili/study_room@main/public/data/schedule.json",
        "https://fastly.jsdelivr.net/gh/luwili/study_room@main/public/data/schedule.json",
        "https://gcore.jsdelivr.net/gh/luwili/study_room@main/public/data/schedule.json",
        // 3. GitHub Raw fallback
        "https://raw.githubusercontent.com/luwili/study_room/main/public/data/schedule.json",
        "https://raw.githubusercontent.com/luwili/study_room/main/src/data/schedule.json"
    )

    fun getSubjectAbbr(fullName: String): String {
        val lower = fullName.lowercase()
        return when {
            lower.contains("административн") -> "АСП"
            lower.contains("уголовно-процесс") || lower.contains("уголовный процесс") -> "УПП"
            lower.contains("уголовн") -> "УП"
            lower.contains("гражданско-процесс") || lower.contains("гражданский процесс") -> "ГПП"
            lower.contains("гражданск") -> "ГП"
            lower.contains("финансов") && lower.contains("грамотн") -> "ОФГ"
            lower.contains("финансов") -> "ФП"
            lower.contains("экологическ") -> "ЭП"
            lower.contains("международн") -> "МП"
            lower.contains("специальн") || lower.contains("профессиональн") -> "СПП"
            lower.contains("физическ") || lower.contains("офп") -> "ОФП"
            lower.contains("информационн") -> "ИТ"
            lower.contains("экономическ") -> "ЭОБ"
            else -> {
                val words = fullName.split(" ").filter { it.isNotBlank() }
                if (words.size >= 2) words.map { it.first().uppercase() }.joinToString("")
                else fullName.take(4).uppercase()
            }
        }
    }

    fun getShortSubjectName(fullName: String): String {
        val lower = fullName.lowercase()
        return when {
            lower.contains("административн") -> "Админ. процесс"
            lower.contains("уголовно-процесс") || lower.contains("уголовный процесс") -> "Уголовный процесс"
            lower.contains("уголовн") -> "Уголовное право"
            lower.contains("гражданско-процесс") || lower.contains("гражданский процесс") -> "Гражданский процесс"
            lower.contains("гражданск") -> "Гражданское право"
            lower.contains("финансов") && lower.contains("грамотн") -> "Фин. грамотность"
            lower.contains("финансов") -> "Финансовое право"
            lower.contains("экологическ") -> "Экологическое право"
            lower.contains("международн") -> "Международное право"
            lower.contains("специальн") || lower.contains("профессиональн") -> "Спец. подготовка"
            lower.contains("физическ") || lower.contains("офп") -> "ОФП (Физ-ра)"
            lower.contains("информационн") -> "Информ. технологии"
            lower.contains("экономическ") -> "Экономика бизнеса"
            else -> fullName
        }
    }

    fun cleanRoom(room: String): String {
        val cleaned = room.replace("(Достоевского 131)", "")
            .replace("каб.", "")
            .trim()
        return when {
            cleaned.isBlank() -> "Достоевского 131"
            cleaned.contains("Спорткомплекс") -> "Спорткомплекс"
            else -> "каб. $cleaned"
        }
    }

    fun shouldRefreshNetwork(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastSync = prefs.getLong(KEY_LAST_SYNC, 0L)
        // Refresh at most once every 15 minutes during background screen unlocks
        return System.currentTimeMillis() - lastSync > 15 * 60 * 1000L
    }

    private fun setLastSync(context: Context, timestamp: Long) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putLong(KEY_LAST_SYNC, timestamp).apply()
    }

    fun saveScheduleJson(context: Context, jsonContent: String): Boolean {
        return try {
            if (jsonContent.isNotBlank() && jsonContent.contains("ПОНБ-УП-304С")) {
                val cacheFile = File(context.filesDir, CACHE_FILE_NAME)
                cacheFile.writeText(jsonContent)
                setLastSync(context, System.currentTimeMillis())
                ScheduleWidgetProvider.updateAllWidgets(context)
                true
            } else false
        } catch (_: Exception) {
            false
        }
    }

    fun fetchAndCache(context: Context): Boolean {
        for (urlStr in REPOSITORY_MIRRORS) {
            try {
                val url = URL(urlStr)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 3000
                    readTimeout = 4000
                    requestMethod = "GET"
                    instanceFollowRedirects = true
                    setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; StudyRoomWidget/1.2.0)")
                    setRequestProperty("Cache-Control", "no-cache, no-store")
                    setRequestProperty("Accept", "application/json, text/plain, */*")
                }
                conn.connect()

                if (conn.responseCode == HttpURLConnection.HTTP_OK) {
                    val content = conn.inputStream.bufferedReader().use { it.readText() }
                    if (saveScheduleJson(context, content)) {
                        return true
                    }
                }
            } catch (_: Exception) {
                // Quickly move to the next mirror
            }
        }
        return false
    }

    fun getTodaySchedule(context: Context): DaySchedule {
        val cacheFile = File(context.filesDir, CACHE_FILE_NAME)
        var jsonString = if (cacheFile.exists()) {
            try {
                cacheFile.readText()
            } catch (_: Exception) {
                ""
            }
        } else {
            ""
        }

        // Fallback to bundled asset if cache doesn't exist yet (guarantees widget is never empty)
        if (jsonString.isBlank()) {
            try {
                context.assets.open("schedule.json").use { stream ->
                    jsonString = stream.bufferedReader().use { it.readText() }
                    cacheFile.writeText(jsonString)
                }
            } catch (_: Exception) {
            }
        }

        if (jsonString.isBlank()) {
            return DaySchedule("Сегодня", TimeUtils.getUfaDateString(), TimeUtils.calculateCurrentWeek(), true, emptyList())
        }

        return try {
            val root = JSONObject(jsonString)
            // Dynamically calculate current week based on date; fallback to json if calculation fails
            val dynamicWeekNumber = TimeUtils.calculateCurrentWeek()
            val currentWeekNumber = if (dynamicWeekNumber in 1..17) dynamicWeekNumber else root.optInt("currentWeekNumber", 9)
            val dayOfWeek = TimeUtils.getUfaDayOfWeek()
            val todayDate = TimeUtils.getUfaDateString()

            // If Sunday (7), show Monday's schedule of upcoming week
            val isSunday = dayOfWeek == 7
            val targetDayOfWeek = if (isSunday) 1 else dayOfWeek
            val targetWeekNumber = if (isSunday) (currentWeekNumber + 1).coerceAtMost(17) else currentWeekNumber

            var targetDayObj: JSONObject? = null

            // 1. Check in "weeks" map
            if (root.has("weeks")) {
                val weeksObj = root.optJSONObject("weeks")
                val weekObj = weeksObj?.optJSONObject(targetWeekNumber.toString())
                if (weekObj != null && weekObj.has("days")) {
                    val daysArr = weekObj.optJSONArray("days")
                    if (daysArr != null) {
                        for (i in 0 until daysArr.length()) {
                            val d = daysArr.optJSONObject(i) ?: continue
                            if (d.optInt("dayOfWeek") == targetDayOfWeek) {
                                targetDayObj = d
                                break
                            }
                        }
                    }
                }
            }

            // 2. Fallback to root "days"
            if (targetDayObj == null && root.has("days")) {
                val daysArr = root.optJSONArray("days")
                if (daysArr != null) {
                    for (i in 0 until daysArr.length()) {
                        val d = daysArr.optJSONObject(i) ?: continue
                        if (d.optInt("dayOfWeek") == targetDayOfWeek) {
                            targetDayObj = d
                            break
                        }
                    }
                }
            }

            if (targetDayObj == null) {
                return DaySchedule("Сегодня", todayDate, currentWeekNumber, !isSunday, emptyList())
            }

            val dayName = targetDayObj.optString("dayName", "Сегодня")
            val dateStr = targetDayObj.optString("date", todayDate)
            val pairsArr = targetDayObj.optJSONArray("pairs")
            val pairsList = mutableListOf<PairItem>()

            if (pairsArr != null) {
                for (i in 0 until pairsArr.length()) {
                    val p = pairsArr.optJSONObject(i) ?: continue
                    val tStart = p.optString("timeStart", "")
                    val tEnd = p.optString("timeEnd", "")
                    val isCurrent = if (!isSunday && targetWeekNumber == currentWeekNumber) {
                        TimeUtils.isPairNow(tStart, tEnd)
                    } else false

                    val sName = p.optString("subjectName", "Предмет")
                    val sTeacher = p.optString("teacher", "")
                    val sRoom = p.optString("room", "")

                    pairsList.add(
                        PairItem(
                            id = p.optString("id", "pair-$i"),
                            pairNumber = p.optInt("pairNumber", i + 1),
                            timeStart = tStart,
                            timeEnd = tEnd,
                            subjectName = sName,
                            teacher = sTeacher,
                            room = sRoom,
                            type = p.optString("type", "Семинар"),
                            isCurrent = isCurrent
                        )
                    )
                }
            }

            DaySchedule(
                dayName = dayName,
                date = dateStr,
                weekNumber = targetWeekNumber,
                isToday = !isSunday,
                pairs = pairsList
            )
        } catch (_: Exception) {
            DaySchedule("Сегодня", TimeUtils.getUfaDateString(), TimeUtils.calculateCurrentWeek(), true, emptyList())
        }
    }
}
