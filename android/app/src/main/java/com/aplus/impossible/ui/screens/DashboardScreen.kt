package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.AcademicCurriculum
import com.aplus.impossible.data.model.DeckEntity
import com.aplus.impossible.ui.components.CircularProgressRing
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.AppScreen
import com.aplus.impossible.ui.viewmodel.AppTab
import com.aplus.impossible.ui.viewmodel.MainViewModel

@Composable
fun DashboardScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val decks by viewModel.decks.collectAsState()
    val attempts by viewModel.attempts.collectAsState()
    val activeSession by viewModel.activeSession.collectAsState()
    val profile by viewModel.userProfile.collectAsState()
    val allStatuses by viewModel.allStatuses.collectAsState()

    val totalSolved = attempts.size
    val correctCount = attempts.count { it.isCorrect }
    val overallAccuracy = if (totalSolved > 0) (correctCount * 100) / totalSolved else 0

    val favoritesCount = allStatuses.count { it.isFavorite }
    val flaggedCount = allStatuses.count { it.isFlagged }
    val incorrectCount = allStatuses.count { it.isIncorrect }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Header Greeting & Profile
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = profile?.name ?: "Dr. Medical Student",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color.White
                    )
                    Text(
                        text = "${profile?.academicYear ?: "Year 2"} • Egyptian Faculty of Medicine",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondaryDark
                    )
                }
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(PrimaryCyan.copy(alpha = 0.2f))
                        .border(1.5.dp, PrimaryCyan, CircleShape)
                ) {
                    Text(
                        text = "A+",
                        color = CyanGlow,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
            }
        }

        // 2. Active Session Resume Card (if active session exists)
        if (activeSession != null) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFF0E3A4B), Color(0xFF134E4A))
                            )
                        )
                        .border(1.dp, PrimaryCyan.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .clickable { viewModel.resumeActiveSession() }
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(CyanGlow)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "STUDY SESSION IN PROGRESS",
                                    color = CyanGlow,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = activeSession?.sessionTitle ?: "Study Session",
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Question ${(activeSession?.currentIndex ?: 0) + 1} of ${activeSession?.questionIds?.size ?: 0}",
                                color = Color(0xFFE0F2FE),
                                fontSize = 13.sp
                            )
                        }

                        Button(
                            onClick = { viewModel.resumeActiveSession() },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = DarkBackground)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Resume", color = DarkBackground, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 3. Performance Metrics
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Accuracy Ring Card
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(16.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Overall Accuracy",
                            color = TextSecondaryDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        CircularProgressRing(
                            percentage = overallAccuracy,
                            size = 80.dp,
                            strokeWidth = 7.dp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "$correctCount / $totalSolved Correct",
                            color = TextMutedDark,
                            fontSize = 11.sp
                        )
                    }
                }

                // Quick Stats Column
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatMetricTile(
                        icon = Icons.Outlined.CollectionsBookmark,
                        iconTint = PrimaryCyan,
                        label = "Active Decks",
                        value = "${decks.size}"
                    )
                    StatMetricTile(
                        icon = Icons.Outlined.CheckCircle,
                        iconTint = SuccessGreen,
                        label = "Questions Solved",
                        value = "$totalSolved"
                    )
                }
            }
        }

        // 4. Quick Actions
        item {
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickActionCard(
                    title = "Import Lecture",
                    subtitle = "DOCX, TXT, JSON",
                    icon = Icons.Outlined.UploadFile,
                    tint = PrimaryCyan,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.navigateTo(AppScreen.ImportWizard()) }
                )
                QuickActionCard(
                    title = "Library",
                    subtitle = "Browse Decks",
                    icon = Icons.Outlined.Folder,
                    tint = PrimaryTeal,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.setTab(AppTab.LIBRARY) }
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                QuickActionCard(
                    title = "Collections",
                    subtitle = "$favoritesCount ★ • $flaggedCount ⚑",
                    icon = Icons.Outlined.Bookmark,
                    tint = WarningAmber,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.setTab(AppTab.COLLECTIONS) }
                )
                QuickActionCard(
                    title = "Weak Areas",
                    subtitle = "$incorrectCount to review",
                    icon = Icons.Outlined.ErrorOutline,
                    tint = ErrorRed,
                    modifier = Modifier.weight(1f),
                    onClick = { viewModel.setTab(AppTab.COLLECTIONS) }
                )
            }
        }

        // 5. Predefined Modules Overview
        item {
            Text(
                text = "Year 2 Modules",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }

        item {
            val modules = AcademicCurriculum.getModulesForYear("Year 2")
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(modules) { moduleName ->
                    val moduleDecks = decks.filter { it.module.equals(moduleName, ignoreCase = true) }
                    val qCount = moduleDecks.sumOf { it.questionCount }

                    Card(
                        modifier = Modifier
                            .width(160.dp)
                            .clickable { viewModel.setTab(AppTab.LIBRARY) },
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        shape = RoundedCornerShape(14.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = moduleName,
                                color = CyanGlow,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${moduleDecks.size} Lecture Decks",
                                color = TextSecondaryDark,
                                fontSize = 12.sp
                            )
                            Text(
                                text = "$qCount Questions",
                                color = TextMutedDark,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }
        }

        // 6. Recent Decks
        if (decks.isNotEmpty()) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Decks",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                    TextButton(onClick = { viewModel.setTab(AppTab.LIBRARY) }) {
                        Text("View All", color = PrimaryCyan)
                    }
                }
            }

            items(decks.take(4)) { deck ->
                DeckListItemCard(
                    deck = deck,
                    onOpenDetail = { viewModel.navigateTo(AppScreen.DeckDetail(deck.id)) },
                    onStartStudy = {
                        viewModel.startStudySession(
                            deckIds = listOf(deck.id),
                            sessionTitle = deck.lectureName.ifEmpty { deck.title }
                        )
                    }
                )
            }
        }
    }
}

@Composable
fun StatMetricTile(
    icon: ImageVector,
    iconTint: Color,
    label: String,
    value: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(14.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconTint.copy(alpha = 0.15f))
            ) {
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = value, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(text = label, color = TextSecondaryDark, fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun QuickActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(14.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(tint.copy(alpha = 0.15f))
            ) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(text = title, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                Text(text = subtitle, color = TextSecondaryDark, fontSize = 11.sp)
            }
        }
    }
}

@Composable
fun DeckListItemCard(
    deck: DeckEntity,
    onOpenDetail: () -> Unit,
    onStartStudy: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpenDetail() },
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(14.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = deck.subject,
                        color = PrimaryTeal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(text = " • ", color = TextMutedDark, fontSize = 11.sp)
                    Text(
                        text = deck.module,
                        color = TextSecondaryDark,
                        fontSize = 11.sp
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = deck.lectureName.ifEmpty { deck.title },
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${deck.questionCount} Questions",
                        color = TextMutedDark,
                        fontSize = 12.sp
                    )
                    if (deck.bestScore != null) {
                        Text(text = " • ", color = TextMutedDark, fontSize = 12.sp)
                        Text(
                            text = "Best: ${deck.bestScore}%",
                            color = if (deck.bestScore >= 70) SuccessGreen else WarningAmber,
                            fontWeight = FontWeight.Medium,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            IconButton(
                onClick = onStartStudy,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = PrimaryCyan.copy(alpha = 0.15f),
                    contentColor = PrimaryCyan
                )
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = "Study")
            }
        }
    }
}
