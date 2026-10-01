package com.aplus.impossible.data.parser

import com.aplus.impossible.data.model.CaseSubQuestion
import com.aplus.impossible.data.model.MatchingPair
import com.aplus.impossible.data.model.QuestionEntity
import com.aplus.impossible.data.model.QuestionType
import java.util.UUID

data class ParseIssue(
    val questionNumber: String,
    val location: String,
    val issue: String,
    val cause: String,
    val suggestedFix: String
)

data class ImportPreviewResult(
    val deckTitle: String,
    val year: String,
    val module: String,
    val subject: String,
    val lectureName: String,
    val questions: List<QuestionEntity>,
    val detectedQuestionCount: Int,
    val typeBreakdown: Map<QuestionType, Int>,
    val answerKeyCount: Int,
    val issues: List<ParseIssue>,
    val warnings: List<String>,
    val rawText: String,
    val hasBlockingErrors: Boolean
)

object QuestionParserEngine {

    private val FORBIDDEN_METADATA_PATTERNS = listOf(
        Regex("university", RegexOption.IGNORE_CASE),
        Regex("faculty\\s+of", RegexOption.IGNORE_CASE),
        Regex("department\\s+of", RegexOption.IGNORE_CASE),
        Regex("college\\s+of", RegexOption.IGNORE_CASE),
        Regex("examination\\s+paper", RegexOption.IGNORE_CASE),
        Regex("exam\\s+paper", RegexOption.IGNORE_CASE),
        Regex("midterm", RegexOption.IGNORE_CASE),
        Regex("final\\s+exam", RegexOption.IGNORE_CASE),
        Regex("total\\s+marks", RegexOption.IGNORE_CASE),
        Regex("duration\\s*:", RegexOption.IGNORE_CASE),
        Regex("instructions\\s*:", RegexOption.IGNORE_CASE),
        Regex("page\\s+\\d+\\s+of\\s+\\d+", RegexOption.IGNORE_CASE),
        Regex("copyright", RegexOption.IGNORE_CASE),
        Regex("all\\s+rights\\s+reserved", RegexOption.IGNORE_CASE)
    )

