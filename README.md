# 🕯️ Green Candle Monitor

[![Release Version](https://img.shields.io/badge/version-1.0.0-3FB950?style=for-the-badge&logo=android&logoColor=white)](https://github.com/ItsMeParavai/Green-Candle-Monitor/releases)
[![Build Status](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-58A6FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/ItsMeParavai/Green-Candle-Monitor/actions)
[![Framework](https://img.shields.io/badge/React%20Native-Expo%20SDK%2051-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://expo.dev/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline-3FB950?style=for-the-badge&logo=shield&logoColor=white)](#-privacy--security)
[![License](https://img.shields.io/badge/License-MIT-F85149?style=for-the-badge)](LICENSE)

**Green Candle Monitor** is a mobile Profit & Loss (P&L) tracking and performance analytics journal designed specifically for stock, options, and futures traders. Built for discipline and clarity, it turns daily trading metrics into actionable psychological and statistical insights—100% offline, private, and secure.

---

## 📌 Table of Contents
- [Key Features](#-key-features)
- [Performance Analytics Dashboard](#-performance-analytics-dashboard)
- [Tech Stack](#-tech-stack)
- [App Preview & Architecture](#-app-preview--architecture)
- [Installation & Usage](#-installation--usage)
- [CSV Import / Export Specification](#-csv-import--export-specification)
- [Automated CI/CD Build Pipeline](#-automated-cicd-build-pipeline)
- [Privacy & Security](#-privacy--security)
- [Developer & Contact](#-developer--contact)
- [License](#-license)

---

## ✨ Key Features

* 📅 **Visual P&L Calendar Grid:** Color-coded daily trading logs (Green for profit, Red for loss) mapped directly across a trading-week calendar (Mon–Fri).
* ⏱️ **Flexible Timeframe Views:** Seamlessly switch between **Week**, **Month**, **Year**, and **All Time** summary perspectives.
* 🎯 **Goal Progress Tracking:** Set custom monthly INR targets with real-time visual progress gauge tracking.
* 📥 **CSV / Excel Data Portability:** Export full historical logs to `.csv` or import previous trade records in bulk.
* 🌙 **Sleek Dark Theme:** Clean, high-contrast UI tailored for modern dark mode aesthetics to minimize visual fatigue.
* 📱 **Standalone Offline APK:** Operates completely without server dependencies or cloud sync requirements.

---

## 📊 Performance Analytics Dashboard

The dedicated **Analytics** engine automatically computes core trading metrics directly from your raw daily entries:

| Metric | Description |
| :--- | :--- |
| **Net Realized P&L** | Total cumulative net profit/loss in Rupee (₹) currency. |
| **Profit Factor** | Ratio of gross profits to gross losses ($\sum	ext{Profits} / \sum	ext{Losses}$). |
| **Win Rate %** | Percentage of profitable trading sessions versus total active days. |
| **Session Ratio** | Visual gauge comparing Green (Profit) days vs. Red (Loss) days. |
| **Key Performance Indicators** | Average Win/Day, Average Loss/Day, Best Single Day, and Worst Single Day. |
| **Monthly & Weekly Trends** | Bar chart visualization of monthly financial metrics and week-by-week performance. |
| **Cumulative Equity Trajectory** | Running equity trajectory curve highlighting portfolio growth over time. |

---

## 🛠️ Tech Stack

* **Framework:** React Native (Expo SDK `~51.0.28`)
* **Core Libraries:**
  * `@react-native-async-storage/async-storage` — Fast local key-value persistence
  * `expo-file-system` & `expo-sharing` — CSV report generation and file distribution
  * `expo-document-picker` — Native CSV file import interface
* **CI/CD Build System:** GitHub Actions (Automated Android APK build workflow using Java 17 and Node.js 20)
* **Design Engine:** Native React Native StyleSheet with custom dark/light color palette token system

---

## 🚀 Installation & Usage

### Option 1: Download Standalone Android APK (Recommended for Traders)
1. Go to the [Releases](https://github.com/ItsMeParavai/Green-Candle-Monitor/releases) page or inspect the latest successfully completed **GitHub Actions** run.
2. Download `pnl-tracker-offline-apk.zip` / `app-release.apk`.
3. Install the APK directly on your Android device.

---

### Option 2: Local Developer Setup

#### Prerequisites
* Node.js (v18.0 or higher)
* npm or yarn
* Expo Go app on mobile (for testing)

#### Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/ItsMeParavai/Green-Candle-Monitor.git

# 2. Navigate into project directory
cd Green-Candle-Monitor

# 3. Install dependencies using legacy peer flag
npm install --legacy-peer-deps

# 4. Launch development server
npm start
```

---

## 📄 CSV Import / Export Specification

Green Candle Monitor supports standardized `.csv` file format for bulk importing and exporting trading records.

### CSV Structure Sample
```csv
Date,Type,Amount (INR)
"2026-10-28","Profit",1793
"2026-10-29","Profit",6776
"2026-10-30","Loss",-1928
```

---

## ⚙️ Automated CI/CD Build Pipeline

This project includes a fully configured **GitHub Actions Workflow** (`.github/workflows/build-apk.yml`) that automatically compiles standalone Android APKs upon push to `main`:

```yaml
name: Build Android APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      - run: npm install --legacy-peer-deps
      - run: npx eas-cli build --platform android --profile preview --local
```

---

## 🔒 Privacy & Security

* **Zero Cloud Tracking:** All P&L records remain on your local device via encrypted device storage.
* **No Telemetry:** No user analytics, network calls, or third-party SDK trackers are included.
* **Offline-First Guarantee:** Operates entirely without cellular data or Wi-Fi network connection.

---

## 👨‍💻 Developer & Contact

Developed with care for disciplined trading performance.

* **Developer:** **Neelakandan N**
* **GitHub Repository:** [ItsMeParavai/Green-Candle-Monitor](https://github.com/ItsMeParavai/Green-Candle-Monitor)

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
