package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "attempts",
    indices = [
        Index(value = ["profileId"]),
        Index(value = ["questionId"]),
        Index(value = ["timestamp"])
    ]
)
data class UserAttemptEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val profileId: String = "workspace",
    val questionId: String,
    val deckId: String,
    val year: String = "Year 2",
    val module: String = "Blood",
    val subject: String = "Physiology",
    val lectureName: String = "",
    val selectedAnswerJson: String = "",
    val isCorrect: Boolean = false,
    val timeSpentSeconds: Int = 0,
    val timestamp: Long = System.currentTimeMillis()
)

data class QuestionResultItem(
    val questionId: String,
    val deckId: String? = null,
    val isCorrect: Boolean,
    val timeSpentSeconds: Int = 0
)

@Entity(
    tableName = "session_history",
    indices = [
        Index(value = ["profileId"]),
        Index(value = ["completedAt"]),
        Index(value = ["date"])
    ]
)
data class StudySessionRecordEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val profileId: String = "workspace",
    val sessionTitle: String = "",
    val date: String = "", // YYYY-MM-DD
    val startedAt: Long = System.currentTimeMillis(),
    val completedAt: Long = System.currentTimeMillis(),
    val durationSeconds: Int = 0,
    val totalQuestions: Int = 0,
    val questionsAttempted: Int = 0,
    val unansweredCount: Int = 0,
    val correctAnswers: Int = 0,
    val incorrectAnswers: Int = 0,
    val accuracy: Int = 0, // 0 - 100
    val score: Int = 0,
    val deckIds: List<String> = emptyList(),
    val deckTitles: List<String> = emptyList(),
    val modules: List<String> = emptyList(),
    val subjects: List<String> = emptyList(),
    val years: List<String> = emptyList(),
    val questionTypes: List<String> = emptyList(),
    val mode: String = "sequential",
    val collectionType: String? = null,
    val questionResultsJson: String = "[]" // serialized List<QuestionResultItem>
)
