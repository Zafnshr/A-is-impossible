package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.StudySessionStateEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface StudySessionDao {
    @Query("SELECT * FROM sessions WHERE profileId = :profileId LIMIT 1")
    fun getActiveSessionFlow(profileId: String): Flow<StudySessionStateEntity?>

    @Query("SELECT * FROM sessions WHERE profileId = :profileId LIMIT 1")
    suspend fun getActiveSession(profileId: String): StudySessionStateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveActiveSession(session: StudySessionStateEntity)

    @Query("DELETE FROM sessions WHERE profileId = :profileId")
    suspend fun clearActiveSession(profileId: String)

    @Query("DELETE FROM sessions")
    suspend fun deleteAllSessions()
}
