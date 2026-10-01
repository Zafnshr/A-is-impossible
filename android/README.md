# A+ is Impossible — Native Android Application (APK)

A complete, production-grade, 100% offline native Android application for **A+ is Impossible** built with **Kotlin** and **Jetpack Compose**.

---

## Architecture & Technology Stack

- **Architecture:** MVVM + Clean Repository Pattern
- **UI Framework:** 100% Jetpack Compose with Material Design 3
- **Local Persistence:** Android Room (SQLite) with TypeConverters for complex medical question schemas
- **Language:** Kotlin 2.0+ (100% Native, Zero WebViews, Zero browser shortcuts)
- **Min Android SDK:** API 26 (Android 8.0 Oreo) — Supports 99.5%+ of all Android devices worldwide
- **Target Android SDK:** API 35 (Android 15)
- **Document Engine:** 100% Offline DOCX OpenXML Zip Parser, TXT Parser, and JSON Parser
- **Storage:** Android Storage Access Framework (SAF) for seamless backup export & import

---

## Feature Parity Matrix

| Feature | Android Status | Implementation Details |
|---|---|---|
| **100% Offline Capability** | Verified | SQLite Room database, zero cloud requirement, works in Airplane mode |
| **Academic Hierarchy** | Verified | Year 2 → Blood, CVS, Respiratory → Predefined Egyptian medical subjects |
| **All 6 Question Types** | Verified | Single MCQ, Multiple MCQ, True/False, Matching Pairs, Ordering, Case Study |
| **DOCX Import** | Verified | Built-in offline OpenXML unzipper and parser via Android SAF file picker |
| **TXT / JSON / Paste Import** | Verified | Diagnostic parser with live boundary engine & question preview |
| **Study Sessions** | Verified | Fullscreen study view with swipe left (next) and swipe right (previous) |
| **Question Map & Summary** | Verified | Interactive grid (1..N) with filters (All, Unanswered, Incorrect, Flagged, Correct) |
| **Timers** | Verified | Real-time Stopwatch and Countdown timer with pause/resume |
| **Interactive Question Editor** | Verified | Add, edit stem, options, correct answers, explanations, and high-yield notes |
| **Collections** | Verified | Dedicated tabs for ⭐ Favorites, 🚩 Flagged, and ❌ Incorrect questions |
| **Analytics Dashboard** | Verified | Circular accuracy ring, study time tracker, subject mastery bars, session history |
| **Backup & Restore** | Verified | SAF Export & Import matching web JSON schema (Merge & Overwrite support) |
| **Trash Center** | Verified | Safe deletion, one-tap restore, and permanent purge |
| **Iconic Loading Animation** | Verified | Native Compose Canvas EKG waveform with glowing head & synaptic network |
| **Dark & Light Mode** | Verified | Curated luxury medical dark theme (`#0B0F19`) and clean clinical light theme |

---

## How to Build the APK in Android Studio

1. **Open Android Studio** (Giraffe, Hedgehog, Iguana, Jellyfish, Koala, Ladybug, or newer).
2. Select **File -> Open...** and browse to the `android/` directory inside this repository:
   ```
   c:\Users\abdal\Downloads\A is impossible\android
   ```
3. Allow Gradle to sync dependencies automatically.
4. **To Build Debug APK:**
   - Go to menu: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**
   - Once built, Android Studio displays a notification with a **locate** link to the APK:
     ```
     android/app/build/outputs/apk/debug/app-debug.apk
     ```
5. **To Install onto an Android Phone:**
   - Enable **Developer Options** and **USB Debugging** on your phone.
   - Connect your phone via USB cable and click **Run 'app'** (Green play button) in Android Studio.
   - Alternatively, copy `app-debug.apk` directly to your phone via USB, WhatsApp, Telegram, or Google Drive, tap the file in your phone's file manager, and select **Install**.

---

## Command Line Build (Optional)

If you have JDK 17+ and the Android SDK command-line tools installed, you can build from your terminal:

```bash
cd android
./gradlew assembleDebug
```
The resulting APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`
