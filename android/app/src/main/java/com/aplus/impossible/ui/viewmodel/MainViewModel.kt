package com.aplus.impossible.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aplus.impossible.data.local.APlusDatabase
import com.aplus.impossible.data.model.*
import com.aplus.impossible.data.parser.ImportPreviewResult
import com.aplus.impossible.data.repository.APlusRepository
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.*

enum class AppTab {
    DASHBOARD,
    LIBRARY,
    COLLECTIONS,
    ANALYTICS,
    SETTINGS
}

sealed class AppScreen {
    object Main : AppScreen()
    data class DeckDetail(val deckId: String) : AppScreen()
    data class Study(val sessionTitle: String) : AppScreen()
    data class ImportWizard(val prefillYear: String? = null, val prefillModule: String? = null, val prefillSubject: String? = null) : AppScreen()
    data class QuestionEditor(val deckId: String) : AppScreen()
    object Trash : AppScreen()
    object Backup : AppScreen()
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = APlusRepository(APlusDatabase.getInstance(application))
    private val gson = Gson()

    // Navigation State
    private val _currentTab = MutableStateFlow(AppTab.DASHBOARD)
    val currentTab: StateFlow<AppTab> = _currentTab.asStateFlow()

    private val _currentScreen = MutableStateFlow<AppScreen>(AppScreen.Main)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    // Data Flows from Room
    val decks: StateFlow<List<DeckEntity>> = repository.allDecksFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allStatuses: StateFlow<List<QuestionUserStatusEntity>> = repository.getAllStatusesFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val attempts: StateFlow<List<UserAttemptEntity>> = repository.getAttemptsFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val sessionHistory: StateFlow<List<StudySessionRecordEntity>> = repository.getSessionHistoryFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val activeSession: StateFlow<StudySessionStateEntity?> = repository.getActiveSessionFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val trashItems: StateFlow<List<TrashItemEntity>> = repository.getTrashItemsFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val userProfile: StateFlow<UserProfileEntity?> = repository.getProfileFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val userSettings: StateFlow<UserSettingsEntity?> = repository.getSettingsFlow()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Current Active Study Session Runtime Data
    private val _studyQuestions = MutableStateFlow<List<QuestionEntity>>(emptyList())
    val studyQuestions: StateFlow<List<QuestionEntity>> = _studyQuestions.asStateFlow()

    private val _studyAnswers = MutableStateFlow<MutableMap<String, Any>>(mutableMapOf())
    val studyAnswers: StateFlow<Map<String, Any>> = _studyAnswers.asStateFlow()

    private val _studySubmitted = MutableStateFlow<MutableMap<String, Boolean>>(mutableMapOf())
    val studySubmitted: StateFlow<Map<String, Boolean>> = _studySubmitted.asStateFlow()

    private val _studyRevealed = MutableStateFlow<MutableMap<String, Boolean>>(mutableMapOf())
    val studyRevealed: StateFlow<Map<String, Boolean>> = _studyRevealed.asStateFlow()

    private val _currentQuestionIndex = MutableStateFlow(0)
    val currentQuestionIndex: StateFlow<Int> = _currentQuestionIndex.asStateFlow()

    private val _timerSeconds = MutableStateFlow(0)
    val timerSeconds: StateFlow<Int> = _timerSeconds.asStateFlow()

    private val _timerRunning = MutableStateFlow(true)
    val timerRunning: StateFlow<Boolean> = _timerRunning.asStateFlow()

    private val _sessionSummary = MutableStateFlow<SessionCompletionSummary?>(null)
    val sessionSummary: StateFlow<SessionCompletionSummary?> = _sessionSummary.asStateFlow()

    // Import Wizard State
    private val _importPreview = MutableStateFlow<ImportPreviewResult?>(null)
    val importPreview: StateFlow<ImportPreviewResult?> = _importPreview.asStateFlow()

    private val _isImporting = MutableStateFlow(false)
    val isImporting: StateFlow<Boolean> = _isImporting.asStateFlow()

    fun setTab(tab: AppTab) {
        _currentTab.value = tab
        _currentScreen.value = AppScreen.Main
    }

    fun navigateTo(screen: AppScreen) {
        _currentScreen.value = screen
    }

    fun navigateBack(): Boolean {
        return if (_currentScreen.value != AppScreen.Main) {
            _currentScreen.value = AppScreen.Main
            true
        } else {
            false
        }
    }

    // --- Study Session Actions ---