    fun parseRawText(
        rawText: String,
        deckId: String = UUID.randomUUID().toString(),
        year: String = "Year 2",
        module: String = "Blood",
        subject: String = "Physiology",
        lectureName: String = "Imported Medical Lecture"
    ): ImportPreviewResult {
        val lines = rawText.replace("\r\n", "\n").replace("\r", "\n").split("\n")
            .map { it.trim() }

        val answerKeys = mutableMapOf<Int, List<Int>>()
        val answerKeyStrings = mutableMapOf<Int, String>()
        val inlineAnswerKeyRegex = Regex("^(?:ANSWER|ANS|CORRECT\\s+ANSWER|KEY)\\s*[:\\-]?\\s*([A-Z0-9,\\s\\+\\-]+)", RegexOption.IGNORE_CASE)
        val explanationRegex = Regex("^(?:EXPLANATION|EXPLAIN|RATIONALE)\\s*[:\\-]?\\s*(.*)", RegexOption.IGNORE_CASE)
        val highYieldRegex = Regex("^(?:HIGH[\\-\\s]YIELD(?:\\s+NOTES?)?|NOTE|CLINICAL\\s+PEARL)\\s*[:\\-]?\\s*(.*)", RegexOption.IGNORE_CASE)

        // Pass 1: Extract Terminal Answer Key section if present at the bottom
        var answerKeyStartIndex = -1
        for (i in lines.indices) {
            val line = lines[i].uppercase()
            if (line.startsWith("OFFICIAL ANSWER KEY") || line.startsWith("ANSWER KEY") || line == "ANSWERS:" || line == "KEY:") {
                answerKeyStartIndex = i
                break
            }
        }

        if (answerKeyStartIndex != -1) {
            val keyLines = lines.subList(answerKeyStartIndex + 1, lines.size)
            val keyItemRegex = Regex("(?:Q?(\\d+)[\\.:\\-\\)\\s]+([A-Ea-e1-5TFtfTrueFalseTRUEFALSE]+))")
            for (kLine in keyLines) {
                val matches = keyItemRegex.findAll(kLine)
                for (m in matches) {
                    val qNum = m.groupValues[1].toIntOrNull() ?: continue
                    val ansToken = m.groupValues[2].trim().uppercase()
                    val indices = tokenToIndices(ansToken)
                    if (indices.isNotEmpty()) {
                        answerKeys[qNum] = indices
                        answerKeyStrings[qNum] = ansToken
                    }
                }
            }
        }

        // Pass 2: Question Segmentation
        val contentLines = if (answerKeyStartIndex != -1) lines.subList(0, answerKeyStartIndex) else lines
        val questionBlocks = mutableListOf<List<String>>()
        var currentBlock = mutableListOf<String>()

        val primaryQRegex = Regex("^(?:\\[|\\()?Q?\\.?\\s*(\\d+)[\\.:\\-\\)]\\s*(.*)", RegexOption.IGNORE_CASE)
        val caseHeaderRegex = Regex("^(?:CASE(?:\\s+STUDY)?|CLINICAL\\s+CASE)\\s*#?\\s*([0-9IVX]+)?[:\\-\\s]*(.*)", RegexOption.IGNORE_CASE)

        for (line in contentLines) {
            if (isForbiddenHeader(line)) continue

            val isQStart = primaryQRegex.matches(line) && !line.matches(Regex("^(?:\\[|\\()?Q?\\.?\\s*\\d+\\.\\d+.*"))
            val isCaseStart = caseHeaderRegex.matches(line)

            if (isQStart || isCaseStart) {
                if (currentBlock.isNotEmpty()) {
                    questionBlocks.add(currentBlock)
                    currentBlock = mutableListOf()
                }
            }
            if (line.isNotEmpty()) {
                currentBlock.add(line)
            }
        }
        if (currentBlock.isNotEmpty()) {
            questionBlocks.add(currentBlock)
        }

        // Pass 3: Parse each block into a QuestionEntity
        val parsedQuestions = mutableListOf<QuestionEntity>()
        val issues = mutableListOf<ParseIssue>()
        val warnings = mutableListOf<String>()

        val optionRegex = Regex("^[\\(\\[]?([A-Fa-f1-6])[\\)\\.\\]\\-\\s]+(.*)")

        var questionCounter = 1

        for ((blockIdx, block) in questionBlocks.withIndex()) {
            val firstLine = block.firstOrNull() ?: continue
            val qNumMatch = primaryQRegex.find(firstLine)
            val detectedQNum = qNumMatch?.groupValues?.get(1)?.toIntOrNull() ?: (blockIdx + 1)

            // Check if this block is a Case Study
            if (caseHeaderRegex.matches(firstLine)) {
                val caseStudyQ = parseCaseStudyBlock(block, deckId, questionCounter)
                parsedQuestions.add(caseStudyQ)
                questionCounter++
                continue
            }

            // Normal Question Stem & Options
            val stemLines = mutableListOf<String>()
            val options = mutableListOf<String>()
            val correctAnswers = mutableListOf<Int>()
            var explanation: String? = null
            var highYieldNotes: String? = null
            var readingOptions = false
            var questionType = QuestionType.SINGLE_MCQ

            var cleanedFirst = firstLine
            if (qNumMatch != null) {
                cleanedFirst = qNumMatch.groupValues[2].trim()
            }
            if (cleanedFirst.isNotEmpty()) {
                stemLines.add(cleanedFirst)
            }

            for (i in 1 until block.size) {
                val line = block[i]

                val explMatch = explanationRegex.find(line)
                if (explMatch != null) {
                    explanation = explMatch.groupValues[1].trim()
                    continue
                }

                val hyMatch = highYieldRegex.find(line)
                if (hyMatch != null) {
                    highYieldNotes = hyMatch.groupValues[1].trim()
                    continue
                }

                val inlineAnsMatch = inlineAnswerKeyRegex.find(line)
                if (inlineAnsMatch != null) {
                    val token = inlineAnsMatch.groupValues[1].trim()
                    val indices = tokenToIndices(token)
                    correctAnswers.addAll(indices)
                    continue
                }

                val optMatch = optionRegex.find(line)
                if (optMatch != null) {
                    readingOptions = true
                    options.add(optMatch.groupValues[2].trim())
                } else if (readingOptions) {
                    // Append continuation line to last option
                    if (options.isNotEmpty()) {
                        val last = options.removeAt(options.size - 1)
                        options.add("$last $line")
                    }
                } else {
                    stemLines.add(line)
                }
            }

            // Check answer key from Pass 1
            if (correctAnswers.isEmpty() && answerKeys.containsKey(detectedQNum)) {
                correctAnswers.addAll(answerKeys[detectedQNum]!!)
            }

            val questionStem = stemLines.joinToString(" ").trim()

            // Determine question type
            if (isTrueFalseQuestion(questionStem, options)) {
                questionType = QuestionType.TRUE_FALSE
                if (options.isEmpty()) {
                    options.addAll(listOf("True", "False"))
                }
            } else if (isMatchingQuestion(block)) {
                questionType = QuestionType.MATCHING
            } else if (isOrderingQuestion(block)) {
                questionType = QuestionType.ORDERING
            } else if (correctAnswers.size > 1) {
                questionType = QuestionType.MULTIPLE_MCQ
            } else {
                questionType = QuestionType.SINGLE_MCQ
            }

            // Validate
            if (options.isEmpty() && questionType == QuestionType.SINGLE_MCQ) {
                issues.add(
                    ParseIssue(
                        questionNumber = "$detectedQNum",
                        location = "Question $detectedQNum",
                        issue = "Missing MCQ options",
                        cause = "No options labeled A), B), C), D) detected",
                        suggestedFix = "Add options labeled A, B, C, D"
                    )
                )
            }
            if (correctAnswers.isEmpty()) {
                // Default to 0 with a warning
                correctAnswers.add(0)
                warnings.add("Question $detectedQNum has no explicit answer key. Defaulted to Option A.")
            }

            val entity = QuestionEntity(
                id = UUID.randomUUID().toString(),
                deckId = deckId,
                type = questionType,
                question = questionStem.ifEmpty { "Question $detectedQNum" },
                options = if (options.isNotEmpty()) options else listOf("Option A", "Option B", "Option C", "Option D"),
                correctAnswers = correctAnswers.distinct(),
                explanation = explanation,
                highYieldNotes = highYieldNotes,
                originalOrderIndex = questionCounter
            )
            parsedQuestions.add(entity)
            questionCounter++
        }

        val typeBreakdown = mutableMapOf<QuestionType, Int>()
        QuestionType.entries.forEach { typeBreakdown[it] = 0 }
        parsedQuestions.forEach {
            typeBreakdown[it.type] = (typeBreakdown[it.type] ?: 0) + 1
        }

        return ImportPreviewResult(
            deckTitle = lectureName,
            year = year,
            module = module,
            subject = subject,
            lectureName = lectureName,
            questions = parsedQuestions,
            detectedQuestionCount = parsedQuestions.size,
            typeBreakdown = typeBreakdown,
            answerKeyCount = answerKeys.size,
            issues = issues,
            warnings = warnings,
            rawText = rawText,
            hasBlockingErrors = parsedQuestions.isEmpty()
        )
    }

