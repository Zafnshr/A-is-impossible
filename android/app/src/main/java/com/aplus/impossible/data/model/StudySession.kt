package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

data class ShuffleOptions(
    val shuffleQuestions: Boolean = false,
    val shuffleAnswers: Boolean = false,
    val shuffleLectures: Boolean = false
)

@Entity(tableName = "sessions")
data class StudySessionStateEntity(
    @PrimaryKey
    val profileId: String = "workspace",
    val sessionId: String = UUID.randomUUID().toString(),
    val deckIds: List<String> = emptyList(),
    val sessionTitle: String = "",
    val mode: String = "single_lecture", // single_lecture, multiple_lectures, entire_subject, collection
    val orderMode: String = "sequential", // sequential, shuffled, custom
    val shuffleOptions: ShuffleOptions = ShuffleOptions(),
    val questionIds: List<String> = emptyList(),
    val currentIndex: Int = 0,
    val userAnswersJson: String = "{}", // serialized Map<String, Any>
    val submittedQuestionsJson: String = "{}", // serialized Map<String, Boolean>
    val revealedQuestionsJson: String = "{}", // serialized Map<String, Boolean>
    val timerType: String = "stopwatch", // stopwatch, countdown
    val timerSeconds: Int = 0,
    val countdownInitialSeconds: Int = 1800,
    val timerRunning: Boolean = true,
    val lastSavedAt: Long = System.currentTimeMillis(),
    val collectionFilter: String? = null,
    val startedAt: Long = System.currentTimeMillis(),
    val isCompleted: Boolean = false
)

data class SessionCompletionSummary(
    val sessionId: String,
    val deckTitle: String,
    val totalQuestions: Int,
    val solvedCount: Int,
    val unansweredCount: Int,
    val correctCount: Int,
    val incorrectCount: Int,
    val scorePercentage: Int,
    val timeSpentSeconds: Int,
    val completedAt: Long = System.currentTimeMillis(),
    val questionIds: List<String> = emptyList(),
    val incorrectQuestionIds: List<String> = emptyList()
)
