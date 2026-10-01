package com.aplus.impossible.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(tableName = "profiles")
data class UserProfileEntity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val name: String = "Dr. Medical Student",
    val university: String? = "Egyptian Faculty of Medicine",
    val academicYear: String? = "Year 2",
    val year: String? = "Year 2",
    val avatarColor: String = "#06B6D4",
    val createdAt: Long = System.currentTimeMillis(),
    val lastActiveAt: Long = System.currentTimeMillis()
)
