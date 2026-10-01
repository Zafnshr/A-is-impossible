package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.QuestionEntity
import com.aplus.impossible.data.model.QuestionUserStatusEntity
import com.aplus.impossible.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuestionMapBottomSheet(
    questions: List<QuestionEntity>,
    currentIndex: Int,
    submittedMap: Map<String, Boolean>,
    answersMap: Map<String, Any>,
    evaluateCorrectness: (QuestionEntity, Any?) -> Boolean,
    statuses: List<QuestionUserStatusEntity>,
    onJump: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedFilter by remember { mutableStateOf("all") }

    val statusMap = remember(statuses) {
        statuses.associateBy { it.questionId }
    }

    // Solved & Correct calculations
    val solvedCount = submittedMap.size
    val totalCount = questions.size
    var correctCount = 0
    var incorrectCount = 0

    questions.forEach { q ->
        if (submittedMap[q.id] == true) {
            val ans = answersMap[q.id]
            if (evaluateCorrectness(q, ans)) {
                correctCount++
            } else {
                incorrectCount++
            }
        }
    }
    val unansweredCount = totalCount - solvedCount
    val accuracy = if (solvedCount > 0) (correctCount * 100) / solvedCount else 0

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        scrimColor = Color.Black.copy(alpha = 0.6f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 32.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Question Map",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Tap any question to jump instantly",
                        color = TextSecondaryDark,
                        fontSize = 12.sp
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = TextMutedDark)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Summary Metric Bar
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkBackground),
                shape = RoundedCornerShape(12.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp, horizontal = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$solvedCount / $totalCount", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(text = "Solved", color = TextMutedDark, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$correctCount", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(text = "Correct", color = TextMutedDark, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$incorrectCount", color = ErrorRed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(text = "Incorrect", color = TextMutedDark, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$unansweredCount", color = TextSecondaryDark, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(text = "Remaining", color = TextMutedDark, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "$accuracy%", color = CyanGlow, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(text = "Accuracy", color = TextMutedDark, fontSize = 11.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Filter Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                val filters = listOf(
                    "all" to "All",
                    "unanswered" to "Unanswered",
                    "incorrect" to "Incorrect",
                    "flagged" to "Flagged",
                    "correct" to "Correct"
                )
                filters.forEach { (key, label) ->
                    val isSelected = selectedFilter == key
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedFilter = key },
                        label = { Text(label, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryCyan.copy(alpha = 0.25f),
                            selectedLabelColor = CyanGlow,
                            containerColor = DarkBackground,
                            labelColor = TextSecondaryDark
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            selectedBorderColor = PrimaryCyan,
                            borderColor = DarkCardBorder
                        ),
                        modifier = Modifier.height(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Grid of Questions (1..N)
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 44.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 300.dp)
            ) {
                itemsIndexed(questions) { index, question ->
                    val isCurrent = index == currentIndex
                    val isSubmitted = submittedMap[question.id] == true
                    val ans = answersMap[question.id]
                    val isCorrect = isSubmitted && evaluateCorrectness(question, ans)
                    val isIncorrect = isSubmitted && !isCorrect
                    val status = statusMap[question.id]
                    val isFlagged = status?.isFlagged == true
                    val isFavorite = status?.isFavorite == true

                    // Apply filter
                    val matchesFilter = when (selectedFilter) {
                        "unanswered" -> !isSubmitted
                        "incorrect" -> isIncorrect
                        "correct" -> isCorrect
                        "flagged" -> isFlagged
                        else -> true
                    }

                    if (matchesFilter) {
                        val bgColor = when {
                            isCorrect -> SuccessGreen.copy(alpha = 0.25f)
                            isIncorrect -> ErrorRed.copy(alpha = 0.25f)
                            else -> DarkBackground
                        }
                        val borderColor = when {
                            isCurrent -> CyanGlow
                            isCorrect -> SuccessGreen
                            isIncorrect -> ErrorRed
                            else -> DarkCardBorder
                        }
                        val textColor = when {
                            isCorrect -> SuccessGreen
                            isIncorrect -> ErrorRed
                            else -> Color.White
                        }

                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(bgColor)
                                .border(if (isCurrent) 2.dp else 1.dp, borderColor, RoundedCornerShape(10.dp))
                                .clickable {
                                    onJump(index)
                                    onDismiss()
                                }
                        ) {
                            Text(
                                text = "${index + 1}",
                                color = textColor,
                                fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                            if (isFlagged) {
                                Icon(
                                    Icons.Default.Flag,
                                    contentDescription = null,
                                    tint = WarningAmber,
                                    modifier = Modifier
                                        .size(10.dp)
                                        .align(Alignment.TopEnd)
                                        .padding(top = 2.dp, end = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
