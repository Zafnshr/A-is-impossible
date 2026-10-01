package com.aplus.impossible.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.ui.theme.PrimaryCyan
import com.aplus.impossible.ui.theme.SuccessGreen

@Composable
fun CircularProgressRing(
    percentage: Int,
    size: Dp = 100.dp,
    strokeWidth: Dp = 8.dp,
    trackColor: Color = Color(0xFF1F2937),
    progressColor: Color = if (percentage >= 70) SuccessGreen else PrimaryCyan,
    subText: String? = null
) {
    val animatedProgress by animateFloatAsState(
        targetValue = percentage / 100f,
        animationSpec = tween(durationMillis = 900),
        label = "progress"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(size)
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokePx = strokeWidth.toPx()
            val arcSize = size.toPx() - strokePx
            val topLeft = Offset(strokePx / 2, strokePx / 2)

            // Background Track
            drawArc(
                color = trackColor,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = topLeft,
                size = Size(arcSize, arcSize),
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )

            // Progress Arc
            drawArc(
                color = progressColor,
                startAngle = -90f,
                sweepAngle = 360f * animatedProgress,
                useCenter = false,
                topLeft = topLeft,
                size = Size(arcSize, arcSize),
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$percentage%",
                color = Color.White,
                fontSize = (size.value * 0.22f).sp,
                fontWeight = FontWeight.Bold
            )
            if (subText != null) {
                Text(
                    text = subText,
                    color = Color(0xFF9CA3AF),
                    fontSize = (size.value * 0.11f).sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
