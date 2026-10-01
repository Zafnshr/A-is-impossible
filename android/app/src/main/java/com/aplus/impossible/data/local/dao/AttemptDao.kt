package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.UserAttemptEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AttemptDao {
    @Query("SELECT * FROM attempts WHERE profileId = :profileId ORDER BY timestamp ASC")
    fun getAttemptsFlow(profileId: String): Flow<List<UserAttemptEntity>>

    @Query("SELECT * FROM attempts WHERE profileId = :profileId ORDER BY timestamp ASC")
    suspend fun getAttempts(profileId: String): List<UserAttemptEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttempt(attempt: UserAttemptEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttempts(attempts: List<UserAttemptEntity>)

    @Query("DELETE FROM attempts WHERE profileId = :profileId")
    suspend fun clearAttemptsForProfile(profileId: String)

    @Query("DELETE FROM attempts")
    suspend fun deleteAllAttempts()
}
