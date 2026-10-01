package com.aplus.impossible.data.parser

import com.aplus.impossible.data.local.APlusDatabase
import com.aplus.impossible.data.model.*
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import com.google.gson.reflect.TypeToken

data class BackupEnvelope(
    val version: Int = 2,
    val exportedAt: Long = System.currentTimeMillis(),
    val platform: String = "A+ is Impossible",
    val data: BackupData
)

data class BackupData(
    val profiles: List<UserProfileEntity> = emptyList(),
    val settings: List<UserSettingsEntity> = emptyList(),
    val decks: List<DeckEntity> = emptyList(),
    val questions: List<QuestionEntity> = emptyList(),
    val question_status: List<QuestionUserStatusEntity> = emptyList(),
    val attempts: List<UserAttemptEntity> = emptyList(),
    val sessions: List<StudySessionStateEntity> = emptyList(),
    val session_history: List<StudySessionRecordEntity> = emptyList(),
    val trash: List<TrashItemEntity> = emptyList()
)

class BackupManager(private val database: APlusDatabase) {

    private val gson: Gson = GsonBuilder().setPrettyPrinting().create()

    suspend fun exportDatabaseToJson(): String {
        val profiles = database.userProfileDao().getAllProfiles()
        val settings = database.userSettingsDao().getAllSettings()
        val decks = database.deckDao().getAllDecks()
        val questions = database.questionDao().getAllQuestions()
        val statuses = database.questionStatusDao().getAllStatuses("workspace")
        val attempts = database.attemptDao().getAttempts("workspace")
        val session = database.studySessionDao().getActiveSession("workspace")
        val history = database.sessionHistoryDao().getSessionHistory("workspace")
        val trash = database.trashDao().getTrashItems("workspace")

        val backupData = BackupData(
            profiles = profiles,
            settings = settings,
            decks = decks,
            questions = questions,
            question_status = statuses,
            attempts = attempts,
            sessions = if (session != null) listOf(session) else emptyList(),
            session_history = history,
            trash = trash
        )

        val envelope = BackupEnvelope(data = backupData)
        return gson.toJson(envelope)
    }

    suspend fun importDatabaseFromJson(jsonString: String, mode: String = "merge"): Boolean {
        return try {
            val root = gson.fromJson(jsonString, JsonObject::class.java)
            val dataObj = if (root.has("data")) root.getAsJsonObject("data") else root

            val data = gson.fromJson(dataObj, BackupData::class.java)

            if (mode == "overwrite") {
                database.deckDao().deleteAllDecks()
                database.questionDao().deleteAllQuestions()
                database.questionStatusDao().deleteAllStatuses()
                database.attemptDao().deleteAllAttempts()
                database.studySessionDao().deleteAllSessions()
                database.sessionHistoryDao().deleteAllHistory()
                database.trashDao().deleteAllTrash()
            }

            if (data.profiles.isNotEmpty()) {
                database.userProfileDao().insertProfiles(data.profiles)
            }
            if (data.settings.isNotEmpty()) {
                database.userSettingsDao().insertSettings(data.settings)
            }
            if (data.decks.isNotEmpty()) {
                database.deckDao().insertDecks(data.decks)
            }
            if (data.questions.isNotEmpty()) {
                database.questionDao().insertQuestions(data.questions)
            }
            if (data.question_status.isNotEmpty()) {
                database.questionStatusDao().saveStatuses(data.question_status)
            }
            if (data.attempts.isNotEmpty()) {
                database.attemptDao().insertAttempts(data.attempts)
            }
            if (data.sessions.isNotEmpty()) {
                val s = data.sessions.firstOrNull()
                if (s != null) database.studySessionDao().saveActiveSession(s)
            }
            if (data.session_history.isNotEmpty()) {
                database.sessionHistoryDao().insertRecords(data.session_history)
            }
            if (data.trash.isNotEmpty()) {
                database.trashDao().insertTrashItems(data.trash)
            }

            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
