package com.aplus.impossible.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
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
import kotlinx.coroutines.launch
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
    val coroutineScope = rememberCoroutineScope()
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
    var isWaitingForTap by remember { mutableStateOf(false) }
    var isTransitioningOut by remember { mutableStateOf(false) }

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

    // Gentle breathing pulse for the Ready State prompt
    val pulseAlpha by transition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    // Smooth exit transition spec
    val screenAlpha by animateFloatAsState(
        targetValue = if (isTransitioningOut) 0f else 1f,
        animationSpec = tween(420, easing = FastOutSlowInEasing),
        label = "screenAlpha"
    )
    val screenScale by animateFloatAsState(
        targetValue = if (isTransitioningOut) 1.04f else 1f,
        animationSpec = tween(420, easing = FastOutSlowInEasing),
        label = "screenScale"
    )

    // Staged progress ticker
    LaunchedEffect(Unit) {
        val totalDuration = 2000L
        val interval = 40L
        val steps = totalDuration / interval
        for (i in 0..steps) {
            progress = (i.toFloat() / steps).coerceIn(0f, 1f)
            stepIndex = ((progress * telemetrySteps.size).toInt()).coerceAtMost(telemetrySteps.size - 1)
            delay(interval)
        }
        delay(200)
        isDone = true
        isWaitingForTap = true
        // Do NOT automatically call onComplete() — Wait for user interaction!
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
            .alpha(screenAlpha)
            .scale(screenScale)
            .background(DarkBackground)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                if (isWaitingForTap && !isTransitioningOut) {
                    isTransitioningOut = true
                    coroutineScope.launch {
                        delay(420)
                        onComplete()
                    }
                } else if (!isWaitingForTap) {
                    // Tap to skip calibration and immediately ready the platform
                    progress = 1f
                    isDone = true
                    isWaitingForTap = true
                }
            },
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
                    val dist = kotlin.math.sqrt(dx * dx + dy * dy)
                    val maxDist = 90.dp.toPx()
                    if (dist < maxDist) {
                        val alpha = (1f - dist / maxDist) * 0.2f
                        drawLine(
                            color = PrimaryCyan.copy(alpha = alpha),
                            start = p1,
                            end = p2,
                            strokeWidth = 1f
                        )
                    }
                }
            }

            // EKG Waveform Sweep
            val baselineY = height * 0.72f
            val ekgPath = Path()
            ekgPath.moveTo(0f, baselineY)

            val sweepPeriod = 240.dp.toPx()
            var x = 0f
            while (x < width) {
                val relX = (x + time * 3f) % sweepPeriod
                val yOffset = when {
                    relX < sweepPeriod * 0.35f -> 0f
                    relX < sweepPeriod * 0.40f -> -12.dp.toPx() * sin(((relX - sweepPeriod * 0.35f) / (sweepPeriod * 0.05f)) * Math.PI).toFloat()
                    relX < sweepPeriod * 0.43f -> 10.dp.toPx()
                    relX < sweepPeriod * 0.47f -> -70.dp.toPx()
                    relX < sweepPeriod * 0.52f -> 30.dp.toPx()
                    relX < sweepPeriod * 0.58f -> 0f
                    relX < sweepPeriod * 0.68f -> -20.dp.toPx() * sin(((relX - sweepPeriod * 0.58f) / (sweepPeriod * 0.10f)) * Math.PI).toFloat()
                    else -> 0f
                }
                ekgPath.lineTo(x, baselineY + yOffset)
                x += 4.dp.toPx()
            }

            drawPath(
                path = ekgPath,
                color = PrimaryTeal.copy(alpha = 0.45f),
                style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
            )

            // Glowing cursor head
            val cursorX = (time * 3f) % width
            val cursorRelX = cursorX % sweepPeriod
            val cursorYOffset = when {
                cursorRelX < sweepPeriod * 0.35f -> 0f
                cursorRelX < sweepPeriod * 0.40f -> -12.dp.toPx() * sin(((cursorRelX - sweepPeriod * 0.35f) / (sweepPeriod * 0.05f)) * Math.PI).toFloat()
                cursorRelX < sweepPeriod * 0.43f -> 10.dp.toPx()
                cursorRelX < sweepPeriod * 0.47f -> -70.dp.toPx()
                cursorRelX < sweepPeriod * 0.52f -> 30.dp.toPx()
                cursorRelX < sweepPeriod * 0.58f -> 0f
                cursorRelX < sweepPeriod * 0.68f -> -20.dp.toPx() * sin(((cursorRelX - sweepPeriod * 0.58f) / (sweepPeriod * 0.10f)) * Math.PI).toFloat()
                else -> 0f
            }
            val ekgY = baselineY + cursorYOffset

            drawCircle(
                color = PrimaryCyan,
                radius = 4.dp.toPx(),
                center = Offset(cursorX, ekgY)
            )
            drawCircle(
                color = PrimaryCyan.copy(alpha = 0.25f),
                radius = 12.dp.toPx(),
                center = Offset(cursorX, ekgY)
            )
        }

        // Top Status Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter)
                .padding(horizontal = 24.dp, vertical = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(if (isWaitingForTap) Color(0xFF34D399) else PrimaryCyan)
                )
                Text(
                    text = "A+ IS IMPOSSIBLE",
                    color = PrimaryCyan,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isWaitingForTap) Color(0x1A10B981) else Color(0x1A06B6D4))
                    .border(
                        1.dp,
                        if (isWaitingForTap) Color(0x4D10B981) else Color(0x3306B6D4),
                        RoundedCornerShape(12.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(
                    text = if (isWaitingForTap) "100% READY" else "${(progress * 100).toInt()}%",
                    color = if (isWaitingForTap) Color(0xFF34D399) else PrimaryCyan,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // 2. Central Medical Emblem & Continuation Prompt
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            // Hexagon / Cross Emblem with Glow
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(92.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(Color(0xFF0F172A))
                    .border(1.dp, Color(0x3306B6D4), RoundedCornerShape(26.dp))
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(PrimaryCyan.copy(alpha = 0.3f), Color.Transparent),
                            radius = size.minDimension / 1.5f
                        )
                    )
                }
                Text(
                    text = "A+",
                    color = CyanGlow,
                    fontSize = 40.sp,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = FontFamily.SansSerif
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "A+ is Impossible",
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp
            )

            Text(
                text = "Professional Medical Question-Bank",
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(36.dp))

            if (!isWaitingForTap) {
                // Progress Bar
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth(0.68f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp)),
                    color = PrimaryCyan,
                    trackColor = Color(0xFF1E293B)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Telemetry message
                Text(
                    text = telemetrySteps[stepIndex],
                    color = PrimaryCyan.copy(alpha = 0.85f),
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Normal,
                    modifier = Modifier.alpha(0.9f)
                )
            } else {
                // ELEGANT READY STATE CONTINUATION PROMPT
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.alpha(pulseAlpha)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color(0xFF0F172A).copy(alpha = 0.75f))
                            .border(1.dp, PrimaryCyan.copy(alpha = 0.45f), RoundedCornerShape(24.dp))
                            .padding(horizontal = 24.dp, vertical = 14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF34D399))
                            )
                            Text(
                                text = "Tap Anywhere To Continue",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 0.3.sp
                            )
                            Text(
                                text = "→",
                                color = PrimaryCyan,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Text(
                        text = "ENTER A+ IS IMPOSSIBLE • WORKSPACE PRIMED",
                        color = Color(0xFF64748B),
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.2.sp
                    )
                }
            }
        }

        // Bottom Footer
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = if (isWaitingForTap) "Tap anywhere to enter the platform" else "Tap to skip calibration",
                color = Color(0xFF475569),
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}
