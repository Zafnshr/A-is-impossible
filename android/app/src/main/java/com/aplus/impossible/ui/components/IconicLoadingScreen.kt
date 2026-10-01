package com.aplus.impossible.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.ui.theme.CyanGlow
import com.aplus.impossible.ui.theme.DarkBackground
import com.aplus.impossible.ui.theme.PrimaryCyan
import com.aplus.impossible.ui.theme.PrimaryTeal
import kotlinx.coroutines.delay
import kotlin.math.sin

data class SynapticPoint(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    val radius: Float
)

@Composable
fun IconicLoadingScreen(
    onComplete: () -> Unit
) {
    val telemetrySteps = remember {
        listOf(
            "Initializing Neural Spaced-Repetition Core...",
            "Calibrating Clinical Diagnostic Matrices...",
            "Indexing High-Yield USMLE / Medical Question Bank...",
            "Synchronizing Active Recall Synaptic Networks...",
            "Diagnostic Telemetry Verified. Workspace Ready."
        )
    }

    var stepIndex by remember { mutableIntStateOf(0) }
    var progress by remember { mutableFloatStateOf(0f) }
    var isDone by remember { mutableStateOf(false) }

    val transition = rememberInfiniteTransition(label = "ekg")
    val time by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(20000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "time"
    )

    // Staged progress ticker
    LaunchedEffect(Unit) {
        val totalDuration = 2200L
        val interval = 40L
        val steps = totalDuration / interval
        for (i in 0..steps) {
            progress = (i.toFloat() / steps).coerceIn(0f, 1f)
            stepIndex = ((progress * telemetrySteps.size).toInt()).coerceAtMost(telemetrySteps.size - 1)
            delay(interval)
        }
        delay(300)
        isDone = true
        delay(200)
        onComplete()
    }

    // Synaptic nodes simulation
    val nodes = remember {
        val list = mutableListOf<SynapticPoint>()
        val rnd = java.util.Random(42)
        for (i in 0 until 35) {
            list.add(
                SynapticPoint(
                    x = rnd.nextFloat(),
                    y = rnd.nextFloat(),
                    vx = (rnd.nextFloat() - 0.5f) * 0.002f,
                    vy = (rnd.nextFloat() - 0.5f) * 0.002f,
                    radius = rnd.nextFloat() * 2.5f + 1.5f
                )
            )
        }
        list
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground),
        contentAlignment = Alignment.Center
    ) {
        // 1. Dynamic Canvas: Synaptic Mesh & Medical EKG Waveform
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            // Coordinate grid
            val gridSize = 60.dp.toPx()
            val gridColor = Color(0x0A22D3EE)
            var gx = 0f
            while (gx < width) {
                drawLine(gridColor, Offset(gx, 0f), Offset(gx, height), strokeWidth = 1f)
                gx += gridSize
            }
            var gy = 0f
            while (gy < height) {
                drawLine(gridColor, Offset(0f, gy), Offset(width, gy), strokeWidth = 1f)
                gy += gridSize
            }

            // Synaptic Nodes & Filaments
            for (i in nodes.indices) {
                val n1 = nodes[i]
                n1.x = (n1.x + n1.vx + 1f) % 1f
                n1.y = (n1.y + n1.vy + 1f) % 1f
                val p1 = Offset(n1.x * width, n1.y * height)

                drawCircle(
                    color = PrimaryCyan.copy(alpha = 0.35f),
                    radius = n1.radius.dp.toPx(),
                    center = p1
                )

                for (j in i + 1 until nodes.size) {
                    val n2 = nodes[j]
                    val p2 = Offset(n2.x * width, n2.y * height)
                    val dx = p1.x - p2.x
                    val dy = p1.y - p2.y
                    val distSq = dx * dx + dy * dy
                    val maxDist = 120.dp.toPx()
                    if (distSq < maxDist * maxDist) {
                        val alpha = (1f - (distSq / (maxDist * maxDist))) * 0.2f
                        drawLine(
                            color = PrimaryCyan.copy(alpha = alpha),
                            start = p1,
                            end = p2,
                            strokeWidth = 1.2f
                        )
                    }
                }
            }

            // Medical EKG Pulse Line across lower third
            val ekgY = height * 0.72f
            val ekgPath = Path()
            val ekgPoints = listOf(0f, 0f, 0f, 0.05f, -0.05f, 0f, 0.18f, -0.85f, 0.95f, -0.2f, 0f, 0.2f, 0.05f, 0f, 0f)
            val ekgOffset = (time * 160f) % width

            var first = true
            var x = 0f
            while (x < width) {
                val cycleX = ((x + ekgOffset) % 260f)
                val idx = (cycleX / 260f * ekgPoints.size).toInt().coerceIn(0, ekgPoints.size - 1)
                val nextIdx = (idx + 1) % ekgPoints.size
                val frac = (cycleX / 260f * ekgPoints.size) - idx
                val yAmp = (ekgPoints[idx] * (1f - frac) + ekgPoints[nextIdx] * frac) * 35.dp.toPx()
                val plotY = ekgY + yAmp

                if (first) {
                    ekgPath.moveTo(x, plotY)
                    first = false
                } else {
                    ekgPath.lineTo(x, plotY)
                }
                x += 5f
            }

            drawPath(
                path = ekgPath,
                color = PrimaryCyan.copy(alpha = 0.5f),
                style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
            )

            // Glowing Leading Cursor
            val cursorX = (ekgOffset * 1.3f) % width
            drawCircle(
                color = CyanGlow,
                radius = 4.dp.toPx(),
                center = Offset(cursorX, ekgY)
            )
            drawCircle(
                color = PrimaryCyan.copy(alpha = 0.25f),
                radius = 12.dp.toPx(),
                center = Offset(cursorX, ekgY)
            )
        }

        // 2. Central Medical Emblem & Telemetry
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            // Hexagon / Cross Emblem
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(90.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(Color(0xFF111827))
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        color = PrimaryCyan.copy(alpha = 0.2f),
                        radius = size.minDimension / 2.2f
                    )
                }
                Text(
                    text = "A+",
                    color = CyanGlow,
                    fontSize = 38.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "A+ is Impossible",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp
            )

            Text(
                text = "Professional Medical Question-Bank",
                color = Color(0xFF9CA3AF),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(36.dp))

            // Progress Bar
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth(0.68f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = PrimaryCyan,
                trackColor = Color(0xFF1F2937)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Telemetry message
            Text(
                text = telemetrySteps[stepIndex],
                color = PrimaryCyan.copy(alpha = 0.85f),
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Normal,
                modifier = Modifier.alpha(0.9f)
            )
        }
    }
}
