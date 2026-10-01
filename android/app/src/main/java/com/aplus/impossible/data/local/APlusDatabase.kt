package com.aplus.impossible.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.aplus.impossible.data.local.dao.*
import com.aplus.impossible.data.model.*

@Database(
    entities = [
        UserProfileEntity::class,
        UserSettingsEntity::class,
        DeckEntity::class,
        QuestionEntity::class,
        QuestionUserStatusEntity::class,
        UserAttemptEntity::class,
        StudySessionStateEntity::class,
        StudySessionRecordEntity::class,
        TrashItemEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class APlusDatabase : RoomDatabase() {
    abstract fun deckDao(): DeckDao
    abstract fun questionDao(): QuestionDao
    abstract fun questionStatusDao(): QuestionStatusDao
    abstract fun attemptDao(): AttemptDao
    abstract fun studySessionDao(): StudySessionDao
    abstract fun sessionHistoryDao(): SessionHistoryDao
    abstract fun trashDao(): TrashDao
    abstract fun userProfileDao(): UserProfileDao
    abstract fun userSettingsDao(): UserSettingsDao

    companion object {
        @Volatile
        private var INSTANCE: APlusDatabase? = null

        fun getInstance(context: Context): APlusDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    APlusDatabase::class.java,
                    "aplus_is_impossible.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
