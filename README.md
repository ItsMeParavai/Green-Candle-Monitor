# PnL Tracker (Expo / React Native)

Offline daily savings and P&L tracker with a calendar UI. Data is stored on-device with AsyncStorage.

## Features
- Week / Month / Year / All time views
- Month (or week/year) navigation arrows
- Total P&L card and Monthly goal card with progress and an edit modal
- Weekends ON/OFF toggle and account selector (add multiple accounts)
- Green (profit), red (loss) and gray "—" (empty) day cards
- Tap any day to log profit/loss and an optional note
- Dark and light themes (toggle button, top right)

## Build the APK on GitHub (no local tools)
1. Create a GitHub repo and push this folder to the `main` branch.
2. Open the **Actions** tab, run **Build Android APK** (it also runs on every push to `main`).
3. When it finishes, open the run and download the **pnl-tracker-apk** artifact (a zip containing the APK).
4. Unzip it, copy the APK to your phone and install it (allow "install unknown apps").

Notes:
- The Expo template signs the release build with its debug keystore, so the APK installs on any phone. For Play Store release, add your own keystore.
- Change `android.package` in `app.json` (default `com.example.pnltracker`) to your own ID.
- The build targets arm64-v8a and armeabi-v7a (almost all phones). Remove `-PreactNativeArchitectures=...` in the workflow to include x86 emulators.

## Run locally (optional)
```
npm install
npx expo start
```

## Structure
```
App.js                  main screen and state
src/theme.js            dark and light palettes
src/storage.js          AsyncStorage persistence
src/dateUtils.js        calendar helpers
src/calc.js             totals and stats
src/components/         ViewTabs, SummaryRow, CalendarGrid, YearView, AllTimeView,
                        EntryModal, GoalModal, AccountModal, ModalSheet
.github/workflows/build-apk.yml
```
