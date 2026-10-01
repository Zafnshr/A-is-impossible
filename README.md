# A+ is Impossible — Professional Medical Question-Bank & Study Platform

A high-performance active-recall study platform designed specifically for medical faculty students (starting with Year 2 modules: Blood, CVS, Respiratory and standard Egyptian medical subjects).

---

## Platforms Available

### 1. Native Android Application (APK)
Located in [`android/`](android/):
- **100% Native Kotlin + Jetpack Compose**
- **Zero WebViews • Zero Browser Wrappers • 100% Offline**
- Room Local Database (SQLite) for permanent on-device storage (Airplane mode safe)
- Built-in native DOCX, TXT, JSON, and Paste Question Parser
- Gesture-driven study sessions (swipe left/right, Question Map with filters, Stopwatch/Countdown timers)
- Backup & Restore via Android Storage Access Framework (interoperable with Web JSON)
- **Ready for Android Studio & APK compilation:** Open the [`android/`](android/) directory in Android Studio and select **Build -> Build APK(s)**.

### 2. Web Application
- **Vite + React + TypeScript + Tailwind CSS**
- Local IndexedDB storage engine
- Launch locally:
  ```bash
  npm install
  npm run dev
  ```
