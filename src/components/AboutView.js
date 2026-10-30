import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function AboutView({ isDarkMode, onToggleTheme, theme }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* App Info Header */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={styles.appIcon}>📈</Text>
        <Text style={[styles.appName, { color: theme.textPrimary }]}>PnL & Progress Tracker</Text>
        <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 1.0.0 (Offline Release)</Text>
        <Text style={[styles.appDesc, { color: theme.textSecondary }]}>
          A fast, privacy-focused daily savings and trading Profit & Loss tracking application designed for offline storage and clear visual analytics.
        </Text>
      </View>

      {/* Developer Info */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>👨‍💻 Developer Information</Text>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Developer</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>ItsMeParavai</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Build Engine</Text>
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>React Native / Expo</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Pipeline</Text>
          <Text style={[styles.infoValue, { color: theme.accent }]}>GitHub Actions CI/CD</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Data Privacy</Text>
          <Text style={[styles.infoValue, { color: theme.profitText }]}>100% Offline & Local</Text>
        </View>
      </View>

      {/* App Settings / Customization */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>⚙️ Preferences</Text>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.settingRow} onPress={onToggleTheme}>
          <Text style={[styles.settingText, { color: theme.textPrimary }]}>App Theme</Text>
          <Text style={[styles.settingValue, { color: theme.accent }]}>
            {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  appIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  appDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
