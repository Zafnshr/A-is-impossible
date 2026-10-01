package com.aplus.impossible.ui.screens

import androidx.compose.foundation.BorderStroke

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.*
import com.aplus.impossible.ui.components.QuestionTypeBadge
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudySessionScreen(
    sessionTitle: String,
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val questions by viewModel.studyQuestions.collectAsState()
    val currentIndex by viewModel.currentQuestionIndex.collectAsState()
    val answers by viewModel.studyAnswers.collectAsState()
    val submitted by viewModel.studySubmitted.collectAsState()
    val revealed by viewModel.studyRevealed.collectAsState()
    val timerSeconds by viewModel.timerSeconds.collectAsState()
    val timerRunning by viewModel.timerRunning.collectAsState()
    val allStatuses by viewModel.allStatuses.collectAsState()
    val sessionSummary by viewModel.sessionSummary.collectAsState()

    var showQuestionMap by remember { mutableStateOf(false) }
    var showExitDialog by remember { mutableStateOf(false) }
    var showNoteDialog by remember { mutableStateOf(false) }
    var currentNoteText by remember { mutableStateOf("") }

    val currentQuestion = questions.getOrNull(currentIndex)
    val statusMap = remember(allStatuses) { allStatuses.associateBy { it.questionId } }
    val currentStatus = currentQuestion?.let { statusMap[it.id] }
    val isFavorite = currentStatus?.isFavorite == true
    val isFlagged = currentStatus?.isFlagged == true

    // Timer Ticker
    LaunchedEffect(timerRunning) {
        while (timerRunning) {
            delay(1000)
            viewModel.tickTimer(1)
        }
    }

    // Touch swipe accumulator
    var totalDragX by remember { mutableFloatStateOf(0f) }

    if (currentQuestion == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = PrimaryCyan)
        }
        return
    }

    val isSubmitted = submitted[currentQuestion.id] == true
    val isRevealed = revealed[currentQuestion.id] == true
    val currentAns = answers[currentQuestion.id]

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = sessionTitle,
                            maxLines = 1,
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Question ${currentIndex + 1} of ${questions.size}",
                            color = PrimaryCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { showExitDialog = true }) {
                        Icon(Icons.Default.Close, contentDescription = "Exit", tint = Color.White)
                    }
                },
                actions = {
                    // Timer Badge with Play/Pause
                    val minutes = timerSeconds / 60
                    val secs = timerSeconds % 60
                    val timerStr = String.format("%02d:%02d", minutes, secs)

                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { viewModel.toggleTimerRunning() },
                        color = DarkSurface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                if (timerRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = CyanGlow,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(timerStr, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(modifier = Modifier.width(4.dp))

                    // Question Map Button
                    IconButton(onClick = { showQuestionMap = true }) {
                        Icon(Icons.Outlined.GridView, contentDescription = "Question Map", tint = CyanGlow)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        containerColor = DarkBackground
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .pointerInput(currentIndex) {
                    detectHorizontalDragGestures(
                        onDragEnd = {
                            if (totalDragX < -120f) {
                                viewModel.nextQuestion()
                            } else if (totalDragX > 120f) {
                                viewModel.previousQuestion()
                            }
                            totalDragX = 0f
                        },
                        onHorizontalDrag = { _, dragAmount ->
                            totalDragX += dragAmount
                        }
                    )
                }
        ) {
            // Linear Progress Indicator
            val progress = (currentIndex + 1).toFloat() / questions.size.coerceAtLeast(1)
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp),
                color = PrimaryCyan,
                trackColor = DarkCardBorder
            )

            // Content Area (Scrollable Question Stem & Options)
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 16.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Question Type & Action Bar (Favorite, Flag, Note)
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        QuestionTypeBadge(type = currentQuestion.type)

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Note
                            IconButton(onClick = {
                                currentNoteText = currentStatus?.userNote ?: ""
                                showNoteDialog = true
                            }) {
                                Icon(
                                    if (currentStatus?.userNote.isNullOrBlank()) Icons.Outlined.EditNote else Icons.Default.EditNote,
                                    contentDescription = "Note",
                                    tint = if (currentStatus?.userNote.isNullOrBlank()) TextMutedDark else CyanGlow
                                )
                            }
                            // Flag
                            IconButton(onClick = { viewModel.toggleFlagged(currentQuestion.id) }) {
                                Icon(
                                    if (isFlagged) Icons.Default.Flag else Icons.Outlined.Flag,
                                    contentDescription = "Flag",
                                    tint = if (isFlagged) WarningAmber else TextMutedDark
                                )
                            }
                            // Favorite
                            IconButton(onClick = { viewModel.toggleFavorite(currentQuestion.id) }) {
                                Icon(
                                    if (isFavorite) Icons.Default.Star else Icons.Outlined.StarOutline,
                                    contentDescription = "Favorite",
                                    tint = if (isFavorite) WarningAmber else TextMutedDark
                                )
                            }
                        }
                    }
                }

                // Case Vignette (if Case Study)
                if (currentQuestion.type == QuestionType.CASE_STUDY && !currentQuestion.caseVignette.isNullOrBlank()) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PurpleCase.copy(alpha = 0.1f)),
                            shape = RoundedCornerShape(14.dp),
                            border = BorderStroke(1.dp, PurpleCase.copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(
                                    text = "CLINICAL CASE VIGNETTE",
                                    color = PurpleCase,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = currentQuestion.caseVignette,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                }

                // Question Stem
                item {
                    Text(
                        text = currentQuestion.question,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontSize = 17.sp,
                        lineHeight = 24.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // Question Options / Inputs based on type
                when (currentQuestion.type) {
                    QuestionType.SINGLE_MCQ, QuestionType.TRUE_FALSE -> {
                        itemsIndexed(currentQuestion.options) { optIdx, optText ->
                            val isSelected = (currentAns as? Number)?.toInt() == optIdx
                            val isCorrectAnswer = currentQuestion.correctAnswers.contains(optIdx)
                            val showFeedback = isSubmitted || isRevealed

                            val (cardBg, borderColor, textColor) = when {
                                showFeedback && isCorrectAnswer -> Triple(SuccessGreen.copy(alpha = 0.2f), SuccessGreen, SuccessGreen)
                                showFeedback && isSelected && !isCorrectAnswer -> Triple(ErrorRed.copy(alpha = 0.2f), ErrorRed, ErrorRed)
                                isSelected -> Triple(PrimaryCyan.copy(alpha = 0.2f), PrimaryCyan, Color.White)
                                else -> Triple(DarkSurface, DarkCardBorder, Color.White)
                            }

                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        if (!isSubmitted) {
                                            viewModel.submitAnswer(currentQuestion.id, optIdx)
                                        }
                                    },
                                colors = CardDefaults.cardColors(containerColor = cardBg),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, borderColor)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val letter = ('A'.code + optIdx).toChar()
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(if (isSelected) PrimaryCyan else DarkBackground)
                                            .border(1.dp, borderColor, CircleShape)
                                    ) {
                                        Text(
                                            text = "$letter",
                                            color = if (isSelected) DarkBackground else TextSecondaryDark,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = optText,
                                        color = textColor,
                                        fontSize = 15.sp,
                                        modifier = Modifier.weight(1f)
                                    )
                                    if (showFeedback && isCorrectAnswer) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = "Correct", tint = SuccessGreen)
                                    } else if (showFeedback && isSelected && !isCorrectAnswer) {
                                        Icon(Icons.Default.Cancel, contentDescription = "Incorrect", tint = ErrorRed)
                                    }
                                }
                            }
                        }
                    }

                    QuestionType.MULTIPLE_MCQ -> {
                        item {
                            Text(
                                text = "Select all correct choices (${currentQuestion.correctAnswers.size} correct answers)",
                                color = IndigoAccent,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        itemsIndexed(currentQuestion.options) { optIdx, optText ->
                            val currentList = (currentAns as? List<*>)?.mapNotNull { (it as? Number)?.toInt() } ?: emptyList()
                            val isSelected = currentList.contains(optIdx)
                            val isCorrectAnswer = currentQuestion.correctAnswers.contains(optIdx)
                            val showFeedback = isSubmitted || isRevealed

                            val (cardBg, borderColor) = when {
                                showFeedback && isCorrectAnswer -> Pair(SuccessGreen.copy(alpha = 0.2f), SuccessGreen)
                                showFeedback && isSelected && !isCorrectAnswer -> Pair(ErrorRed.copy(alpha = 0.2f), ErrorRed)
                                isSelected -> Pair(IndigoAccent.copy(alpha = 0.2f), IndigoAccent)
                                else -> Pair(DarkSurface, DarkCardBorder)
                            }

                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        if (!isSubmitted) {
                                            val updated = if (isSelected) currentList - optIdx else currentList + optIdx
                                            viewModel.submitAnswer(currentQuestion.id, updated)
                                        }
                                    },
                                colors = CardDefaults.cardColors(containerColor = cardBg),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, borderColor)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Checkbox(
                                        checked = isSelected,
                                        onCheckedChange = null,
                                        colors = CheckboxDefaults.colors(checkedColor = IndigoAccent)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(text = optText, color = Color.White, fontSize = 15.sp, modifier = Modifier.weight(1f))
                                    if (showFeedback && isCorrectAnswer) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = "Correct", tint = SuccessGreen)
                                    }
                                }
                            }
                        }
                    }

                    QuestionType.MATCHING -> {
                        val pairs = currentQuestion.matchingPairs ?: emptyList()
                        item {
                            Text(
                                text = "Associate Column A with corresponding items in Column B",
                                color = PrimaryTeal,
                                fontSize = 12.sp
                            )
                        }
                        itemsIndexed(pairs) { pIdx, pair ->
                            val ansMap = (currentAns as? Map<*, *>) ?: emptyMap<String, String>()
                            val chosen = ansMap[pair.id] as? String
                            val isMatchCorrect = chosen == pair.right

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, DarkCardBorder)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(text = pair.left, color = CyanGlow, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        pairs.map { it.right }.forEach { rightOpt ->
                                            val isOptSelected = chosen == rightOpt
                                            FilterChip(
                                                selected = isOptSelected,
                                                onClick = {
                                                    val updatedMap = ansMap.toMutableMap()
                                                    updatedMap[pair.id] = rightOpt
                                                    viewModel.submitAnswer(currentQuestion.id, updatedMap)
                                                },
                                                label = { Text(rightOpt, fontSize = 12.sp) },
                                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = PrimaryTeal, selectedLabelColor = DarkBackground)
                                            )
                                        }
                                    }
                                    if (isSubmitted || isRevealed) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "Correct match: ${pair.right}",
                                            color = if (isMatchCorrect) SuccessGreen else ErrorRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    QuestionType.ORDERING -> {
                        val currentOrder = (currentAns as? List<*>)?.mapNotNull { (it as? Number)?.toInt() }
                            ?: currentQuestion.options.indices.toList()

                        item {
                            Text(text = "Arrange items in correct chronological or procedural sequence", color = WarningAmber, fontSize = 12.sp)
                        }
                        itemsIndexed(currentOrder) { pos, optIdx ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, DarkCardBorder)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .size(26.dp)
                                            .clip(CircleShape)
                                            .background(WarningAmber.copy(alpha = 0.2f))
                                    ) {
                                        Text(text = "${pos + 1}", color = WarningAmber, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(
                                        text = currentQuestion.options.getOrNull(optIdx) ?: "Step",
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        modifier = Modifier.weight(1f)
                                    )
                                    IconButton(
                                        onClick = {
                                            if (pos > 0) {
                                                val mutable = currentOrder.toMutableList()
                                                val temp = mutable[pos]
                                                mutable[pos] = mutable[pos - 1]
                                                mutable[pos - 1] = temp
                                                viewModel.submitAnswer(currentQuestion.id, mutable)
                                            }
                                        },
                                        enabled = pos > 0
                                    ) {
                                        Icon(Icons.Default.ArrowUpward, contentDescription = "Move Up", tint = if (pos > 0) Color.White else TextMutedDark)
                                    }
                                    IconButton(
                                        onClick = {
                                            if (pos < currentOrder.size - 1) {
                                                val mutable = currentOrder.toMutableList()
                                                val temp = mutable[pos]
                                                mutable[pos] = mutable[pos + 1]
                                                mutable[pos + 1] = temp
                                                viewModel.submitAnswer(currentQuestion.id, mutable)
                                            }
                                        },
                                        enabled = pos < currentOrder.size - 1
                                    ) {
                                        Icon(Icons.Default.ArrowDownward, contentDescription = "Move Down", tint = if (pos < currentOrder.size - 1) Color.White else TextMutedDark)
                                    }
                                }
                            }
                        }
                    }

                    QuestionType.CASE_STUDY -> {
                        val subQuestions = currentQuestion.subQuestions ?: emptyList()
                        itemsIndexed(subQuestions) { subIdx, subQ ->
                            val ansMap = (currentAns as? Map<*, *>) ?: emptyMap<String, Int>()
                            val chosenIdx = (ansMap[subQ.id] as? Number)?.toInt()

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, DarkCardBorder)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = "Sub-Question ${subIdx + 1}: ${subQ.question}",
                                        color = Color.White,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    subQ.options.forEachIndexed { optI, optT ->
                                        val isSubSelected = chosenIdx == optI
                                        val isSubCorrect = optI == subQ.correctAnswer
                                        val showSubFeedback = isSubmitted || isRevealed

                                        val optBg = when {
                                            showSubFeedback && isSubCorrect -> SuccessGreen.copy(alpha = 0.2f)
                                            showSubFeedback && isSubSelected && !isSubCorrect -> ErrorRed.copy(alpha = 0.2f)
                                            isSubSelected -> PurpleCase.copy(alpha = 0.2f)
                                            else -> DarkBackground
                                        }

                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 4.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(optBg)
                                                .clickable {
                                                    val updatedMap = ansMap.toMutableMap()
                                                    updatedMap[subQ.id] = optI
                                                    viewModel.submitAnswer(currentQuestion.id, updatedMap)
                                                }
                                                .padding(10.dp)
                                        ) {
                                            Text(
                                                text = "${('A'.code + optI).toChar()}) $optT",
                                                color = if (showSubFeedback && isSubCorrect) SuccessGreen else Color.White,
                                                fontSize = 13.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Explanation & High Yield Notes section
                if (isRevealed || isSubmitted) {
                    if (!currentQuestion.explanation.isNullOrBlank()) {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, PrimaryCyan.copy(alpha = 0.35f))
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Lightbulb, contentDescription = null, tint = CyanGlow, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Clinical Explanation",
                                            color = CyanGlow,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = currentQuestion.explanation,
                                        color = TextSecondaryDark,
                                        fontSize = 14.sp,
                                        lineHeight = 20.sp
                                    )
                                }
                            }
                        }
                    }

                    if (!currentQuestion.highYieldNotes.isNullOrBlank()) {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = WarningAmber.copy(alpha = 0.1f)),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, WarningAmber.copy(alpha = 0.35f))
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Bolt, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "High-Yield Clinical Pearl",
                                            color = WarningAmber,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = currentQuestion.highYieldNotes,
                                        color = Color.White,
                                        fontSize = 14.sp,
                                        lineHeight = 20.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Bottom Navigation & Actions Bar
            Surface(
                color = DarkSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Previous Question
                    IconButton(
                        onClick = { viewModel.previousQuestion() },
                        enabled = currentIndex > 0
                    ) {
                        Icon(
                            Icons.Default.ChevronLeft,
                            contentDescription = "Previous",
                            tint = if (currentIndex > 0) Color.White else TextMutedDark
                        )
                    }

                    // Reveal Answer / Reset
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = {
                                if (isRevealed) viewModel.resetQuestion(currentQuestion.id)
                                else viewModel.revealAnswer(currentQuestion.id)
                            },
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isRevealed) WarningAmber else DarkCardBorder)
                        ) {
                            Text(
                                text = if (isRevealed) "Hide" else "Reveal",
                                color = if (isRevealed) WarningAmber else Color.White,
                                fontSize = 13.sp
                            )
                        }

                        if (currentIndex == questions.size - 1) {
                            Button(
                                onClick = { viewModel.finishSession() },
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Complete", color = DarkBackground, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Next Question
                    IconButton(
                        onClick = { viewModel.nextQuestion() },
                        enabled = currentIndex < questions.size - 1
                    ) {
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = "Next",
                            tint = if (currentIndex < questions.size - 1) Color.White else TextMutedDark
                        )
                    }
                }
            }
        }
    }

    // Question Map Bottom Sheet
    if (showQuestionMap) {
        QuestionMapBottomSheet(
            questions = questions,
            currentIndex = currentIndex,
            submittedMap = submitted,
            answersMap = answers,
            evaluateCorrectness = { q, a -> viewModel.evaluateCorrectness(q, a) },
            statuses = allStatuses,
            onJump = { idx -> viewModel.jumpToQuestion(idx) },
            onDismiss = { showQuestionMap = false }
        )
    }

    // Exit Confirmation Dialog
    if (showExitDialog) {
        AlertDialog(
            onDismissRequest = { showExitDialog = false },
            title = { Text("Exit Study Session?", color = Color.White) },
            text = {
                Text(
                    "You can save your current progress to resume later, or finish the session now to record your results.",
                    color = TextSecondaryDark
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showExitDialog = false
                        viewModel.exitStudySession(saveProgress = true)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                ) {
                    Text("Save & Exit", color = DarkBackground, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showExitDialog = false
                    viewModel.finishSession()
                }) {
                    Text("Finish Now", color = SuccessGreen)
                }
            },
            containerColor = DarkSurface
        )
    }

    // Note Editing Dialog
    if (showNoteDialog) {
        AlertDialog(
            onDismissRequest = { showNoteDialog = false },
            title = { Text("Personal Study Note", color = Color.White) },
            text = {
                OutlinedTextField(
                    value = currentNoteText,
                    onValueChange = { currentNoteText = it },
                    placeholder = { Text("Add personal clinical mnemonic or reminder...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    shape = RoundedCornerShape(10.dp)
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showNoteDialog = false
                        viewModel.saveUserNote(currentQuestion.id, currentNoteText)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                ) {
                    Text("Save Note", color = DarkBackground)
                }
            },
            dismissButton = {
                TextButton(onClick = { showNoteDialog = false }) {
                    Text("Cancel", color = TextSecondaryDark)
                }
            },
            containerColor = DarkSurface
        )
    }

    // Completion Dialog
    if (sessionSummary != null) {
        SessionCompletionDialog(
            summary = sessionSummary!!,
            onStudyIncorrect = {
                val incorrectIds = sessionSummary!!.incorrectQuestionIds
                if (incorrectIds.isNotEmpty()) {
                    viewModel.startStudySession(
                        deckIds = questions.map { it.deckId }.distinct(),
                        sessionTitle = "Review Incorrect Questions",
                        mode = "collection"
                    )
                }
            },
            onFinish = {
                viewModel.exitStudySession(saveProgress = false)
            }
        )
    }
}