    private fun parseCaseStudyBlock(block: List<String>, deckId: String, orderIdx: Int): QuestionEntity {
        val vignetteLines = mutableListOf<String>()
        val subQuestions = mutableListOf<CaseSubQuestion>()
        var inSubQuestions = false
        var currentSubQuestion: String? = null
        val currentSubOptions = mutableListOf<String>()
        var currentSubCorrect = 0

        val subRegex = Regex("^(?:\\[|\\()?Q?\\.?\\s*(\\d+\\.\\d+)[\\.:\\-\\)]?\\s*(.*)", RegexOption.IGNORE_CASE)
        val optionRegex = Regex("^[\\(\\[]?([A-Fa-f1-6])[\\)\\.\\]\\-\\s]+(.*)")
        val inlineAnsRegex = Regex("^(?:ANSWER|ANS)\\s*[:\\-]?\\s*([A-Za-z0-9]+)", RegexOption.IGNORE_CASE)

        for (line in block) {
            val subMatch = subRegex.find(line)
            if (subMatch != null) {
                inSubQuestions = true
                if (currentSubQuestion != null) {
                    subQuestions.add(
                        CaseSubQuestion(
                            id = UUID.randomUUID().toString(),
                            question = currentSubQuestion,
                            options = currentSubOptions.toList(),
                            correctAnswer = currentSubCorrect
                        )
                    )
                    currentSubOptions.clear()
                    currentSubCorrect = 0
                }
                currentSubQuestion = subMatch.groupValues[2].trim()
                continue
            }

            if (!inSubQuestions) {
                vignetteLines.add(line)
            } else {
                val optMatch = optionRegex.find(line)
                if (optMatch != null) {
                    currentSubOptions.add(optMatch.groupValues[2].trim())
                } else {
                    val ansMatch = inlineAnsRegex.find(line)
                    if (ansMatch != null) {
                        val token = ansMatch.groupValues[1].uppercase()
                        currentSubCorrect = tokenToIndices(token).firstOrNull() ?: 0
                    } else if (currentSubQuestion != null && currentSubOptions.isEmpty()) {
                        currentSubQuestion = "$currentSubQuestion $line"
                    }
                }
            }
        }

        if (currentSubQuestion != null) {
            subQuestions.add(
                CaseSubQuestion(
                    id = UUID.randomUUID().toString(),
                    question = currentSubQuestion,
                    options = currentSubOptions.toList(),
                    correctAnswer = currentSubCorrect
                )
            )
        }

        return QuestionEntity(
            id = UUID.randomUUID().toString(),
            deckId = deckId,
            type = QuestionType.CASE_STUDY,
            question = "Clinical Case Study",
            caseVignette = vignetteLines.joinToString("\n").trim(),
            subQuestions = subQuestions,
            options = emptyList(),
            correctAnswers = emptyList(),
            originalOrderIndex = orderIdx
        )
    }