    fun startStudySession(
        deckIds: List<String>,
        sessionTitle: String,
        mode: String = "single_lecture",
        orderMode: String = "sequential",
        shuffleOptions: ShuffleOptions = ShuffleOptions(),
        timerType: String = "stopwatch",
        countdownMinutes: Int = 30
    ) {
        viewModelScope.launch {
            val questions = repository.generateStudyQuestions(deckIds, orderMode, shuffleOptions)
            if (questions.isEmpty()) return@launch

            _studyQuestions.value = questions
            _currentQuestionIndex.value = 0
            _studyAnswers.value = mutableMapOf()
            _studySubmitted.value = mutableMapOf()
            _studyRevealed.value = mutableMapOf()
            _sessionSummary.value = null

            val initTimer = if (timerType == "countdown") countdownMinutes * 60 else 0
            _timerSeconds.value = initTimer
            _timerRunning.value = true

            val state = StudySessionStateEntity(
                profileId = "workspace",
                sessionId = UUID.randomUUID().toString(),
                deckIds = deckIds,
                sessionTitle = sessionTitle,
                mode = mode,
                orderMode = orderMode,
                shuffleOptions = shuffleOptions,
                questionIds = questions.map { it.id },
                currentIndex = 0,
                timerType = timerType,
                timerSeconds = initTimer,
                countdownInitialSeconds = countdownMinutes * 60,
                timerRunning = true,
                startedAt = System.currentTimeMillis()
            )
            repository.saveActiveSession(state)
            _currentScreen.value = AppScreen.Study(sessionTitle)
        }
    }

    fun resumeActiveSession() {
        val session = activeSession.value ?: return
        viewModelScope.launch {
            val questions = repository.getQuestionsByIds(session.questionIds)
            if (questions.isEmpty()) {
                repository.clearActiveSession()
                return@launch
            }
            // Preserve questionIds order
            val orderedQuestions = session.questionIds.mapNotNull { qId -> questions.find { it.id == qId } }
            _studyQuestions.value = orderedQuestions
            _currentQuestionIndex.value = session.currentIndex.coerceIn(0, orderedQuestions.size - 1)
            _timerSeconds.value = session.timerSeconds
            _timerRunning.value = session.timerRunning

            // Parse saved maps
            try {
                val ansType = object : TypeToken<MutableMap<String, Any>>() {}.type
                val boolType = object : TypeToken<MutableMap<String, Boolean>>() {}.type
                _studyAnswers.value = gson.fromJson(session.userAnswersJson, ansType) ?: mutableMapOf()
                _studySubmitted.value = gson.fromJson(session.submittedQuestionsJson, boolType) ?: mutableMapOf()
                _studyRevealed.value = gson.fromJson(session.revealedQuestionsJson, boolType) ?: mutableMapOf()
            } catch (_: Exception) {}

            _currentScreen.value = AppScreen.Study(session.sessionTitle)
        }
    }

    fun submitAnswer(questionId: String, answer: Any) {
        val currentQ = _studyQuestions.value.getOrNull(_currentQuestionIndex.value) ?: return
        val isCorrect = evaluateCorrectness(currentQ, answer)

        val updatedAns = _studyAnswers.value.toMutableMap()
        updatedAns[questionId] = answer
        _studyAnswers.value = updatedAns

        val updatedSub = _studySubmitted.value.toMutableMap()
        updatedSub[questionId] = true
        _studySubmitted.value = updatedSub

        // Record attempt
        viewModelScope.launch {
            val deck = repository.getDeck(currentQ.deckId)
            val attempt = UserAttemptEntity(
                questionId = questionId,
                deckId = currentQ.deckId,
                year = deck?.year ?: "Year 2",
                module = deck?.module ?: "Blood",
                subject = deck?.subject ?: "Physiology",
                lectureName = deck?.lectureName ?: "Lecture",
                selectedAnswerJson = gson.toJson(answer),
                isCorrect = isCorrect,
                timeSpentSeconds = 30
            )
            repository.recordAttempt(attempt)
            saveCurrentSessionState()
        }
    }

    fun revealAnswer(questionId: String) {
        val updated = _studyRevealed.value.toMutableMap()
        updated[questionId] = true
        _studyRevealed.value = updated
        saveCurrentSessionState()
    }

    fun resetQuestion(questionId: String) {
        val updatedAns = _studyAnswers.value.toMutableMap()
        updatedAns.remove(questionId)
        _studyAnswers.value = updatedAns

        val updatedSub = _studySubmitted.value.toMutableMap()
        updatedSub.remove(questionId)
        _studySubmitted.value = updatedSub

        val updatedRev = _studyRevealed.value.toMutableMap()
        updatedRev.remove(questionId)
        _studyRevealed.value = updatedRev

        saveCurrentSessionState()
    }

    fun nextQuestion() {
        if (_currentQuestionIndex.value < _studyQuestions.value.size - 1) {
            _currentQuestionIndex.value += 1
            saveCurrentSessionState()
        }
    }

    fun previousQuestion() {
        if (_currentQuestionIndex.value > 0) {
            _currentQuestionIndex.value -= 1
            saveCurrentSessionState()
        }
    }

