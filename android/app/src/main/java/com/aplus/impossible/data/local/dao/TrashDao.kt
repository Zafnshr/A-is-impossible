package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.TrashItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TrashDao {
    @Query("SELECT * FROM trash WHERE profileId = :profileId ORDER BY deletedAt DESC")
    fun getTrashItemsFlow(profileId: String): Flow<List<TrashItemEntity>>

    @Query("SELECT * FROM trash WHERE profileId = :profileId ORDER BY deletedAt DESC")
    suspend fun getTrashItems(profileId: String): List<TrashItemEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrashItem(item: TrashItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrashItems(items: List<TrashItemEntity>)

    @Query("DELETE FROM trash WHERE id = :id")
    suspend fun deleteTrashItem(id: String)

    @Query("DELETE FROM trash WHERE profileId = :profileId")
    suspend fun clearTrashForProfile(profileId: String)

    @Query("DELETE FROM trash")
    suspend fun deleteAllTrash()
}
