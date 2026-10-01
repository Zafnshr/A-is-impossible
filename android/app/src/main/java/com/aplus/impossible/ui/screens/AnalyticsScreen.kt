package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.AcademicCurriculum
import com.aplus.impossible.ui.components.CircularProgressRing
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel

@Composable
fun AnalyticsScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val attempts by viewModel.attempts.collectAsState()
    val sessionHistory by viewModel.sessionHistory.collectAsState()

    val totalAttempts = attempts.size
    val correctAttempts = attempts.count { it.isCorrect }
    val overallAccuracy = if (totalAttempts > 0) (correctAttempts * 100) / totalAttempts else 0
    val totalTimeSeconds = attempts.sumOf { it.timeSpentSeconds }
    val totalHours = totalTimeSeconds / 3600
    val totalMins = (totalTimeSeconds % 3600) / 60

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Overall Performance Hero
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(16.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
            ) {
                Row(
                    modifier = Modifier.padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressRing(
                        percentage = overallAccuracy,
                        size = 90.dp,
                        strokeWidth = 8.dp,
                        subText = "Accuracy"
                    )

                    Spacer(modifier = Modifier.width(20.dp))

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Diagnostic Analytics",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$correctAttempts correct of $totalAttempts attempts",
                            color = TextSecondaryDark,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Total Study Time: ${totalHours}h ${totalMins}m",
                            color = CyanGlow,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // 2. Subject Mastery Breakdown
        item {
            Text(
                text = "Subject Performance Breakdown",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(14.dp),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    AcademicCurriculum.STANDARD_SUBJECTS.forEach { subject ->
                        val subjectAttempts = attempts.filter { it.subject.equals(subject, ignoreCase = true) }
                        val subjTotal = subjectAttempts.size
                        val subjCorrect = subjectAttempts.count { it.isCorrect }
                        val subjAccuracy = if (subjTotal > 0) (subjCorrect * 100) / subjTotal else 0

                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = subject, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                Text(
                                    text = if (subjTotal > 0) "$subjAccuracy% ($subjCorrect/$subjTotal)" else "No attempts",
                                    color = if (subjTotal > 0) (if (subjAccuracy >= 70) SuccessGreen else WarningAmber) else TextMutedDark,
                                    fontSize = 12.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { if (subjTotal > 0) subjAccuracy / 100f else 0f },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = if (subjAccuracy >= 70) SuccessGreen else PrimaryCyan,
                                trackColor = DarkBackground
                            )
                        }
                    }
                }
            }
        }

        // 3. Historical Study Sessions
        item {
            Text(
                text = "Recent Study Sessions",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }

        if (sessionHistory.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "No completed study sessions recorded yet. Start studying from the Library to build history!",
                            color = TextSecondaryDark,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        } else {
            items(sessionHistory.take(15)) { record ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (record.score >= 70) SuccessGreen.copy(alpha = 0.2f) else PrimaryCyan.copy(alpha = 0.2f))
                        ) {
                            Text(
                                text = "${record.score}%",
                                color = if (record.score >= 70) SuccessGreen else CyanGlow,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = record.sessionTitle,
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${record.date} • ${record.correctAnswers}/${record.totalQuestions} Correct • ${record.durationSeconds / 60}m",
                                color = TextSecondaryDark,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
