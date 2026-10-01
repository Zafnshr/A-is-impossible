package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import com.aplus.impossible.data.model.AcademicCurriculum
import com.aplus.impossible.data.model.DeckEntity
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.AppScreen
import com.aplus.impossible.ui.viewmodel.MainViewModel

@Composable
fun LibraryScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val decks by viewModel.decks.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedModule by remember { mutableStateOf("All") }
    var selectedSubject by remember { mutableStateOf("All") }

    val modules = remember { listOf("All") + AcademicCurriculum.getModulesForYear("Year 2") }
    val subjects = remember { listOf("All") + AcademicCurriculum.STANDARD_SUBJECTS }

    val filteredDecks = remember(decks, searchQuery, selectedModule, selectedSubject) {
        decks.filter { deck ->
            val matchesSearch = searchQuery.isBlank() ||
                    deck.lectureName.contains(searchQuery, ignoreCase = true) ||
                    deck.title.contains(searchQuery, ignoreCase = true) ||
                    deck.subject.contains(searchQuery, ignoreCase = true)
            val matchesModule = selectedModule == "All" || deck.module.equals(selectedModule, ignoreCase = true)
            val matchesSubject = selectedSubject == "All" || deck.subject.equals(selectedSubject, ignoreCase = true)
            matchesSearch && matchesModule && matchesSubject
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.navigateTo(AppScreen.ImportWizard()) },
                containerColor = PrimaryCyan,
                contentColor = DarkBackground,
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Import")
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Import", fontWeight = FontWeight.Bold)
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
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Search lectures, modules, subjects...", color = TextMutedDark) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMutedDark) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextMutedDark)
                        }
                    }
                },
                singleLine = true,
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

            // Module Filter Chips (Horizontal Scroll)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                modules.forEach { mod ->
                    val isSelected = selectedModule == mod
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedModule = mod },
                        label = { Text(mod, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryCyan.copy(alpha = 0.2f),
                            selectedLabelColor = CyanGlow,
                            containerColor = DarkSurface,
                            labelColor = TextSecondaryDark
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            selectedBorderColor = PrimaryCyan,
                            borderColor = DarkCardBorder
                        )
                    )
                }
            }

            // Subject Filter Chips (Horizontal Scroll)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                subjects.forEach { subj ->
                    val isSelected = selectedSubject == subj
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedSubject = subj },
                        label = { Text(subj, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryTeal.copy(alpha = 0.2f),
                            selectedLabelColor = PrimaryTeal,
                            containerColor = DarkSurface,
                            labelColor = TextSecondaryDark
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            selectedBorderColor = PrimaryTeal,
                            borderColor = DarkCardBorder
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Decks List
            if (filteredDecks.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Outlined.FolderOpen,
                            contentDescription = null,
                            tint = TextMutedDark,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (decks.isEmpty()) "No lectures imported yet" else "No matching lectures found",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (decks.isEmpty()) "Import DOCX, TXT, or JSON files to build your medical question bank." else "Try adjusting your search query or filters.",
                            color = TextSecondaryDark,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        if (decks.isEmpty()) {
                            Spacer(modifier = Modifier.height(20.dp))
                            Button(
                                onClick = { viewModel.navigateTo(AppScreen.ImportWizard()) },
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = DarkBackground)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Import First Lecture", color = DarkBackground, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 90.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredDecks) { deck ->
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
    }
}
