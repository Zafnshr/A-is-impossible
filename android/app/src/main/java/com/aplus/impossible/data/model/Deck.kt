package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "decks",
    indices = [
        Index(value = ["year"]),
        Index(value = ["module"]),
        Index(value = ["subject"])
    ]
)
data class DeckEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val title: String = "",
    val year: String = "Year 2",
    val module: String = "Blood",
    val subject: String = "Physiology",
    val lectureName: String = "",
    val description: String? = null,
    val questionCount: Int = 0,
    val bestScore: Int? = null,
    val averageScore: Int? = null,
    val latestScore: Int? = null,
    val lastOpenedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
