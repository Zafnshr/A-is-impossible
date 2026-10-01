package com.aplus.impossible.data.local

import androidx.room.TypeConverter
import com.aplus.impossible.data.model.CaseSubQuestion
import com.aplus.impossible.data.model.MatchingPair
import com.aplus.impossible.data.model.QuestionType
import com.aplus.impossible.data.model.ShuffleOptions
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromQuestionType(type: QuestionType?): String {
        return type?.typeKey ?: QuestionType.SINGLE_MCQ.typeKey
    }

    @TypeConverter
    fun toQuestionType(value: String?): QuestionType {
        return if (value != null) QuestionType.fromKey(value) else QuestionType.SINGLE_MCQ
    }

    @TypeConverter
    fun fromStringList(list: List<String>?): String {
        return gson.toJson(list ?: emptyList<String>())
    }

    @TypeConverter
    fun toStringList(value: String?): List<String> {
        if (value.isNullOrBlank()) return emptyList()
        val type = object : TypeToken<List<String>>() {}.type
        return try {
            gson.fromJson(value, type) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    @TypeConverter
    fun fromIntList(list: List<Int>?): String {
        return gson.toJson(list ?: emptyList<Int>())
    }

    @TypeConverter
    fun toIntList(value: String?): List<Int> {
        if (value.isNullOrBlank()) return emptyList()
        val type = object : TypeToken<List<Int>>() {}.type
        return try {
            gson.fromJson(value, type) ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    @TypeConverter
    fun fromMatchingPairList(list: List<MatchingPair>?): String? {
        return if (list == null) null else gson.toJson(list)
    }

    @TypeConverter
    fun toMatchingPairList(value: String?): List<MatchingPair>? {
        if (value.isNullOrBlank()) return null
        val type = object : TypeToken<List<MatchingPair>>() {}.type
        return try {
            gson.fromJson(value, type)
        } catch (_: Exception) {
            null
        }
    }

    @TypeConverter
    fun fromCaseSubQuestionList(list: List<CaseSubQuestion>?): String? {
        return if (list == null) null else gson.toJson(list)
    }

    @TypeConverter
    fun toCaseSubQuestionList(value: String?): List<CaseSubQuestion>? {
        if (value.isNullOrBlank()) return null
        val type = object : TypeToken<List<CaseSubQuestion>>() {}.type
        return try {
            gson.fromJson(value, type)
        } catch (_: Exception) {
            null
        }
    }

    @TypeConverter
    fun fromShuffleOptions(options: ShuffleOptions?): String {
        return gson.toJson(options ?: ShuffleOptions())
    }

    @TypeConverter
    fun toShuffleOptions(value: String?): ShuffleOptions {
        if (value.isNullOrBlank()) return ShuffleOptions()
        return try {
            gson.fromJson(value, ShuffleOptions::class.java) ?: ShuffleOptions()
        } catch (_: Exception) {
            ShuffleOptions()
        }
    }
}
