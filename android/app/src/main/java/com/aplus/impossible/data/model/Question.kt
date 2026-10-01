package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName
import java.util.UUID

enum class QuestionType(val typeKey: String, val displayName: String, val shortLabel: String) {
    @SerializedName("single_mcq")
    SINGLE_MCQ("single_mcq", "Single Choice MCQ", "Single MCQ"),

    @SerializedName("multiple_mcq")
    MULTIPLE_MCQ("multiple_mcq", "Multiple Choice MCQ", "Multiple MCQ"),

    @SerializedName("true_false")
    TRUE_FALSE("true_false", "True / False", "True / False"),

    @SerializedName("matching")
    MATCHING("matching", "Matching Pairs", "Matching"),

    @SerializedName("ordering")
    ORDERING("ordering", "Arrange in Sequence", "Ordering"),

    @SerializedName("case_study")
    CASE_STUDY("case_study", "Clinical Case Study", "Case Study");

    companion object {
        fun fromKey(key: String): QuestionType {
            return entries.find { it.typeKey.equals(key, ignoreCase = true) } ?: SINGLE_MCQ
        }
    }
}

data class MatchingPair(
    val id: String = UUID.randomUUID().toString(),
    val left: String = "",
    val right: String = ""
)

data class CaseSubQuestion(
    val id: String = UUID.randomUUID().toString(),
    val question: String = "",
    val options: List<String> = emptyList(),
    val correctAnswer: Int = 0,
    val explanation: String? = null
)

@Entity(
    tableName = "questions",
    indices = [
        Index(value = ["deckId"]),
        Index(value = ["type"])
    ]
)
data class QuestionEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val deckId: String,
    val type: QuestionType = QuestionType.SINGLE_MCQ,
    val question: String = "",
    val options: List<String> = emptyList(),
    val correctAnswers: List<Int> = emptyList(),
    val matchingPairs: List<MatchingPair>? = null,
    val correctOrder: List<Int>? = null,
    val caseVignette: String? = null,
    val subQuestions: List<CaseSubQuestion>? = null,
    val explanation: String? = null,
    val highYieldNotes: String? = null,
    val originalOrderIndex: Int? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