    private fun isForbiddenHeader(line: String): Boolean {
        if (line.length > 150) return false
        return FORBIDDEN_METADATA_PATTERNS.any { it.containsMatchIn(line) }
    }

    private fun isTrueFalseQuestion(stem: String, options: List<String>): Boolean {
        val s = stem.lowercase()
        if (s.contains("true or false") || s.contains("true/false")) return true
        if (options.size == 2) {
            val o0 = options[0].lowercase()
            val o1 = options[1].lowercase()
            if ((o0 == "true" && o1 == "false") || (o0 == "false" && o1 == "true")) return true
        }
        return false
    }

    private fun isMatchingQuestion(block: List<String>): Boolean {
        return block.any {
            it.contains("match column", ignoreCase = true) ||
            it.contains("match each", ignoreCase = true) ||
            it.contains("matching pairs", ignoreCase = true)
        }
    }

    private fun isOrderingQuestion(block: List<String>): Boolean {
        return block.any {
            it.contains("arrange in sequence", ignoreCase = true) ||
            it.contains("correct order", ignoreCase = true) ||
            it.contains("chronological order", ignoreCase = true) ||
            it.contains("correct sequence", ignoreCase = true)
        }
    }

    private fun tokenToIndices(token: String): List<Int> {
        val clean = token.uppercase().replace(Regex("[^A-Z0-9]"), "")
        val result = mutableListOf<Int>()
        for (ch in clean) {
            when (ch) {
                'A', '1' -> result.add(0)
                'B', '2' -> result.add(1)
                'C', '3' -> result.add(2)
                'D', '4' -> result.add(3)
                'E', '5' -> result.add(4)
                'F', '6' -> result.add(5)
                'T' -> result.add(0) // True
                'F' -> result.add(1) // False
            }
        }
        return result.distinct()
    }
}
