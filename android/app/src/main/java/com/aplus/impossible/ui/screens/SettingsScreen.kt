package com.aplus.impossible.ui.screens

import androidx.compose.foundation.BorderStroke

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.AppScreen
import com.aplus.impossible.ui.viewmodel.MainViewModel

@Composable
fun SettingsScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val settings by viewModel.userSettings.collectAsState()
    val profile by viewModel.userProfile.collectAsState()

    var profileName by remember(profile) { mutableStateOf(profile?.name ?: "Dr. Medical Student") }
    var university by remember(profile) { mutableStateOf(profile?.university ?: "Faculty of Medicine") }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Profile Section
        item {
            Text("Student Profile", style = MaterialTheme.typography.titleMedium, color = Color.White)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, DarkCardBorder)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = profileName,
                        onValueChange = {
                            profileName = it
                            if (profile != null) viewModel.updateProfile(profile!!.copy(name = it))
                        },
                        label = { Text("Display Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                    OutlinedTextField(
                        value = university,
                        onValueChange = {
                            university = it
                            if (profile != null) viewModel.updateProfile(profile!!.copy(university = it))
                        },
                        label = { Text("University / Faculty") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }

        // 2. Study Preferences
        item {
            Text("Study Preferences", style = MaterialTheme.typography.titleMedium, color = Color.White)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, DarkCardBorder)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Sound Feedback Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Sound Feedback", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("Audio cues on question submit", color = TextSecondaryDark, fontSize = 11.sp)
                        }
                        Switch(
                            checked = settings?.soundEnabled ?: true,
                            onCheckedChange = {
                                if (settings != null) viewModel.updateSettings(settings!!.copy(soundEnabled = it))
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = PrimaryCyan)
                        )
                    }

                    HorizontalDivider(color = DarkCardBorder)

                    // Haptic Vibration Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Haptic Feedback", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("Tactile vibrations on answers", color = TextSecondaryDark, fontSize = 11.sp)
                        }
                        Switch(
                            checked = settings?.hapticEnabled ?: true,
                            onCheckedChange = {
                                if (settings != null) viewModel.updateSettings(settings!!.copy(hapticEnabled = it))
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = PrimaryCyan)
                        )
                    }

                    HorizontalDivider(color = DarkCardBorder)

                    // Auto Reveal On Submit Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Instant Explanation", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text("Show clinical rationale immediately", color = TextSecondaryDark, fontSize = 11.sp)
                        }
                        Switch(
                            checked = settings?.autoRevealOnSubmit ?: false,
                            onCheckedChange = {
                                if (settings != null) viewModel.updateSettings(settings!!.copy(autoRevealOnSubmit = it))
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = PrimaryCyan)
                        )
                    }
                }
            }
        }

        // 3. Quick Data Centers
        item {
            Text("Data Management", style = MaterialTheme.typography.titleMedium, color = Color.White)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, DarkCardBorder)
            ) {
                Column {
                    ListItem(
                        headlineContent = { Text("Backup Center", color = Color.White) },
                        supportingContent = { Text("Export and restore platform JSON files", color = TextSecondaryDark) },
                        leadingContent = { Icon(Icons.Outlined.Backup, contentDescription = null, tint = CyanGlow) },
                        trailingContent = { Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMutedDark) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.navigateTo(AppScreen.Backup) }
                            .padding(horizontal = 4.dp),
                        colors = ListItemDefaults.colors(containerColor = DarkSurface)
                    )

                    HorizontalDivider(color = DarkCardBorder)

                    ListItem(
                        headlineContent = { Text("Trash Center", color = Color.White) },
                        supportingContent = { Text("View and restore deleted lecture decks", color = TextSecondaryDark) },
                        leadingContent = { Icon(Icons.Outlined.Delete, contentDescription = null, tint = ErrorRed) },
                        trailingContent = { Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMutedDark) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.navigateTo(AppScreen.Trash) }
                            .padding(horizontal = 4.dp),
                        colors = ListItemDefaults.colors(containerColor = DarkSurface)
                    )
                }
            }
        }

        // 4. App Information & Architecture Specs
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, DarkCardBorder)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("A+ is Impossible for Android", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("Version 1.0.0 (Native Release)", color = CyanGlow, fontSize = 12.sp)
                    Text("100% Offline • Zero Cloud Dependency • Kotlin + Jetpack Compose", color = TextSecondaryDark, fontSize = 11.sp)
                }
            }
        }
    }
}
