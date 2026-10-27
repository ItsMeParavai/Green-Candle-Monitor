import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { darkTheme, lightTheme } from './src/theme';
import { loadAppData, saveEntries, saveGoal, saveSelectedAccount, saveThemeMode } from './src/storage';
import { MONTH_NAMES } from './src/dateUtils';
import { calculateMonthlyPnL } from './src/calc';

import ViewTabs from './src/components/ViewTabs';
import SummaryRow from './src/components/SummaryRow';
import CalendarGrid from './src/components/CalendarGrid';
import EntryModal from './src/components/EntryModal';
import GoalModal from './src/components/GoalModal';
import AccountModal from './src/components/AccountModal';
import YearView from './src/components/YearView';
import AllTimeView from './src/components/AllTimeView';

export default function App() {
  const [activeTab, setActiveTab] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hideWeekends, setHideWeekends] = useState(false);

  const [entries, setEntries] = useState({});
  const [goal, setGoal] = useState(100);
  const [accounts, setAccounts] = useState(['Main Account', 'Trading']);
  const [selectedAccount, setSelectedAccount] = useState('Main Account');

  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    (async () => {
      const data = await loadAppData();
      if (data) {
        setEntries(data.entries);
        setGoal(data.goal);
        setAccounts(data.accounts);
        setSelectedAccount(data.selectedAccount);
        setIsDarkMode(data.isDarkMode);
      }
    })();
  }, []);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  const handleSaveEntry = (dateKey, amount) => {
    const updated = {
      ...entries,
      [dateKey]: { amount, account: selectedAccount }
    };
    setEntries(updated);
    saveEntries(updated);
    setSelectedDateKey(null);
  };

  const handleDeleteEntry = (dateKey) => {
    const updated = { ...entries };
    delete updated[dateKey];
    setEntries(updated);
    saveEntries(updated);
    setSelectedDateKey(null);
  };

  // Export Data to Excel (.csv)
  const handleExportToExcel = async () => {
    try {
      const keys = Object.keys(entries).sort();
      if (keys.length === 0) {
        Alert.alert('No Data', 'You have not added any P&L entries yet.');
        return;
      }

      let csvContent = 'Date,Account,Type,Amount (INR)\n';
      keys.forEach((dateKey) => {
        const item = entries[dateKey];
        const amt = parseFloat(item.amount || 0);
        const type = amt >= 0 ? 'Profit' : 'Loss';
        const accountName = item.account || 'Main Account';
        csvContent += `"${dateKey}","${accountName}","${type}",${amt}\n`;
      });

      const fileUri = `${FileSystem.documentDirectory}pnl_report.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export P&L Report to Excel'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    }
  };

  // Import Data from CSV/Excel file
  const handleImportFromExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const lines = content.split(/\r?\n/);
      if (lines.length < 2) {
        Alert.alert('Import Error', 'The selected file is empty or invalid.');
        return;
      }

      let importedCount = 0;
      const updatedEntries = { ...entries };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map((item) => item.replace(/^"|"$/g, '').trim());

        if (parts.length >= 4) {
          const [dateKey, accountName, type, amountStr] = parts;

          if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            let numericVal = parseFloat(amountStr);
            if (!isNaN(numericVal)) {
              if (type && type.toLowerCase() === 'loss' && numericVal > 0) {
                numericVal = -numericVal;
              }
              updatedEntries[dateKey] = {
                amount: numericVal,
                account: accountName || selectedAccount,
              };
              importedCount++;
            }
          }
        }
      }

      if (importedCount > 0) {
        setEntries(updatedEntries);
        await saveEntries(updatedEntries);
        Alert.alert('Success', `Successfully imported ${importedCount} P&L records!`);
      } else {
        Alert.alert('Import Failed', 'No valid P&L records found in the file.');
      }
    } catch (error) {
      Alert.alert('Import Error', error.message);
    }
  };

  const totalPnL = calculateMonthlyPnL(entries, year, monthIndex, selectedAccount, hideWeekends);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <ViewTabs activeTab={activeTab} onSelectTab={setActiveTab} theme={theme} />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Navigation Bar */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <Text style={[styles.arrow, { color: theme.textPrimary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {MONTH_NAMES[monthIndex]} {year}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Text style={[styles.arrow, { color: theme.textPrimary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Header Cards */}
        <SummaryRow
          totalPnL={totalPnL}
          goal={goal}
          onOpenGoalModal={() => setShowGoalModal(true)}
          theme={theme}
        />

        {/* Filters & Actions */}
        <View style={styles.filterRow}>
          <TouchableOpacity onPress={() => setHideWeekends(!hideWeekends)}>
            <Text style={[styles.filterText, { color: theme.textSecondary }]}>
              Weekends: <Text style={{ color: theme.textPrimary }}>{hideWeekends ? 'OFF' : 'ON'}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowAccountModal(true)}>
            <Text style={[styles.filterText, { color: theme.accent }]}>
              {selectedAccount} ▾
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={handleImportFromExcel} style={[styles.exportBtn, { backgroundColor: theme.cardBg }]}>
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>📥 Import</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportToExcel} style={[styles.exportBtn, { backgroundColor: theme.cardBg }]}>
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>📊 Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Main View */}
        {activeTab === 'Month' && (
          <CalendarGrid
            year={year}
            monthIndex={monthIndex}
            entries={entries}
            hideWeekends={hideWeekends}
            onSelectDate={(key) => setSelectedDateKey(key)}
            theme={theme}
          />
        )}

        {activeTab === 'Year' && (
          <YearView
            year={year}
            entries={entries}
            selectedAccount={selectedAccount}
            theme={theme}
          />
        )}

        {activeTab === 'All time' && (
          <AllTimeView entries={entries} theme={theme} />
        )}
      </ScrollView>

      {/* Theme Toggle Floating Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={() => {
          const newTheme = !isDarkMode;
          setIsDarkMode(newTheme);
          saveThemeMode(newTheme);
        }}>
          <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>
            Theme: {isDarkMode ? '🌙 Dark' : '☀️ Light'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Entry Input Modal */}
      <EntryModal
        visible={!!selectedDateKey}
        dateKey={selectedDateKey}
        initialEntry={selectedDateKey ? entries[selectedDateKey] : null}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        onClose={() => setSelectedDateKey(null)}
        theme={theme}
      />

      {/* Goal Modal */}
      <GoalModal
        visible={showGoalModal}
        currentGoal={goal}
        onSave={(newGoal) => {
          setGoal(newGoal);
          saveGoal(newGoal);
        }}
        onClose={() => setShowGoalModal(false)}
        theme={theme}
      />

      {/* Account Modal */}
      <AccountModal
        visible={showAccountModal}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelect={(acc) => {
          setSelectedAccount(acc);
          saveSelectedAccount(acc);
        }}
        onClose={() => setShowAccountModal(false)}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  arrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  exportBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bottomBar: {
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
