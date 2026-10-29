package ru.uust.studyroom

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private val cabinetUrl = "https://luwili.github.io/study_room/"
    private val apkDownloadUrl = "https://github.com/luwili/study_room/releases/download/widget-apk-latest/StudyRoom-Widget.apk"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val tvVersion = findViewById<TextView>(R.id.tv_app_version)
        val tvStatus = findViewById<TextView>(R.id.tv_cache_status)
        val btnUpdate = findViewById<Button>(R.id.btn_update_now)
        val btnBattery = findViewById<Button>(R.id.btn_battery_settings)
        val btnDownloadUpdate = findViewById<Button>(R.id.btn_download_update)
        val btnOpenWeb = findViewById<Button>(R.id.btn_open_website)

        val versionName = try {
            packageManager.getPackageInfo(packageName, 0).versionName
        } catch (_: Exception) {
            "1.1.0"
        }
        tvVersion.text = "Версия $versionName · ПОНБ-УП-304С"

        // Initial check
        refreshData(tvStatus)

        btnUpdate.setOnClickListener {
            tvStatus.text = "Статус: синхронизация с сервером..."
            refreshData(tvStatus, showToast = true)
        }

        btnBattery.setOnClickListener {
            openBatterySettings()
        }

        btnDownloadUpdate.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(apkDownloadUrl)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }

        btnOpenWeb.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(cabinetUrl)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(intent)
        }
    }

    @SuppressLint("BatteryLife")
    private fun openBatterySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                    return
                } catch (_: Exception) {
                }
            }
        }
        // Fallback to application details settings
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
            }
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(this, "Откройте настройки приложения вручную и отключите ограничения батареи", Toast.LENGTH_SHORT).show()
        }
    }

    private fun refreshData(tvStatus: TextView, showToast: Boolean = false) {
        CoroutineScope(Dispatchers.IO).launch {
            val success = ScheduleRepository.fetchAndCache(this@MainActivity)
            val schedule = ScheduleRepository.getTodaySchedule(this@MainActivity)
            withContext(Dispatchers.Main) {
                if (success) {
                    tvStatus.text = "Статус: данные актуальны (пар сегодня: ${schedule.pairs.size}, неделя ${schedule.weekNumber})"
                    if (showToast) Toast.makeText(this@MainActivity, "Расписание успешно обновлено!", Toast.LENGTH_SHORT).show()
                } else {
                    tvStatus.text = "Статус: используется локальный кэш (пар сегодня: ${schedule.pairs.size}, неделя ${schedule.weekNumber})"
                    if (showToast) Toast.makeText(this@MainActivity, "Данные загружены из кэша", Toast.LENGTH_SHORT).show()
                }
                ScheduleWidgetProvider.updateAllWidgets(this@MainActivity)
            }
        }
    }
}
