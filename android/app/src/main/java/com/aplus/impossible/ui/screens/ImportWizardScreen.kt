package com.aplus.impossible.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.data.model.AcademicCurriculum
import com.aplus.impossible.data.model.QuestionType
import com.aplus.impossible.ui.components.QuestionTypeBadge
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImportWizardScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val importPreview by viewModel.importPreview.collectAsState()
    val isImporting by viewModel.isImporting.collectAsState()

    var selectedYear by remember { mutableStateOf("Year 2") }
    var selectedModule by remember { mutableStateOf("Blood") }
    var selectedSubject by remember { mutableStateOf("Physiology") }
    var lectureName by remember { mutableStateOf("") }
    var pastedText by remember { mutableStateOf("") }

    val modules = remember(selectedYear) { AcademicCurriculum.getModulesForYear(selectedYear) }
    val subjects = remember(selectedYear, selectedModule) { AcademicCurriculum.getSubjectsForModule(selectedYear, selectedModule) }

    // Android Storage Access Framework (SAF) File Picker Launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) {
            val contentResolver = context.contentResolver
            val inputStream = contentResolver.openInputStream(uri)
            val fileName = uri.path?.substringAfterLast('/') ?: "Lecture.docx"
            val fallbackTitle = lectureName.ifBlank { fileName.substringBeforeLast('.').replace('_', ' ') }

            if (inputStream != null) {
                if (fileName.endsWith(".docx", ignoreCase = true) || uri.toString().contains("docx", ignoreCase = true)) {
                    viewModel.parseDocxFile(
                        inputStream = inputStream,
                        year = selectedYear,
                        module = selectedModule,
                        subject = selectedSubject,
                        lectureName = fallbackTitle
                    )
                } else {
                    val text = inputStream.bufferedReader().use { it.readText() }
                    viewModel.parsePlainTextContent(
                        text = text,
                        year = selectedYear,
                        module = selectedModule,
                        subject = selectedSubject,
                        lectureName = fallbackTitle
                    )
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (importPreview == null) "Import Questions" else "Review Imported Questions",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (importPreview != null) {
                            viewModel.cancelImport()
                        } else {
                            viewModel.navigateBack()
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        containerColor = DarkBackground
    ) { padding ->
        if (isImporting) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = PrimaryCyan)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Parsing Medical Question Document...", color = CyanGlow, fontSize = 14.sp)
                }
            }
            return@Scaffold
        }

        if (importPreview == null) {
            // Step 1 & 2: Categorization & Input Method
            LazyColumn(
                modifier = modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 8.dp, bottom = 40.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text(
                        text = "1. Academic Categorization",
                        color = CyanGlow,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Predefined Egyptian curriculum hierarchy",
                        color = TextSecondaryDark,
                        fontSize = 12.sp
                    )
                }

                // Module Selector
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        shape = RoundedCornerShape(14.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Module", color = TextSecondaryDark, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                modules.forEach { mod ->
                                    FilterChip(
                                        selected = selectedModule == mod,
                                        onClick = { selectedModule = mod },
                                        label = { Text(mod) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = PrimaryCyan.copy(alpha = 0.25f),
                                            selectedLabelColor = CyanGlow,
                                            containerColor = DarkBackground,
                                            labelColor = TextSecondaryDark
                                        )
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text("Subject", color = TextSecondaryDark, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                subjects.take(4).forEach { subj ->
                                    FilterChip(
                                        selected = selectedSubject == subj,
                                        onClick = { selectedSubject = subj },
                                        label = { Text(subj, fontSize = 11.sp) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = PrimaryTeal.copy(alpha = 0.25f),
                                            selectedLabelColor = PrimaryTeal,
                                            containerColor = DarkBackground,
                                            labelColor = TextSecondaryDark
                                        )
                                    )
                                }
                            }
                        }
                    }
                }

                // Lecture Name Field
                item {
                    OutlinedTextField(
                        value = lectureName,
                        onValueChange = { lectureName = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Lecture Name (e.g. Cardiac Output Lecture 1)") },
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
                }

                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "2. Select Document or Paste Questions",
                        color = CyanGlow,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                // File Picker Card (DOCX / TXT / JSON)
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                filePickerLauncher.launch(
                                    arrayOf(
                                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                        "text/plain",
                                        "application/json",
                                        "*/*"
                                    )
                                )
                            },
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        shape = RoundedCornerShape(14.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(PrimaryCyan.copy(alpha = 0.4f)))
                    ) {
                        Row(
                            modifier = Modifier.padding(18.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(PrimaryCyan.copy(alpha = 0.15f))
                            ) {
                                Icon(Icons.Outlined.UploadFile, contentDescription = null, tint = CyanGlow, modifier = Modifier.size(26.dp))
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Choose File from Storage", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("Supports .DOCX, .TXT, and .JSON", color = TextSecondaryDark, fontSize = 12.sp)
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = PrimaryCyan)
                        }
                    }
                }

                // Paste Text Option
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        shape = RoundedCornerShape(14.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkCardBorder))
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text("Or Paste Raw Question Text", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = pastedText,
                                onValueChange = { pastedText = it },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(160.dp),
                                placeholder = { Text("Paste questions here (Q1. Which of the following... A) ... B) ... Answer: B)", color = TextMutedDark, fontSize = 12.sp) },
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = PrimaryCyan,
                                    unfocusedBorderColor = DarkCardBorder,
                                    focusedContainerColor = DarkBackground,
                                    unfocusedContainerColor = DarkBackground,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )
                            if (pastedText.isNotBlank()) {
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        viewModel.parsePlainTextContent(
                                            text = pastedText,
                                            year = selectedYear,
                                            module = selectedModule,
                                            subject = selectedSubject,
                                            lectureName = lectureName.ifBlank { "Pasted Questions Lecture" }
                                        )
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Parse Pasted Text", color = DarkBackground, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Step 3: Diagnostic Preview & Review
            val preview = importPreview!!
            LazyColumn(
                modifier = modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 8.dp, bottom = 90.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header Diagnostics Summary
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        shape = RoundedCornerShape(16.dp),
                        border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(PrimaryCyan.copy(alpha = 0.35f)))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = preview.lectureName,
                                color = Color.White,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${preview.year} • ${preview.module} • ${preview.subject}",
                                color = PrimaryTeal,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                MiniStatBox(label = "Questions", value = "${preview.detectedQuestionCount}", modifier = Modifier.weight(1f))
                                MiniStatBox(label = "Answer Keys", value = "${preview.answerKeyCount}", modifier = Modifier.weight(1f))
                                MiniStatBox(label = "Warnings", value = "${preview.warnings.size}", valueColor = if (preview.warnings.isNotEmpty()) WarningAmber else SuccessGreen, modifier = Modifier.weight(1f))
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Breakdown Chips
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                preview.typeBreakdown.forEach { (type, count) ->
                                    if (count > 0) {
                                        QuestionTypeBadge(type = type, short = true)
                                    }
                                }
                            }
                        }
                    }
                }

                // Confirm Import Button
                item {
                    Button(
                        onClick = { viewModel.confirmImport() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = DarkBackground)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Save ${preview.detectedQuestionCount} Questions to Library",
                            color = DarkBackground,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }

                // Parsed Questions Preview
                item {
                    Text(
                        text = "Parsed Questions Preview",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                }

                itemsIndexed(preview.questions) { idx, q ->
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
                                Text("Q${idx + 1}", color = CyanGlow, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                QuestionTypeBadge(type = q.type, short = true)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = q.question, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)

                            if (q.options.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                q.options.take(4).forEachIndexed { oIdx, opt ->
                                    val isCorrect = q.correctAnswers.contains(oIdx)
                                    Text(
                                        text = "${('A'.code + oIdx).toChar()}) $opt",
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
    }
}
