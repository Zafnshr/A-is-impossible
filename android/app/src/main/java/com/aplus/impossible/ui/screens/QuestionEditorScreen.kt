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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.QuestionEntity
import com.aplus.impossible.data.model.QuestionType
import com.aplus.impossible.ui.components.QuestionTypeBadge
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuestionEditorScreen(
    deckId: String,
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val decks by viewModel.decks.collectAsState()
    val deck = decks.find { it.id == deckId }

    var questionStem by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf(QuestionType.SINGLE_MCQ) }
    var optionA by remember { mutableStateOf("") }
    var optionB by remember { mutableStateOf("") }
    var optionC by remember { mutableStateOf("") }
    var optionD by remember { mutableStateOf("") }
    var correctIndex by remember { mutableIntStateOf(0) }
    var explanation by remember { mutableStateOf("") }
    var highYieldNotes by remember { mutableStateOf("") }
    var showSuccessMessage by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Add / Edit Question",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { viewModel.navigateBack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
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
            contentPadding = PaddingValues(top = 8.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Text(
                    text = "Lecture: ${deck?.lectureName ?: "Deck"}",
                    color = PrimaryTeal,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // Question Type Selector
            item {
                Text("Question Type", color = TextSecondaryDark, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf(
                        QuestionType.SINGLE_MCQ,
                        QuestionType.MULTIPLE_MCQ,
                        QuestionType.TRUE_FALSE
                    ).forEach { type ->
                        FilterChip(
                            selected = selectedType == type,
                            onClick = { selectedType = type },
                            label = { Text(type.shortLabel, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryCyan.copy(alpha = 0.25f),
                                selectedLabelColor = CyanGlow,
                                containerColor = DarkSurface,
                                labelColor = TextSecondaryDark
                            )
                        )
                    }
                }
            }

            // Question Stem
            item {
                OutlinedTextField(
                    value = questionStem,
                    onValueChange = { questionStem = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp),
                    label = { Text("Question Stem") },
                    placeholder = { Text("Enter medical question stem...") },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryCyan,
                        unfocusedBorderColor = DarkCardBorder,
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
            }

            // Options (for MCQ / True False)
            if (selectedType == QuestionType.SINGLE_MCQ || selectedType == QuestionType.MULTIPLE_MCQ) {
                item {
                    Text("Answer Choices & Correct Key", color = TextSecondaryDark, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }

                listOf(
                    Triple("Option A", optionA) { str: String -> optionA = str },
                    Triple("Option B", optionB) { str: String -> optionB = str },
                    Triple("Option C", optionC) { str: String -> optionC = str },
                    Triple("Option D", optionD) { str: String -> optionD = str }
                ).forEachIndexed { idx, (label, value, setter) ->
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = correctIndex == idx,
                                onClick = { correctIndex = idx },
                                colors = RadioButtonDefaults.colors(selectedColor = SuccessGreen)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            OutlinedTextField(
                                value = value,
                                onValueChange = setter,
                                modifier = Modifier.weight(1f),
                                placeholder = { Text(label, color = TextMutedDark) },
                                singleLine = true,
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = PrimaryCyan,
                                    unfocusedBorderColor = DarkCardBorder,
                                    focusedContainerColor = DarkSurface,
                                    unfocusedContainerColor = DarkSurface,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )
                        }
                    }
                }
            }

            // Explanation
            item {
                OutlinedTextField(
                    value = explanation,
                    onValueChange = { explanation = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp),
                    label = { Text("Clinical Explanation (Optional)") },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryCyan,
                        unfocusedBorderColor = DarkCardBorder,
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
            }

            // High Yield Notes
            item {
                OutlinedTextField(
                    value = highYieldNotes,
                    onValueChange = { highYieldNotes = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp),
                    label = { Text("High-Yield Notes / Clinical Pearls (Optional)") },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = WarningAmber,
                        unfocusedBorderColor = DarkCardBorder,
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
            }

            // Save Button
            item {
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        val optionsList = when (selectedType) {
                            QuestionType.TRUE_FALSE -> listOf("True", "False")
                            else -> listOf(optionA, optionB, optionC, optionD).filter { it.isNotBlank() }
                        }
                        val newQ = QuestionEntity(
                            id = UUID.randomUUID().toString(),
                            deckId = deckId,
                            type = selectedType,
                            question = questionStem.ifBlank { "Untitled Question" },
                            options = if (optionsList.isNotEmpty()) optionsList else listOf("Option A", "Option B"),
                            correctAnswers = listOf(correctIndex),
                            explanation = explanation.ifBlank { null },
                            highYieldNotes = highYieldNotes.ifBlank { null }
                        )
                        viewModel.saveQuestion(newQ)
                        showSuccessMessage = true
                        questionStem = ""
                        optionA = ""
                        optionB = ""
                        optionC = ""
                        optionD = ""
                        explanation = ""
                        highYieldNotes = ""
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, tint = DarkBackground)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Question to Deck", color = DarkBackground, fontWeight = FontWeight.Bold)
                }

                if (showSuccessMessage) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Question saved successfully!",
                        color = SuccessGreen,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}
