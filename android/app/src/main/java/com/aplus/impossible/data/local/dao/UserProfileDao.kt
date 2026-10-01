package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.UserProfileEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserProfileDao {
    @Query("SELECT * FROM profiles ORDER BY lastActiveAt DESC")
    fun getAllProfilesFlow(): Flow<List<UserProfileEntity>>

    @Query("SELECT * FROM profiles ORDER BY lastActiveAt DESC")
    suspend fun getAllProfiles(): List<UserProfileEntity>

    @Query("SELECT * FROM profiles WHERE id = :id LIMIT 1")
    suspend fun getProfileById(id: String): UserProfileEntity?

    @Query("SELECT * FROM profiles WHERE id = :id LIMIT 1")
    fun getProfileByIdFlow(id: String): Flow<UserProfileEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: UserProfileEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfiles(profiles: List<UserProfileEntity>)

    @Query("DELETE FROM profiles WHERE id = :id")
    suspend fun deleteProfileById(id: String)

    @Query("DELETE FROM profiles")
    suspend fun deleteAllProfiles()
}
