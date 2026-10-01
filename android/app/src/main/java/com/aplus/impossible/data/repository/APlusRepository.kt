package com.aplus.impossible.data.repository

import com.aplus.impossible.data.local.APlusDatabase
import com.aplus.impossible.data.model.*
import com.aplus.impossible.data.parser.BackupManager
import com.aplus.impossible.data.parser.DocxTextExtractor
import com.aplus.impossible.data.parser.ImportPreviewResult
import com.aplus.impossible.data.parser.QuestionParserEngine
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.*

class APlusRepository(private val database: APlusDatabase) {

    private val backupManager = BackupManager(database)
    private val gson = Gson()

    // --- Decks ---
    val allDecksFlow: Flow<List<DeckEntity>> = database.deckDao().getAllDecksFlow()

    suspend fun getDeck(deckId: String): DeckEntity? = database.deckDao().getDeckById(deckId)
    fun getDeckFlow(deckId: String): Flow<DeckEntity?> = database.deckDao().getDeckByIdFlow(deckId)

    suspend fun saveDeck(deck: DeckEntity) = database.deckDao().insertDeck(deck)

    suspend fun deleteDeck(deckId: String, profileId: String = "workspace") = withContext(Dispatchers.IO) {
        val deck = database.deckDao().getDeckById(deckId)
        if (deck != null) {
            val questions = database.questionDao().getQuestionsByDeck(deckId)
            val trashData = mapOf("deck" to deck, "questions" to questions)
            val trashItem = TrashItemEntity(
                profileId = profileId,
                itemType = "deck",
                title = deck.lectureName.ifEmpty { deck.title },
                dataJson = gson.toJson(trashData)
            )
            database.trashDao().insertTrashItem(trashItem)
            database.questionDao().deleteQuestionsByDeck(deckId)
            database.deckDao().deleteDeckById(deckId)
        }
    }