    fun jumpToQuestion(index: Int) {
        if (index in _studyQuestions.value.indices) {
            _currentQuestionIndex.value = index
            saveCurrentSessionState()
        }
    }

    fun toggleTimerRunning() {
        _timerRunning.value = !_timerRunning.value
        saveCurrentSessionState()
    }

    fun tickTimer(delta: Int = 1) {
        val session = activeSession.value
        if (session?.timerType == "countdown") {
            _timerSeconds.value = (_timerSeconds.value - delta).coerceAtLeast(0)
        } else {
            _timerSeconds.value += delta
        }
    }

    fun toggleFavorite(questionId: String) {
        viewModelScope.launch {
            repository.toggleFavorite(questionId)
        }
    }

    fun toggleFlagged(questionId: String) {
        viewModelScope.launch {
            repository.toggleFlagged(questionId)
        }
    }

    fun saveUserNote(questionId: String, note: String) {
        viewModelScope.launch {
            repository.saveUserNote(questionId, note)
        }
    }

    fun finishSession() {
        val questions = _studyQuestions.value
        val submitted = _studySubmitted.value
        val answers = _studyAnswers.value

        var correctCount = 0
        var incorrectCount = 0
        val incorrectIds = mutableListOf<String>()

        for (q in questions) {
            if (submitted[q.id] == true) {
                val ans = answers[q.id]
                val isCorrect = evaluateCorrectness(q, ans)
                if (isCorrect) correctCount++
                else {
                    incorrectCount++
                    incorrectIds.add(q.id)
                }
            } else {
                incorrectIds.add(q.id)
            }
        }

        val total = questions.size
        val scorePct = if (total > 0) (correctCount * 100) / total else 0
        val solvedCount = submitted.size
        val unansweredCount = total - solvedCount
        val duration = _timerSeconds.value

        val active = activeSession.value
        val summary = SessionCompletionSummary(
            sessionId = active?.sessionId ?: UUID.randomUUID().toString(),
            deckTitle = active?.sessionTitle ?: "Study Session",
            totalQuestions = total,
            solvedCount = solvedCount,
            unansweredCount = unansweredCount,
            correctCount = correctCount,
            incorrectCount = incorrectCount,
            scorePercentage = scorePct,
            timeSpentSeconds = duration,
            questionIds = questions.map { it.id },
            incorrectQuestionIds = incorrectIds
        )
        _sessionSummary.value = summary

        // Save permanent session history
        viewModelScope.launch {
            val cal = Calendar.getInstance()
            val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val dateStr = dateFormat.format(cal.time)

            val record = StudySessionRecordEntity(
                id = summary.sessionId,
                profileId = "workspace",
                sessionTitle = summary.deckTitle,
                date = dateStr,
                startedAt = active?.startedAt ?: System.currentTimeMillis(),
                completedAt = System.currentTimeMillis(),
                durationSeconds = duration,
                totalQuestions = total,
                questionsAttempted = solvedCount,
                unansweredCount = unansweredCount,
                correctAnswers = correctCount,
                incorrectAnswers = incorrectCount,
                accuracy = if (solvedCount > 0) (correctCount * 100) / solvedCount else 0,
                score = scorePct,
                deckIds = active?.deckIds ?: emptyList(),
                deckTitles = listOf(summary.deckTitle),
                modules = listOf("Blood"),
                subjects = listOf("Physiology"),
                years = listOf("Year 2")
            )
            repository.saveSessionRecord(record)

            // Update deck stats
            active?.deckIds?.firstOrNull()?.let { dId ->
                repository.updateDeckStats(dId, scorePct)
            }

            repository.clearActiveSession()
        }
    }

    fun exitStudySession(saveProgress: Boolean) {
        viewModelScope.launch {
            if (!saveProgress) {
                repository.clearActiveSession()
            }
            _currentScreen.value = AppScreen.Main
        }
    }

    private fun saveCurrentSessionState() {
        val active = activeSession.value ?: return
        viewModelScope.launch {
            val updated = active.copy(
                currentIndex = _currentQuestionIndex.value,
                userAnswersJson = gson.toJson(_studyAnswers.value),
                submittedQuestionsJson = gson.toJson(_studySubmitted.value),
                revealedQuestionsJson = gson.toJson(_studyRevealed.value),
                timerSeconds = _timerSeconds.value,
                timerRunning = _timerRunning.value,
                lastSavedAt = System.currentTimeMillis()
            )
            repository.saveActiveSession(updated)
        }
    }

