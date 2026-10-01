package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.QuestionUserStatusEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface QuestionStatusDao {
    @Query("SELECT * FROM question_status WHERE profileId = :profileId")
    fun getAllStatusesFlow(profileId: String): Flow<List<QuestionUserStatusEntity>>

    @Query("SELECT * FROM question_status WHERE profileId = :profileId")
    suspend fun getAllStatuses(profileId: String): List<QuestionUserStatusEntity>

    @Query("SELECT * FROM question_status WHERE profileId = :profileId AND questionId = :questionId LIMIT 1")
    suspend fun getStatus(profileId: String, questionId: String): QuestionUserStatusEntity?

    @Query("SELECT * FROM question_status WHERE profileId = :profileId AND isFavorite = 1")
    fun getFavoritesFlow(profileId: String): Flow<List<QuestionUserStatusEntity>>

    @Query("SELECT * FROM question_status WHERE profileId = :profileId AND isFlagged = 1")
    fun getFlaggedFlow(profileId: String): Flow<List<QuestionUserStatusEntity>>

    @Query("SELECT * FROM question_status WHERE profileId = :profileId AND isIncorrect = 1")
    fun getIncorrectFlow(profileId: String): Flow<List<QuestionUserStatusEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveStatus(status: QuestionUserStatusEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveStatuses(statuses: List<QuestionUserStatusEntity>)

    @Query("DELETE FROM question_status WHERE profileId = :profileId AND questionId = :questionId")
    suspend fun deleteStatus(profileId: String, questionId: String)

    @Query("DELETE FROM question_status WHERE profileId = :profileId")
    suspend fun clearStatusesForProfile(profileId: String)

    @Query("DELETE FROM question_status")
    suspend fun deleteAllStatuses()
}
