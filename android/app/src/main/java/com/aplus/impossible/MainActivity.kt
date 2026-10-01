package com.aplus.impossible

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aplus.impossible.ui.components.IconicLoadingScreen
import com.aplus.impossible.ui.screens.*
import com.aplus.impossible.ui.theme.*
import com.aplus.impossible.ui.viewmodel.AppScreen
import com.aplus.impossible.ui.viewmodel.AppTab
import com.aplus.impossible.ui.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val userSettings by viewModel.userSettings.collectAsState()
            val isDarkTheme = userSettings?.theme != "light"

            APlusTheme(darkTheme = isDarkTheme) {
                var isLoadingComplete by remember { mutableStateOf(false) }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                ) {
                    if (!isLoadingComplete) {
                        IconicLoadingScreen(
                            onComplete = { isLoadingComplete = true }
                        )
                    } else {
                        MainAppContent(viewModel = viewModel)
                    }
                }
            }
        }
    }
}

@Composable
fun MainAppContent(viewModel: MainViewModel) {
    val currentTab by viewModel.currentTab.collectAsState()
    val currentScreen by viewModel.currentScreen.collectAsState()

    // Android System Back Button Handler
    BackHandler(enabled = currentScreen != AppScreen.Main) {
        viewModel.navigateBack()
    }

    Scaffold(
        bottomBar = {
            // Hide BottomBar during Study Session or Import Wizard to maximize study area
            if (currentScreen == AppScreen.Main) {
                NavigationBar(
                    containerColor = DarkSurface,
                    contentColor = PrimaryCyan,
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = currentTab == AppTab.DASHBOARD,
                        onClick = { viewModel.setTab(AppTab.DASHBOARD) },
                        icon = {
                            Icon(
                                if (currentTab == AppTab.DASHBOARD) Icons.Default.Dashboard else Icons.Outlined.Dashboard,
                                contentDescription = "Dashboard"
                            )
                        },
                        label = { Text("Home", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DarkBackground,
                            selectedTextColor = CyanGlow,
                            indicatorColor = PrimaryCyan,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextMutedDark
                        )
                    )

                    NavigationBarItem(
                        selected = currentTab == AppTab.LIBRARY,
                        onClick = { viewModel.setTab(AppTab.LIBRARY) },
                        icon = {
                            Icon(
                                if (currentTab == AppTab.LIBRARY) Icons.Default.Folder else Icons.Outlined.Folder,
                                contentDescription = "Library"
                            )
                        },
                        label = { Text("Library", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DarkBackground,
                            selectedTextColor = CyanGlow,
                            indicatorColor = PrimaryCyan,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextMutedDark
                        )
                    )

                    NavigationBarItem(
                        selected = currentTab == AppTab.COLLECTIONS,
                        onClick = { viewModel.setTab(AppTab.COLLECTIONS) },
                        icon = {
                            Icon(
                                if (currentTab == AppTab.COLLECTIONS) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                                contentDescription = "Collections"
                            )
                        },
                        label = { Text("Collections", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DarkBackground,
                            selectedTextColor = CyanGlow,
                            indicatorColor = PrimaryCyan,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextMutedDark
                        )
                    )

                    NavigationBarItem(
                        selected = currentTab == AppTab.ANALYTICS,
                        onClick = { viewModel.setTab(AppTab.ANALYTICS) },
                        icon = {
                            Icon(
                                if (currentTab == AppTab.ANALYTICS) Icons.Default.BarChart else Icons.Outlined.BarChart,
                                contentDescription = "Analytics"
                            )
                        },
                        label = { Text("Analytics", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DarkBackground,
                            selectedTextColor = CyanGlow,
                            indicatorColor = PrimaryCyan,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextMutedDark
                        )
                    )

                    NavigationBarItem(
                        selected = currentTab == AppTab.SETTINGS,
                        onClick = { viewModel.setTab(AppTab.SETTINGS) },
                        icon = {
                            Icon(
                                if (currentTab == AppTab.SETTINGS) Icons.Default.Settings else Icons.Outlined.Settings,
                                contentDescription = "Settings"
                            )
                        },
                        label = { Text("Settings", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = DarkBackground,
                            selectedTextColor = CyanGlow,
                            indicatorColor = PrimaryCyan,
                            unselectedIconColor = TextSecondaryDark,
                            unselectedTextColor = TextMutedDark
                        )
                    )
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (val screen = currentScreen) {
                is AppScreen.Main -> {
                    when (currentTab) {
                        AppTab.DASHBOARD -> DashboardScreen(viewModel = viewModel)
                        AppTab.LIBRARY -> LibraryScreen(viewModel = viewModel)
                        AppTab.COLLECTIONS -> CollectionsScreen(viewModel = viewModel)
                        AppTab.ANALYTICS -> AnalyticsScreen(viewModel = viewModel)
                        AppTab.SETTINGS -> SettingsScreen(viewModel = viewModel)
                    }
                }
                is AppScreen.DeckDetail -> {
                    DeckDetailScreen(deckId = screen.deckId, viewModel = viewModel)
                }
                is AppScreen.Study -> {
                    StudySessionScreen(sessionTitle = screen.sessionTitle, viewModel = viewModel)
                }
                is AppScreen.ImportWizard -> {
                    ImportWizardScreen(viewModel = viewModel)
                }
                is AppScreen.QuestionEditor -> {
                    QuestionEditorScreen(deckId = screen.deckId, viewModel = viewModel)
                }
                is AppScreen.Trash -> {
                    TrashScreen(viewModel = viewModel)
                }
                is AppScreen.Backup -> {
                    BackupScreen(viewModel = viewModel)
                }
            }
        }
    }
}
