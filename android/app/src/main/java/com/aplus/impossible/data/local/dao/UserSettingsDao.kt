package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.UserSettingsEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserSettingsDao {
    @Query("SELECT * FROM settings WHERE profileId = :profileId LIMIT 1")
    fun getSettingsFlow(profileId: String): Flow<UserSettingsEntity?>

    @Query("SELECT * FROM settings WHERE profileId = :profileId LIMIT 1")
    suspend fun getSettings(profileId: String): UserSettingsEntity?

    @Query("SELECT * FROM settings")
    suspend fun getAllSettings(): List<UserSettingsEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSettings(settings: UserSettingsEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSettings(settings: List<UserSettingsEntity>)

    @Query("DELETE FROM settings WHERE profileId = :profileId")
    suspend fun deleteSettings(profileId: String)

    @Query("DELETE FROM settings")
    suspend fun deleteAllSettings()
}
