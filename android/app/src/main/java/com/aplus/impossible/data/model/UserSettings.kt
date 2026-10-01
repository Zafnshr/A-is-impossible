package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "settings")
data class UserSettingsEntity(
    @PrimaryKey
    val profileId: String = "workspace",
    val theme: String = "dark", // "dark", "light", "system"
    val fontSize: String = "normal", // "normal", "large", "xlarge"
    val questionFontSize: String = "normal", // "normal", "relaxed", "large"
    val animation: String = "smooth", // "smooth", "reduced"
    val highContrast: Boolean = false,
    val soundEnabled: Boolean = true,
    val hapticEnabled: Boolean = true,
    val autoRevealOnSubmit: Boolean = false,
    val showTimer: Boolean = true,
    val defaultTimerMode: String = "stopwatch", // "stopwatch", "countdown"
    val countdownDurationMinutes: Int = 30,
    val shuffleQuestions: Boolean = false,
    val shuffleAnswers: Boolean = false
)
