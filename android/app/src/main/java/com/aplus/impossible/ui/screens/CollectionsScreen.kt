package com.aplus.impossible.ui.screens

import androidx.compose.foundation.BorderStroke

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
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
import com.aplus.impossible.ui.components.QuestionTypeBadge
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel

@Composable
fun CollectionsScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val allStatuses by viewModel.allStatuses.collectAsState()
    val decks by viewModel.decks.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Favorites, 1: Flagged, 2: Incorrect

    val favoriteIds = remember(allStatuses) { allStatuses.filter { it.isFavorite }.map { it.questionId }.toSet() }
    val flaggedIds = remember(allStatuses) { allStatuses.filter { it.isFlagged }.map { it.questionId }.toSet() }
    val incorrectIds = remember(allStatuses) { allStatuses.filter { it.isIncorrect }.map { it.questionId }.toSet() }

    val activeIds = when (selectedTab) {
        0 -> favoriteIds
        1 -> flaggedIds
        else -> incorrectIds
    }

    var questionsList by remember { mutableStateOf<List<QuestionEntity>>(emptyList()) }

    LaunchedEffect(activeIds) {
        if (activeIds.isNotEmpty()) {
            questionsList = viewModel.getQuestionsByIds(activeIds.toList())
        } else {
            questionsList = emptyList()
        }
    }

    val tabTitle = when (selectedTab) {
        0 -> "Starred Questions"
        1 -> "Flagged for Review"
        else -> "Incorrect Questions"
    }

    Scaffold(
        floatingActionButton = {
            if (activeIds.isNotEmpty()) {
                FloatingActionButton(
                    onClick = {
                        val relatedDecks = questionsList.map { it.deckId }.distinct()
                        viewModel.startStudySession(
                            deckIds = if (relatedDecks.isNotEmpty()) relatedDecks else decks.map { it.id },
                            sessionTitle = tabTitle,
                            mode = "collection"
                        )
                    },
                    containerColor = PrimaryCyan,
                    contentColor = DarkBackground,
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Study Collection (${activeIds.size})", fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        containerColor = DarkBackground
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Tabs Row
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = DarkSurface,
                contentColor = PrimaryCyan,
                divider = { HorizontalDivider(color = DarkCardBorder) }
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Favorites (${favoriteIds.size})")
                        }
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Flag, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Flagged (${flaggedIds.size})")
                        }
                    }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Cancel, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Incorrect (${incorrectIds.size})")
                        }
                    }
                )
            }

            if (activeIds.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = when (selectedTab) {
                                0 -> Icons.Outlined.StarOutline
                                1 -> Icons.Outlined.Flag
                                else -> Icons.Outlined.CheckCircle
                            },
                            contentDescription = null,
                            tint = TextMutedDark,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = when (selectedTab) {
                                0 -> "No Starred Questions"
                                1 -> "No Flagged Questions"
                                else -> "Zero Incorrect Questions!"
                            },
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = when (selectedTab) {
                                0 -> "Tap the star icon while studying to bookmark high-yield questions."
                                1 -> "Flag confusing questions to revisit before exams."
                                else -> "Any questions you answer incorrectly will automatically appear here."
                            },
                            color = TextSecondaryDark,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 20.dp)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 90.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "$tabTitle (${activeIds.size} questions ready for recall)",
                            color = TextSecondaryDark,
                            fontSize = 13.sp
                        )
                    }

                    items(questionsList) { question ->
                        val status = allStatuses.find { it.questionId == question.id }
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = DarkSurface),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, DarkCardBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    QuestionTypeBadge(type = question.type, short = true)
                                    Row {
                                        IconButton(
                                            onClick = { viewModel.toggleFavorite(question.id) },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (status?.isFavorite == true) Icons.Default.Star else Icons.Outlined.StarOutline,
                                                contentDescription = null,
                                                tint = WarningAmber,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        IconButton(
                                            onClick = { viewModel.toggleFlagged(question.id) },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (status?.isFlagged == true) Icons.Default.Flag else Icons.Outlined.Flag,
                                                contentDescription = null,
                                                tint = WarningAmber,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = question.question,
                                    color = Color.White,
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 14.sp,
                                    lineHeight = 20.sp
                                )

                                if (!status?.userNote.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Surface(
                                        color = DarkBackground,
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = "Note: ${status?.userNote}",
                                            color = WarningAmber,
                                            fontSize = 12.sp,
                                            modifier = Modifier.padding(6.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
