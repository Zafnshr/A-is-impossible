package com.aplus.impossible.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BackupScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var statusMessage by remember { mutableStateOf<String?>(null) }
    var showResetProgressConfirm by remember { mutableStateOf(false) }
    var showDeleteDecksConfirm by remember { mutableStateOf(false) }
    var showFactoryResetConfirm by remember { mutableStateOf(false) }

    // SAF Create Document for Exporting JSON Backup
    val exportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                try {
                    val json = viewModel.exportBackupJson()
                    context.contentResolver.openOutputStream(uri)?.use { os ->
                        os.write(json.toByteArray(Charsets.UTF_8))
                    }
                    statusMessage = "Backup successfully exported to file!"
                } catch (e: Exception) {
                    statusMessage = "Export failed: ${e.message}"
                }
            }
        }
    }

    // SAF Open Document for Importing JSON Backup
    val importLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                try {
                    val json = context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                    if (json != null) {
                        val success = viewModel.importBackupJson(json, mode = "merge")
                        statusMessage = if (success) "Backup successfully restored!" else "Invalid backup file format."
                    }
                } catch (e: Exception) {
                    statusMessage = "Import failed: ${e.message}"
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Backup & Data Center",
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
            contentPadding = PaddingValues(top = 12.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (statusMessage != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = PrimaryCyan.copy(alpha = 0.15f)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Info, contentDescription = null, tint = CyanGlow)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = statusMessage!!, color = Color.White, fontSize = 13.sp)
                        }
                    }
                }
            }

            // Export Section
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(14.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Export Everything", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Export your complete question bank, lecture decks, study sessions, personal notes, and bookmarks into a JSON file for safe keeping.",
                            color = TextSecondaryDark,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Button(
                            onClick = {
                                val timestamp = System.currentTimeMillis()
                                exportLauncher.launch("a-plus-backup-$timestamp.json")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Outlined.FileDownload, contentDescription = null, tint = DarkBackground)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Export JSON Backup", color = DarkBackground, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Import Section
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(14.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Import & Restore", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Restore data from a previously created JSON backup file. Seamlessly compatible with the web version.",
                            color = TextSecondaryDark,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Button(
                            onClick = {
                                importLauncher.launch(arrayOf("application/json", "text/*", "*/*"))
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Outlined.FileUpload, contentDescription = null, tint = DarkBackground)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Import JSON Backup", color = DarkBackground, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Danger Zone Section
            item {
                Text("Danger Zone", color = ErrorRed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }

            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    shape = RoundedCornerShape(14.dp),
                    border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(ErrorRed.copy(alpha = 0.4f)))
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showResetProgressConfirm = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = WarningAmber),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Reset Study Progress (Keep Decks)")
                        }

                        OutlinedButton(
                            onClick = { showDeleteDecksConfirm = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = ErrorRed),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Delete All Lecture Decks")
                        }

                        Button(
                            onClick = { showFactoryResetConfirm = true },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Factory Reset Platform", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    if (showResetProgressConfirm) {
        AlertDialog(
            onDismissRequest = { showResetProgressConfirm = false },
            title = { Text("Reset Study Progress?", color = Color.White) },
            text = { Text("This will clear your study attempts, accuracy history, and scores. Your decks and personal notes will NOT be deleted.", color = TextSecondaryDark) },
            confirmButton = {
                Button(onClick = {
                    showResetProgressConfirm = false
                    viewModel.resetStudyProgress()
                    statusMessage = "Study progress successfully reset."
                }, colors = ButtonDefaults.buttonColors(containerColor = WarningAmber)) {
                    Text("Reset Progress", color = DarkBackground)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetProgressConfirm = false }) { Text("Cancel") }
            },
            containerColor = DarkSurface
        )
    }

    if (showDeleteDecksConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteDecksConfirm = false },
            title = { Text("Delete All Decks?", color = Color.White) },
            text = { Text("All lecture decks, questions, and active sessions will be permanently deleted.", color = TextSecondaryDark) },
            confirmButton = {
                Button(onClick = {
                    showDeleteDecksConfirm = false
                    viewModel.deleteAllDecks()
                    statusMessage = "All lecture decks deleted."
                }, colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)) {
                    Text("Delete All", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDecksConfirm = false }) { Text("Cancel") }
            },
            containerColor = DarkSurface
        )
    }

    if (showFactoryResetConfirm) {
        AlertDialog(
            onDismissRequest = { showFactoryResetConfirm = false },
            title = { Text("Factory Reset Platform?", color = Color.White) },
            text = { Text("This completely wipes all local database records and restores the app to its original first-launch state.", color = TextSecondaryDark) },
            confirmButton = {
                Button(onClick = {
                    showFactoryResetConfirm = false
                    viewModel.factoryReset()
                    statusMessage = "Platform reset to original first-launch state."
                }, colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)) {
                    Text("Confirm Factory Reset", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showFactoryResetConfirm = false }) { Text("Cancel") }
            },
            containerColor = DarkSurface
        )
    }
}
