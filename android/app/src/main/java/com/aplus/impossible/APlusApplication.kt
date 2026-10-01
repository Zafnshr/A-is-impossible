package com.aplus.impossible

import android.app.Application
import com.aplus.impossible.data.local.APlusDatabase
import com.aplus.impossible.data.model.UserProfileEntity
import com.aplus.impossible.data.model.UserSettingsEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class APlusApplication : Application() {

    val database: APlusDatabase by lazy {
        APlusDatabase.getInstance(this)
    }

    override fun onCreate() {
        super.onCreate()

        // Seed default profile & settings if first launch
        CoroutineScope(Dispatchers.IO).launch {
            val profile = database.userProfileDao().getProfileById("workspace")
            if (profile == null) {
                database.userProfileDao().insertProfile(UserProfileEntity(id = "workspace"))
            }
            val settings = database.userSettingsDao().getSettings("workspace")
            if (settings == null) {
                database.userSettingsDao().saveSettings(UserSettingsEntity(profileId = "workspace"))
            }
        }
    }
}
