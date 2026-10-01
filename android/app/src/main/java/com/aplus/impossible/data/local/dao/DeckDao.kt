package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.DeckEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DeckDao {
    @Query("SELECT * FROM decks ORDER BY updatedAt DESC")
    fun getAllDecksFlow(): Flow<List<DeckEntity>>

    @Query("SELECT * FROM decks ORDER BY updatedAt DESC")
    suspend fun getAllDecks(): List<DeckEntity>

    @Query("SELECT * FROM decks WHERE id = :deckId LIMIT 1")
    suspend fun getDeckById(deckId: String): DeckEntity?

    @Query("SELECT * FROM decks WHERE id = :deckId LIMIT 1")
    fun getDeckByIdFlow(deckId: String): Flow<DeckEntity?>

    @Query("SELECT * FROM decks WHERE year = :year AND module = :module AND subject = :subject ORDER BY lectureName ASC")
    fun getDecksBySubjectFlow(year: String, module: String, subject: String): Flow<List<DeckEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeck(deck: DeckEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDecks(decks: List<DeckEntity>)

    @Update
    suspend fun updateDeck(deck: DeckEntity)

    @Query("DELETE FROM decks WHERE id = :deckId")
    suspend fun deleteDeckById(deckId: String)

    @Query("DELETE FROM decks")
    suspend fun deleteAllDecks()

    @Query("SELECT COUNT(*) FROM decks")
    suspend fun getDeckCount(): Int
}