    fun evaluateCorrectness(question: QuestionEntity, answer: Any?): Boolean {
        if (answer == null) return false
        return when (question.type) {
            QuestionType.SINGLE_MCQ, QuestionType.TRUE_FALSE -> {
                val ansInt = when (answer) {
                    is Number -> answer.toInt()
                    is String -> answer.toIntOrNull()
                    else -> null
                }
                ansInt != null && question.correctAnswers.contains(ansInt)
            }
            QuestionType.MULTIPLE_MCQ -> {
                val ansList: List<Int>? = when (answer) {
                    is List<*> -> answer.mapNotNull { (it as? Number)?.toInt() ?: (it as? String)?.toIntOrNull() }
                    else -> null
                }
                ansList != null && ansList.sorted() == question.correctAnswers.sorted()
            }
            QuestionType.MATCHING -> {
                val pairs = question.matchingPairs ?: return false
                val ansMap = answer as? Map<*, *> ?: return false
                pairs.all { pair -> ansMap[pair.id] == pair.right }
            }
            QuestionType.ORDERING -> {
                val expected = question.correctOrder ?: question.options.indices.toList()
                val ansList = answer as? List<*> ?: return false
                val clean = ansList.mapNotNull { (it as? Number)?.toInt() }
                clean == expected
            }
            QuestionType.CASE_STUDY -> {
                val subs = question.subQuestions ?: return false
                val ansMap = answer as? Map<*, *> ?: return false
                subs.all { sub ->
                    val chosen = (ansMap[sub.id] as? Number)?.toInt()
                    chosen == sub.correctAnswer
                }
            }
        }
    }

    // --- Import Wizard Actions ---

    fun parseDocxFile(
        inputStream: InputStream,
        year: String,
        module: String,
        subject: String,
        lectureName: String
    ) {
        viewModelScope.launch {
            _isImporting.value = true
            try {
                val result = repository.parseDocx(inputStream, year, module, subject, lectureName)
                _importPreview.value = result
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isImporting.value = false
            }
        }
    }

    fun parsePlainTextContent(
        text: String,
        year: String,
        module: String,
        subject: String,
        lectureName: String
    ) {
        viewModelScope.launch {
            _isImporting.value = true
            try {
                val result = repository.parsePlainText(text, year, module, subject, lectureName)
                _importPreview.value = result
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isImporting.value = false
            }
        }
    }

    fun confirmImport() {
        val preview = _importPreview.value ?: return
        viewModelScope.launch {
            _isImporting.value = true
            val deckId = UUID.randomUUID().toString()
            val deck = DeckEntity(
                id = deckId,
                title = preview.lectureName,
                year = preview.year,
                module = preview.module,
                subject = preview.subject,
                lectureName = preview.lectureName,
                questionCount = preview.questions.size
            )
            val questions = preview.questions.map { it.copy(deckId = deckId) }
            repository.finalizeImport(deck, questions)
            _importPreview.value = null
            _isImporting.value = false
            _currentScreen.value = AppScreen.DeckDetail(deckId)
        }
    }

    fun cancelImport() {
        _importPreview.value = null
    }

    // --- Deck & Question Management ---

    fun deleteDeck(deckId: String) {
        viewModelScope.launch {
            repository.deleteDeck(deckId)
            _currentScreen.value = AppScreen.Main
        }
    }

    fun deleteQuestion(questionId: String) {
        viewModelScope.launch {
            repository.deleteQuestion(questionId)
        }
    }

    suspend fun getQuestionsByIds(questionIds: List<String>): List<QuestionEntity> =
        repository.getQuestionsByIds(questionIds)

    suspend fun getQuestionsByDeck(deckId: String): List<QuestionEntity> =
        repository.getQuestionsByDeck(deckId)

    fun saveQuestion(question: QuestionEntity) {
        viewModelScope.launch {
            repository.saveQuestion(question)
        }
    }

    fun restoreTrashItem(item: TrashItemEntity) {
        viewModelScope.launch {
            repository.restoreTrashItem(item)
        }
    }

    fun permanentlyDeleteTrash(id: String) {
        viewModelScope.launch {
            repository.permanentlyDeleteTrash(id)
        }
    }

    fun clearTrash() {
        viewModelScope.launch {
            repository.clearTrash()
        }
    }

    // --- Settings & Profiles ---

    fun updateSettings(settings: UserSettingsEntity) {
        viewModelScope.launch {
            repository.saveSettings(settings)
        }
    }

    fun updateProfile(profile: UserProfileEntity) {
        viewModelScope.launch {
            repository.saveProfile(profile)
        }
    }

    // --- Backup & Restore ---

    suspend fun exportBackupJson(): String = repository.exportBackupJson()

    suspend fun importBackupJson(json: String, mode: String = "merge"): Boolean =
        repository.importBackupJson(json, mode)

    // --- Danger Zone ---

    fun resetStudyProgress() {
        viewModelScope.launch {
            repository.resetStudyProgress()
        }
    }

    fun deleteAllDecks() {
        viewModelScope.launch {
            repository.deleteAllDecks()
        }
    }

    fun factoryReset() {
        viewModelScope.launch {
            repository.factoryResetPlatform()
        }
    }
}
