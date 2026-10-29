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

        handleSyncIntent(intent)

        val tvVersion = findViewById<TextView>(R.id.tv_app_version)
        val tvStatus = findViewById<TextView>(R.id.tv_cache_status)
        val btnUpdate = findViewById<Button>(R.id.btn_update_now)
        val btnBattery = findViewById<Button>(R.id.btn_battery_settings)
        val btnEmbeddedWeb = findViewById<Button>(R.id.btn_open_embedded_web)
        val btnDownloadUpdate = findViewById<Button>(R.id.btn_download_update)
        val btnOpenWeb = findViewById<Button>(R.id.btn_open_website)

        val versionName = try {
            packageManager.getPackageInfo(packageName, 0).versionName
        } catch (_: Exception) {
            "1.2.0"
        }
        tvVersion.text = "Версия $versionName · ПОНБ-УП-304С"

        // Initial check
        refreshData(tvStatus)

        btnUpdate.setOnClickListener {
            tvStatus.text = "Статус: синхронизация с CDN-зеркалами..."
            refreshData(tvStatus, showToast = true)
        }

        btnBattery.setOnClickListener {
            openBatterySettings()
        }

        btnEmbeddedWeb.setOnClickListener {
            openEmbeddedWebCabinet()
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

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleSyncIntent(intent)
    }

    private fun handleSyncIntent(intent: Intent?) {
        if (intent == null) return
        val data = intent.data ?: return
        if (data.scheme == "studyroom" && data.host == "sync") {
            val rawPayload = data.getQueryParameter("data")
            if (!rawPayload.isNullOrBlank()) {
                val ok = ScheduleRepository.saveScheduleJson(this, rawPayload)
                if (ok) {
                    Toast.makeText(this, "Расписание успешно синхронизировано из веб-кабинета!", Toast.LENGTH_LONG).show()
                    val tvStatus = findViewById<TextView>(R.id.tv_cache_status)
                    tvStatus?.text = "Статус: актуальные данные загружены из веб-кабинета!"
                } else {
                    Toast.makeText(this, "Ошибка формата данных расписания", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun openEmbeddedWebCabinet() {
        val dialog = android.app.Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
        val root = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(android.graphics.Color.parseColor("#09101d"))
        }

        val topBar = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            setPadding(28, 28, 28, 28)
            setBackgroundColor(android.graphics.Color.parseColor("#040812"))
        }

        val btnClose = Button(this).apply {
            text = "✕ Закрыть и обновить виджет"
            setTextColor(android.graphics.Color.parseColor("#fbbf24"))
            setBackgroundColor(android.graphics.Color.parseColor("#1e293b"))
            setPadding(32, 16, 32, 16)
            setOnClickListener {
                dialog.dismiss()
                refreshData(findViewById(R.id.tv_cache_status))
            }
        }
        topBar.addView(btnClose)

        val webView = android.webkit.WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            webViewClient = object : android.webkit.WebViewClient() {
                override fun onPageFinished(view: android.webkit.WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    evaluateJavascript(
                        """
                        (function() {
                            try {
                                if (window.AndroidBridge && window.__STUDY_ROOM_SCHEDULE__) {
                                    window.AndroidBridge.syncSchedule(JSON.stringify(window.__STUDY_ROOM_SCHEDULE__));
                                }
                            } catch(e) {}
                        })();
                        """.trimIndent(), null
                    )
                }
            }
            addJavascriptInterface(object {
                @android.webkit.JavascriptInterface
                fun syncSchedule(json: String) {
                    runOnUiThread {
                        val saved = ScheduleRepository.saveScheduleJson(this@MainActivity, json)
                        if (saved) {
                            Toast.makeText(this@MainActivity, "Виджет мгновенно синхронизирован через WebView!", Toast.LENGTH_SHORT).show()
                            refreshData(findViewById(R.id.tv_cache_status))
                        }
                    }
                }
            }, "AndroidBridge")
            loadUrl(cabinetUrl)
        }

        root.addView(topBar)
        root.addView(webView, android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT
        ))

        dialog.setContentView(root)
        dialog.show()
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