    suspend fun updateDeckStats(deckId: String, latestScore: Int) = withContext(Dispatchers.IO) {
        val deck = database.deckDao().getDeckById(deckId) ?: return@withContext
        val newBest = if (deck.bestScore == null || latestScore > deck.bestScore) latestScore else deck.bestScore
        val newAvg = if (deck.averageScore == null) latestScore else (deck.averageScore + latestScore) / 2
        val updated = deck.copy(
            latestScore = latestScore,
            bestScore = newBest,
            averageScore = newAvg,
            lastOpenedAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        database.deckDao().updateDeck(updated)
    }

    // --- Questions ---
    fun getQuestionsByDeckFlow(deckId: String): Flow<List<QuestionEntity>> =
        database.questionDao().getQuestionsByDeckFlow(deckId)

    suspend fun getQuestionsByDeck(deckId: String): List<QuestionEntity> =
        database.questionDao().getQuestionsByDeck(deckId)

    suspend fun getQuestion(questionId: String): QuestionEntity? =
        database.questionDao().getQuestionById(questionId)

    suspend fun getQuestionsByIds(questionIds: List<String>): List<QuestionEntity> =
        database.questionDao().getQuestionsByIds(questionIds)

    suspend fun saveQuestion(question: QuestionEntity) = withContext(Dispatchers.IO) {
        database.questionDao().insertQuestion(question)
        val count = database.questionDao().getQuestionCountForDeck(question.deckId)
        val deck = database.deckDao().getDeckById(question.deckId)
        if (deck != null) {
            database.deckDao().updateDeck(deck.copy(questionCount = count, updatedAt = System.currentTimeMillis()))
        }
    }

    suspend fun saveQuestions(questions: List<QuestionEntity>) = withContext(Dispatchers.IO) {
        if (questions.isEmpty()) return@withContext
        database.questionDao().insertQuestions(questions)
        val deckId = questions.first().deckId
        val count = database.questionDao().getQuestionCountForDeck(deckId)
        val deck = database.deckDao().getDeckById(deckId)
        if (deck != null) {
            database.deckDao().updateDeck(deck.copy(questionCount = count, updatedAt = System.currentTimeMillis()))
        }
    }

    suspend fun deleteQuestion(questionId: String, profileId: String = "workspace") = withContext(Dispatchers.IO) {
        val q = database.questionDao().getQuestionById(questionId) ?: return@withContext
        val trashItem = TrashItemEntity(
            profileId = profileId,
            itemType = "question",
            title = q.question.take(60),
            dataJson = gson.toJson(q)
        )
        database.trashDao().insertTrashItem(trashItem)
        database.questionDao().deleteQuestionById(questionId)
        val count = database.questionDao().getQuestionCountForDeck(q.deckId)
        val deck = database.deckDao().getDeckById(q.deckId)
        if (deck != null) {
            database.deckDao().updateDeck(deck.copy(questionCount = count, updatedAt = System.currentTimeMillis()))
        }
    }

    // --- Statuses (Favorites, Flagged, Incorrect, Notes) ---
    fun getAllStatusesFlow(profileId: String = "workspace"): Flow<List<QuestionUserStatusEntity>> =
        database.questionStatusDao().getAllStatusesFlow(profileId)

    suspend fun getQuestionStatus(questionId: String, profileId: String = "workspace"): QuestionUserStatusEntity {
        return database.questionStatusDao().getStatus(profileId, questionId)
            ?: QuestionUserStatusEntity(profileId = profileId, questionId = questionId)
    }

    suspend fun saveQuestionStatus(status: QuestionUserStatusEntity) =
        database.questionStatusDao().saveStatus(status)

    suspend fun toggleFavorite(questionId: String, profileId: String = "workspace"): Boolean = withContext(Dispatchers.IO) {
        val current = getQuestionStatus(questionId, profileId)
        val updated = current.copy(isFavorite = !current.isFavorite)
        database.questionStatusDao().saveStatus(updated)
        updated.isFavorite
    }

    suspend fun toggleFlagged(questionId: String, profileId: String = "workspace"): Boolean = withContext(Dispatchers.IO) {
        val current = getQuestionStatus(questionId, profileId)
        val updated = current.copy(isFlagged = !current.isFlagged)
        database.questionStatusDao().saveStatus(updated)
        updated.isFlagged
    }

    suspend fun saveUserNote(questionId: String, note: String, profileId: String = "workspace") = withContext(Dispatchers.IO) {
        val current = getQuestionStatus(questionId, profileId)
        database.questionStatusDao().saveStatus(current.copy(userNote = note))
    }

    // --- Attempts & Analytics ---
    fun getAttemptsFlow(profileId: String = "workspace"): Flow<List<UserAttemptEntity>> =
        database.attemptDao().getAttemptsFlow(profileId)

    suspend fun recordAttempt(attempt: UserAttemptEntity) = withContext(Dispatchers.IO) {
        database.attemptDao().insertAttempt(attempt)
        // Also update question status
        val currentStatus = getQuestionStatus(attempt.questionId, attempt.profileId)
        val updatedStatus = currentStatus.copy(
            isIncorrect = !attempt.isCorrect,
            attemptsCount = currentStatus.attemptsCount + 1,
            lastAttemptAt = attempt.timestamp,
            lastAttemptCorrect = attempt.isCorrect
        )
        database.questionStatusDao().saveStatus(updatedStatus)
    }

    // --- Active Study Session ---
    fun getActiveSessionFlow(profileId: String = "workspace"): Flow<StudySessionStateEntity?> =
        database.studySessionDao().getActiveSessionFlow(profileId)

    suspend fun getActiveSession(profileId: String = "workspace"): StudySessionStateEntity? =
        database.studySessionDao().getActiveSession(profileId)

    suspend fun saveActiveSession(session: StudySessionStateEntity) =
        database.studySessionDao().saveActiveSession(session)

    suspend fun clearActiveSession(profileId: String = "workspace") =
        database.studySessionDao().clearActiveSession(profileId)

    // --- Session History ---
    fun getSessionHistoryFlow(profileId: String = "workspace"): Flow<List<StudySessionRecordEntity>> =
        database.sessionHistoryDao().getSessionHistoryFlow(profileId)

    suspend fun saveSessionRecord(record: StudySessionRecordEntity) =
        database.sessionHistoryDao().insertRecord(record)

    suspend fun clearSessionHistory(profileId: String = "workspace") =
        database.sessionHistoryDao().clearHistoryForProfile(profileId)

    // --- Session Generator ---
    suspend fun generateStudyQuestions(
        deckIds: List<String>,
        orderMode: String = "sequential", // sequential, shuffled, custom
        shuffleOptions: ShuffleOptions = ShuffleOptions()
    ): List<QuestionEntity> = withContext(Dispatchers.IO) {
        val questionsList = mutableListOf<QuestionEntity>()

        for (deckId in deckIds) {
            val deckQuestions = database.questionDao().getQuestionsByDeck(deckId)
            val sorted = deckQuestions.sortedBy { it.originalOrderIndex ?: Int.MAX_VALUE }
            questionsList.addAll(sorted)
        }

        when (orderMode) {
            "shuffled" -> {
                val shuffled = questionsList.shuffled()
                if (shuffleOptions.shuffleAnswers) {
                    shuffled.map { shuffleAnswers(it) }
                } else {
                    shuffled
                }
            }
            "custom" -> {
                var processed = if (shuffleOptions.shuffleQuestions) questionsList.shuffled() else questionsList
                if (shuffleOptions.shuffleAnswers) {
                    processed = processed.map { shuffleAnswers(it) }
                }
                processed
            }
            else -> questionsList // Strict sequential preservation
        }
    }

    private fun shuffleAnswers(q: QuestionEntity): QuestionEntity {
        if (q.type != QuestionType.SINGLE_MCQ && q.type != QuestionType.MULTIPLE_MCQ) return q
        val indexed = q.options.mapIndexed { i, opt -> Pair(i, opt) }.shuffled()
        val newCorrect = q.correctAnswers.mapNotNull { oldIdx ->
            val newIdx = indexed.indexOfFirst { it.first == oldIdx }
            if (newIdx != -1) newIdx else null
        }
        return q.copy(
            options = indexed.map { it.second },
            correctAnswers = newCorrect
        )
    }

    // --- Trash Bin ---
    fun getTrashItemsFlow(profileId: String = "workspace"): Flow<List<TrashItemEntity>> =
        database.trashDao().getTrashItemsFlow(profileId)

    suspend fun restoreTrashItem(item: TrashItemEntity) = withContext(Dispatchers.IO) {
        if (item.itemType == "deck") {
            try {
                val type = object : com.google.gson.reflect.TypeToken<Map<String, Any>>() {}.type
                val map: Map<String, Any> = gson.fromJson(item.dataJson, type)
                val deckJson = gson.toJson(map["deck"])
                val deck = gson.fromJson(deckJson, DeckEntity::class.java)
                database.deckDao().insertDeck(deck)

                val questionsJson = gson.toJson(map["questions"])
                val qType = object : com.google.gson.reflect.TypeToken<List<QuestionEntity>>() {}.type
                val questions: List<QuestionEntity> = gson.fromJson(questionsJson, qType)
                database.questionDao().insertQuestions(questions)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } else if (item.itemType == "question") {
            try {
                val question = gson.fromJson(item.dataJson, QuestionEntity::class.java)
                database.questionDao().insertQuestion(question)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        database.trashDao().deleteTrashItem(item.id)
    }

    suspend fun permanentlyDeleteTrash(id: String) = database.trashDao().deleteTrashItem(id)
    suspend fun clearTrash(profileId: String = "workspace") = database.trashDao().clearTrashForProfile(profileId)

    // --- User Profile & Settings ---
    fun getProfileFlow(id: String = "workspace"): Flow<UserProfileEntity?> =
        database.userProfileDao().getProfileByIdFlow(id)

    suspend fun getProfile(id: String = "workspace"): UserProfileEntity = withContext(Dispatchers.IO) {
        database.userProfileDao().getProfileById(id) ?: UserProfileEntity(id = id).also {
            database.userProfileDao().insertProfile(it)
        }
    }

    suspend fun saveProfile(profile: UserProfileEntity) = database.userProfileDao().insertProfile(profile)

    fun getSettingsFlow(profileId: String = "workspace"): Flow<UserSettingsEntity?> =
        database.userSettingsDao().getSettingsFlow(profileId)

    suspend fun getSettings(profileId: String = "workspace"): UserSettingsEntity = withContext(Dispatchers.IO) {
        database.userSettingsDao().getSettings(profileId) ?: UserSettingsEntity(profileId = profileId).also {
            database.userSettingsDao().saveSettings(it)
        }
    }

    suspend fun saveSettings(settings: UserSettingsEntity) = database.userSettingsDao().saveSettings(settings)

    // --- Import & Document Parsing ---
    suspend fun parseDocx(
        inputStream: InputStream,
        year: String,
        module: String,
        subject: String,
        lectureName: String
    ): ImportPreviewResult = withContext(Dispatchers.IO) {
        val rawText = DocxTextExtractor.extractText(inputStream)
        QuestionParserEngine.parseRawText(rawText, year = year, module = module, subject = subject, lectureName = lectureName)
    }

    suspend fun parsePlainText(
        text: String,
        year: String,
        module: String,
        subject: String,
        lectureName: String
    ): ImportPreviewResult = withContext(Dispatchers.Default) {
        QuestionParserEngine.parseRawText(text, year = year, module = module, subject = subject, lectureName = lectureName)
    }

    suspend fun finalizeImport(
        deck: DeckEntity,
        questions: List<QuestionEntity>
    ) = withContext(Dispatchers.IO) {
        val deckToSave = deck.copy(
            questionCount = questions.size,
            updatedAt = System.currentTimeMillis()
        )
        database.deckDao().insertDeck(deckToSave)
        database.questionDao().insertQuestions(questions.map { it.copy(deckId = deckToSave.id) })
    }

    // --- Backup & Restore ---
    suspend fun exportBackupJson(): String = withContext(Dispatchers.IO) {
        backupManager.exportDatabaseToJson()
    }

    suspend fun importBackupJson(jsonString: String, mode: String = "merge"): Boolean = withContext(Dispatchers.IO) {
        backupManager.importDatabaseFromJson(jsonString, mode)
    }

    // --- Danger Zone Operations ---
    suspend fun resetStudyProgress(profileId: String = "workspace") = withContext(Dispatchers.IO) {
        database.attemptDao().clearAttemptsForProfile(profileId)
        database.studySessionDao().clearActiveSession(profileId)
        database.sessionHistoryDao().clearHistoryForProfile(profileId)

        val decks = database.deckDao().getAllDecks()
        for (d in decks) {
            database.deckDao().updateDeck(d.copy(bestScore = null, averageScore = null, latestScore = null, lastOpenedAt = null))
        }

        val statuses = database.questionStatusDao().getAllStatuses(profileId)
        for (s in statuses) {
            database.questionStatusDao().saveStatus(s.copy(isIncorrect = false, attemptsCount = 0, lastAttemptAt = null, lastAttemptCorrect = null))
        }
    }

    suspend fun deleteAllDecks() = withContext(Dispatchers.IO) {
        database.deckDao().deleteAllDecks()
        database.questionDao().deleteAllQuestions()
        database.studySessionDao().deleteAllSessions()
        database.attemptDao().deleteAllAttempts()
        database.questionStatusDao().deleteAllStatuses()
        database.sessionHistoryDao().deleteAllHistory()
        database.trashDao().deleteAllTrash()
    }

    suspend fun factoryResetPlatform() = withContext(Dispatchers.IO) {
        deleteAllDecks()
        database.userProfileDao().deleteAllProfiles()
        database.userSettingsDao().deleteAllSettings()
        // Re-initialize default profile and settings
        database.userProfileDao().insertProfile(UserProfileEntity(id = "workspace"))
        database.userSettingsDao().saveSettings(UserSettingsEntity(profileId = "workspace"))
    }
}
