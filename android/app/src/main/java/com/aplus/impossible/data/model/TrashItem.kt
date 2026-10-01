package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "trash",
    indices = [
        Index(value = ["profileId"])
    ]
)
data class TrashItemEntity(
    @PrimaryKey
    val id: String = "trash_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(4)}",
    val profileId: String = "workspace",
    val itemType: String, // "deck" or "question"
    val title: String,
    val dataJson: String, // Serialized Deck or Question
    val deletedAt: Long = System.currentTimeMillis()
)
