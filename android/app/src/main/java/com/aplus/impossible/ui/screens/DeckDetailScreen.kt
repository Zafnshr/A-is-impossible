package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.QuestionEntity
import com.aplus.impossible.data.model.ShuffleOptions
import com.aplus.impossible.ui.components.QuestionTypeBadge
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.AppScreen
import com.aplus.impossible.ui.viewmodel.MainViewModel

@Composable
fun DeckDetailScreen(
    deckId: String,
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val decks by viewModel.decks.collectAsState()
    val deck = decks.find { it.id == deckId }

    var questions by remember { mutableStateOf<List<QuestionEntity>>(emptyList()) }
    var showStudySetup by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(deckId) {
        questions = viewModel.getQuestionsByDeck(deckId)
    }

    // Study setup state
    var selectedOrderMode by remember { mutableStateOf("sequential") }
    var shuffleQuestions by remember { mutableStateOf(false) }
    var shuffleAnswers by remember { mutableStateOf(false) }
    var timerType by remember { mutableStateOf("stopwatch") }
    var countdownMinutes by remember { mutableIntStateOf(30) }

    if (deck == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = PrimaryCyan)
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = deck.lectureName.ifEmpty { deck.title },
                        maxLines = 1,
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { viewModel.navigateBack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.navigateTo(AppScreen.QuestionEditor(deckId)) }) {
                        Icon(Icons.Outlined.Edit, contentDescription = "Edit Deck", tint = Color.White)
                    }
                    IconButton(onClick = { showDeleteConfirm = true }) {
                        Icon(Icons.Outlined.Delete, contentDescription = "Delete Deck", tint = ErrorRed)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        containerColor = DarkBackground
    ) { padding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 90.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Deck Hero Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(16.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(DarkCardBorder, DarkCardBorder)))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "${deck.year} • ${deck.module} • ${deck.subject}",
                                color = PrimaryTeal,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = deck.lectureName.ifEmpty { deck.title },
                            style = MaterialTheme.typography.titleLarge,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        if (!deck.description.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = deck.description,
                                color = TextSecondaryDark,
                                fontSize = 13.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Stats Grid
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            MiniStatBox(label = "Questions", value = "${deck.questionCount}", modifier = Modifier.weight(1f))
                            MiniStatBox(
                                label = "Best Score",
                                value = if (deck.bestScore != null) "${deck.bestScore}%" else "—",
                                valueColor = if ((deck.bestScore ?: 0) >= 70) SuccessGreen else CyanGlow,
                                modifier = Modifier.weight(1f)
                            )
                            MiniStatBox(
                                label = "Avg Score",
                                value = if (deck.averageScore != null) "${deck.averageScore}%" else "—",
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Primary Action: Start Study Session
                        Button(
                            onClick = { showStudySetup = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = DarkBackground)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Start Study Session",
                                color = DarkBackground,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                    }
                }
            }

            // 2. Questions List Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Questions in Deck (${questions.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                    TextButton(onClick = { viewModel.navigateTo(AppScreen.QuestionEditor(deckId)) }) {
                        Text("Add / Edit", color = PrimaryCyan)
                    }
                }
            }

            itemsIndexed(questions) { index, q ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Q${index + 1}",
                                color = CyanGlow,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                            QuestionTypeBadge(type = q.type, short = true)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = q.question,
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            lineHeight = 20.sp
                        )
                        if (q.options.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            q.options.take(4).forEachIndexed { optIdx, opt ->
                                val isCorrect = q.correctAnswers.contains(optIdx)
                                Text(
                                    text = "${('A'.code + optIdx).toChar()}) $opt",
                                    color = if (isCorrect) SuccessGreen else TextSecondaryDark,
                                    fontSize = 12.sp,
                                    fontWeight = if (isCorrect) FontWeight.SemiBold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Move Deck to Trash?", color = Color.White) },
            text = {
                Text(
                    "This lecture deck and its questions will be moved to the Trash Center. You can restore it anytime.",
                    color = TextSecondaryDark
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirm = false
                        viewModel.deleteDeck(deckId)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                ) {
                    Text("Move to Trash", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel", color = TextSecondaryDark)
                }
            },
            containerColor = DarkSurface
        )
    }

    // Study Setup Modal
    if (showStudySetup) {
        AlertDialog(
            onDismissRequest = { showStudySetup = false },
            title = { Text("Configure Study Session", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Question Order", color = TextSecondaryDark, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = selectedOrderMode == "sequential",
                            onClick = { selectedOrderMode = "sequential" },
                            label = { Text("Sequential") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PrimaryCyan, selectedLabelColor = DarkBackground)
                        )
                        FilterChip(
                            selected = selectedOrderMode == "shuffled",
                            onClick = { selectedOrderMode = "shuffled" },
                            label = { Text("Shuffled") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PrimaryCyan, selectedLabelColor = DarkBackground)
                        )
                    }

                    if (selectedOrderMode == "shuffled") {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(
                                checked = shuffleAnswers,
                                onCheckedChange = { shuffleAnswers = it },
                                colors = CheckboxDefaults.colors(checkedColor = PrimaryCyan)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Randomize MCQ option choices", color = Color.White, fontSize = 13.sp)
                        }
                    }

                    HorizontalDivider(color = DarkCardBorder)

                    Text("Timer Mode", color = TextSecondaryDark, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = timerType == "stopwatch",
                            onClick = { timerType = "stopwatch" },
                            label = { Text("Stopwatch") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PrimaryCyan, selectedLabelColor = DarkBackground)
                        )
                        FilterChip(
                            selected = timerType == "countdown",
                            onClick = { timerType = "countdown" },
                            label = { Text("Countdown (30m)") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PrimaryCyan, selectedLabelColor = DarkBackground)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showStudySetup = false
                        viewModel.startStudySession(
                            deckIds = listOf(deckId),
                            sessionTitle = deck.lectureName.ifEmpty { deck.title },
                            orderMode = selectedOrderMode,
                            shuffleOptions = ShuffleOptions(
                                shuffleQuestions = selectedOrderMode == "shuffled",
                                shuffleAnswers = shuffleAnswers
                            ),
                            timerType = timerType,
                            countdownMinutes = countdownMinutes
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                ) {
                    Text("Start Now", color = DarkBackground, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showStudySetup = false }) {
                    Text("Cancel", color = TextSecondaryDark)
                }
            },
            containerColor = DarkSurface
        )
    }
}

@Composable
fun MiniStatBox(
    label: String,
    value: String,
    valueColor: Color = Color.White,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(DarkBackground)
            .padding(vertical = 10.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = value, color = valueColor, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = label, color = TextMutedDark, fontSize = 11.sp)
        }
    }
}
