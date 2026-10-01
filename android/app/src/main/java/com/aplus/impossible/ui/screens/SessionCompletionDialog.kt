package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Celebration
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.SessionCompletionSummary
import com.aplus.impossible.ui.components.CircularProgressRing
import com.aplus.impossible.ui.components.ConfettiEffect
import com.aplus.impossible.ui.theme.*

@Composable
fun SessionCompletionDialog(
    summary: SessionCompletionSummary,
    onStudyIncorrect: () -> Unit,
    onFinish: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f)),
        contentAlignment = Alignment.Center
    ) {
        // Confetti effect if score >= 60
        if (summary.scorePercentage >= 60) {
            ConfettiEffect()
        }

        Card(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .wrapContentHeight(),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            shape = RoundedCornerShape(24.dp),
            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, PrimaryCyan.copy(alpha = 0.5f))))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header badge
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(PrimaryCyan.copy(alpha = 0.15f))
                ) {
                    Icon(
                        Icons.Default.Celebration,
                        contentDescription = null,
                        tint = CyanGlow,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = if (summary.scorePercentage >= 85) "Outstanding Mastery!" else if (summary.scorePercentage >= 60) "Great Session!" else "Session Completed",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = summary.deckTitle,
                    color = TextSecondaryDark,
                    fontSize = 13.sp,
                    maxLines = 1
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Score Ring
                CircularProgressRing(
                    percentage = summary.scorePercentage,
                    size = 110.dp,
                    strokeWidth = 9.dp,
                    subText = "Accuracy"
                )

                Spacer(modifier = Modifier.height(22.dp))

                // Stats Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MiniSummaryMetric(label = "Correct", value = "${summary.correctCount}", color = SuccessGreen, modifier = Modifier.weight(1f))
                    MiniSummaryMetric(label = "Incorrect", value = "${summary.incorrectCount}", color = ErrorRed, modifier = Modifier.weight(1f))
                    MiniSummaryMetric(label = "Total", value = "${summary.totalQuestions}", color = Color.White, modifier = Modifier.weight(1f))
                    val minutes = summary.timeSpentSeconds / 60
                    val secs = summary.timeSpentSeconds % 60
                    MiniSummaryMetric(label = "Time", value = "${minutes}m ${secs}s", color = CyanGlow, modifier = Modifier.weight(1f))
                }

                Spacer(modifier = Modifier.height(26.dp))

                // Buttons
                if (summary.incorrectCount > 0) {
                    Button(
                        onClick = onStudyIncorrect,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "Review Incorrect (${summary.incorrectCount})",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                Button(
                    onClick = onFinish,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Return to Dashboard",
                        color = DarkBackground,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
fun MiniSummaryMetric(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(DarkBackground)
            .padding(vertical = 8.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = value, color = color, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = label, color = TextMutedDark, fontSize = 10.sp)
        }
    }
}
