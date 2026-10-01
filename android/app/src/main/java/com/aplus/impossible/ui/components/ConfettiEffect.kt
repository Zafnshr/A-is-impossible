package com.aplus.impossible.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import kotlin.random.Random

data class Particle(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    val color: Color,
    val size: Float,
    var rotation: Float,
    val vRotation: Float
)

@Composable
fun ConfettiEffect(
    modifier: Modifier = Modifier,
    durationMs: Int = 3000
) {
    val colors = listOf(
        Color(0xFF06B6D4), // Cyan
        Color(0xFF14B8A6), // Teal
        Color(0xFF10B981), // Emerald
        Color(0xFFF59E0B), // Amber
        Color(0xFF6366F1), // Indigo
        Color(0xFFA855F7), // Purple
        Color(0xFFEC4899)  // Pink
    )

    val particles = remember {
        val list = mutableListOf<Particle>()
        val rnd = Random(System.currentTimeMillis())
        for (i in 0 until 120) {
            val angle = rnd.nextFloat() * Math.PI.toFloat() * 2f
            val speed = rnd.nextFloat() * 12f + 4f
            list.add(
                Particle(
                    x = 0.5f,
                    y = 0.35f,
                    vx = kotlin.math.cos(angle) * speed,
                    vy = kotlin.math.sin(angle) * speed - 6f,
                    color = colors[rnd.nextInt(colors.size)],
                    size = rnd.nextFloat() * 10f + 6f,
                    rotation = rnd.nextFloat() * 360f,
                    vRotation = (rnd.nextFloat() - 0.5f) * 15f
                )
            )
        }
        list
    }

    val transition = rememberInfiniteTransition(label = "confetti")
    val frame by transition.animateFloat(
        initialValue = 0f,
        targetValue = 100f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMs, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "frame"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val width = size.width
        val height = size.height

        for (p in particles) {
            p.x += (p.vx / width)
            p.y += (p.vy / height)
            p.vy += 0.35f // Gravity
            p.rotation += p.vRotation

            val px = p.x * width
            val py = p.y * height

            if (py < height && px in 0f..width) {
                rotate(p.rotation, pivot = Offset(px, py)) {
                    drawRect(
                        color = p.color,
                        topLeft = Offset(px - p.size / 2, py - p.size / 2),
                        size = Size(p.size, p.size * 0.7f)
                    )
                }
            }
        }
    }
}
