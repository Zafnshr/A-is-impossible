package com.aplus.impossible.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrashScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val trashItems by viewModel.trashItems.collectAsState()
    var showEmptyConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Trash Center",
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
                actions = {
                    if (trashItems.isNotEmpty()) {
                        IconButton(onClick = { showEmptyConfirm = true }) {
                            Icon(Icons.Outlined.DeleteSweep, contentDescription = "Empty Trash", tint = ErrorRed)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        containerColor = DarkBackground
    ) { padding ->
        if (trashItems.isEmpty()) {
            Box(
                modifier = modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Outlined.DeleteOutline,
                        contentDescription = null,
                        tint = TextMutedDark,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Trash is Empty",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Deleted lecture decks and questions will be kept here safely until permanently emptied.",
                        color = TextSecondaryDark,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(horizontal = 20.dp)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 12.dp, bottom = 40.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(trashItems) { item ->
                    val dateFormat = SimpleDateFormat("MMM d, yyyy • h:mm a", Locale.getDefault())
                    val dateStr = dateFormat.format(Date(item.deletedAt))

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        shape = RoundedCornerShape(12.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.title,
                                    color = Color.White,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "${item.itemType.uppercase()} • Deleted $dateStr",
                                    color = TextMutedDark,
                                    fontSize = 11.sp
                                )
                            }

                            Row {
                                IconButton(onClick = { viewModel.restoreTrashItem(item) }) {
                                    Icon(Icons.Default.Restore, contentDescription = "Restore", tint = SuccessGreen)
                                }
                                IconButton(onClick = { viewModel.permanentlyDeleteTrash(item.id) }) {
                                    Icon(Icons.Default.DeleteForever, contentDescription = "Delete", tint = ErrorRed)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showEmptyConfirm) {
        AlertDialog(
            onDismissRequest = { showEmptyConfirm = false },
            title = { Text("Empty Entire Trash?", color = Color.White) },
            text = { Text("All items in the trash will be permanently erased. This action cannot be undone.", color = TextSecondaryDark) },
            confirmButton = {
                Button(
                    onClick = {
                        showEmptyConfirm = false
                        viewModel.clearTrash()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                ) {
                    Text("Empty All", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEmptyConfirm = false }) {
                    Text("Cancel", color = TextSecondaryDark)
                }
            },
            containerColor = DarkSurface
        )
    }
}
