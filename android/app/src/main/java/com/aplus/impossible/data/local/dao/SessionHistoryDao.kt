package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.StudySessionRecordEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionHistoryDao {
    @Query("SELECT * FROM session_history WHERE profileId = :profileId ORDER BY completedAt DESC")
    fun getSessionHistoryFlow(profileId: String): Flow<List<StudySessionRecordEntity>>

    @Query("SELECT * FROM session_history WHERE profileId = :profileId ORDER BY completedAt DESC")
    suspend fun getSessionHistory(profileId: String): List<StudySessionRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecord(record: StudySessionRecordEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecords(records: List<StudySessionRecordEntity>)

    @Query("DELETE FROM session_history WHERE id = :id")
    suspend fun deleteRecordById(id: String)

    @Query("DELETE FROM session_history WHERE profileId = :profileId")
    suspend fun clearHistoryForProfile(profileId: String)

    @Query("DELETE FROM session_history")
    suspend fun deleteAllHistory()
}
