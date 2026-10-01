package com.aplus.impossible.data.local.dao

import androidx.room.*
import com.aplus.impossible.data.model.QuestionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface QuestionDao {
    @Query("SELECT * FROM questions ORDER BY originalOrderIndex ASC, createdAt ASC")
    fun getAllQuestionsFlow(): Flow<List<QuestionEntity>>

    @Query("SELECT * FROM questions ORDER BY originalOrderIndex ASC, createdAt ASC")
    suspend fun getAllQuestions(): List<QuestionEntity>

    @Query("SELECT * FROM questions WHERE deckId = :deckId ORDER BY originalOrderIndex ASC, createdAt ASC")
    fun getQuestionsByDeckFlow(deckId: String): Flow<List<QuestionEntity>>

    @Query("SELECT * FROM questions WHERE deckId = :deckId ORDER BY originalOrderIndex ASC, createdAt ASC")
    suspend fun getQuestionsByDeck(deckId: String): List<QuestionEntity>

    @Query("SELECT * FROM questions WHERE id = :questionId LIMIT 1")
    suspend fun getQuestionById(questionId: String): QuestionEntity?

    @Query("SELECT * FROM questions WHERE id IN (:questionIds)")
    suspend fun getQuestionsByIds(questionIds: List<String>): List<QuestionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestion(question: QuestionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestions(questions: List<QuestionEntity>)

    @Update
    suspend fun updateQuestion(question: QuestionEntity)

    @Query("DELETE FROM questions WHERE id = :questionId")
    suspend fun deleteQuestionById(questionId: String)

    @Query("DELETE FROM questions WHERE deckId = :deckId")
    suspend fun deleteQuestionsByDeck(deckId: String)

    @Query("DELETE FROM questions")
    suspend fun deleteAllQuestions()

    @Query("SELECT COUNT(*) FROM questions")
    suspend fun getQuestionCount(): Int

    @Query("SELECT COUNT(*) FROM questions WHERE deckId = :deckId")
    suspend fun getQuestionCountForDeck(deckId: String): Int
}
