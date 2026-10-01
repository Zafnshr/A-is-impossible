package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.Index

@Entity(
    tableName = "question_status",
    primaryKeys = ["profileId", "questionId"],
    indices = [
        Index(value = ["profileId"]),
        Index(value = ["profileId", "isFavorite"]),
        Index(value = ["profileId", "isFlagged"]),
        Index(value = ["profileId", "isIncorrect"])
    ]
)
data class QuestionUserStatusEntity(
    val profileId: String = "workspace",
    val questionId: String,
    val isFavorite: Boolean = false,
    val isFlagged: Boolean = false,
    val isIncorrect: Boolean = false,
    val userNote: String = "",
    val attemptsCount: Int = 0,
    val lastAttemptAt: Long? = null,
    val lastAttemptCorrect: Boolean? = null
)
