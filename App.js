import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Modal,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- THEME DEFINITIONS ---
const darkTheme = {
  background: '#0A0E12',
  cardBg: '#161B22',
  border: '#21262D',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B949E',
  profitBg: '#133820',
  profitText: '#3FB950',
  lossBg: '#3D1314',
  lossText: '#F85149',
  accent: '#58A6FF',
  barBg: '#21262D',
};

const lightTheme = {
  background: '#F6F8FA',
  cardBg: '#FFFFFF',
  border: '#D0D7DE',
  textPrimary: '#24292F',
  textSecondary: '#57606A',
  profitBg: '#E6F7EC',
  profitText: '#1A7F37',
  lossBg: '#FFEBE9',
  lossText: '#CF222E',
  accent: '#0969DA',
  barBg: '#E1E4E8',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STORAGE_KEYS = {
  ENTRIES: '@pnl_entries',
  GOAL: '@pnl_goal',
  ACCOUNTS: '@pnl_accounts',
  SELECTED_ACCOUNT: '@pnl_selected_account',
  THEME_MODE: '@pnl_theme_mode',
};

// --- HELPER FUNCTIONS ---
function formatDateKey(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return year + '-' + m + '-' + d;
}

function calculateMonthlyPnL(entries = {}, year, monthIndex, selectedAccount = 'Main Account') {
  let total = 0;
  if (!entries || typeof entries !== 'object') return 0;

  Object.keys(entries).forEach((dateKey) => {
    const parts = dateKey.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (y === year && m === monthIndex + 1) {
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return; // Skip Weekends

        const entry = entries[dateKey];
        if (entry) {
          const amt = typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0);
          const acc = typeof entry === 'object' ? (entry.account || 'Main Account') : 'Main Account';
          if (selectedAccount === 'All' || acc === selectedAccount) {
            if (!isNaN(amt)) total += amt;
          }
        }
      }
    }
  });

  return Math.round(total);
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Runtime Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0E12', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#F44336', fontSize: 20, fontWeight: '700', marginBottom: 10 }}>App Runtime Error</Text>
          <Text style={{ color: '#FFF', fontSize: 14 }}>{this.state.error?.toString()}</Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

// --- SUB-COMPONENTS ---
function ViewTabs({ activeTab, onSelectTab, theme }) {
  const tabs = ['Week', 'Month', 'Year', 'All time'];
  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, isActive && { backgroundColor: theme.accent }]}
            onPress={() => onSelectTab(tab)}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#FFF' : theme.textSecondary }}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SummaryRow({ totalPnL, goal, onOpenGoalModal, theme }) {
  const roundedPnL = Math.round(totalPnL || 0);
  const roundedGoal = Math.round(goal || 0);
  const progressPercent = Math.min(Math.max((totalPnL / (goal || 1)) * 100, 0), 100);

  return (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Total P&L</Text>
        <Text style={[styles.pnlValue, { color: roundedPnL >= 0 ? theme.profitText : theme.lossText }]}>
          {roundedPnL >= 0 ? '+₹' + roundedPnL : '-₹' + Math.abs(roundedPnL)}
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.cardBg }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Monthly goal</Text>
          <TouchableOpacity onPress={onOpenGoalModal}>
            <Text style={{ color: theme.accent, fontSize: 14 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.barBg, { backgroundColor: theme.barBg }]}>
          <View style={[styles.barFill, { width: progressPercent + '%', backgroundColor: theme.accent }]} />
        </View>

        <View style={styles.goalFooter}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }}>
            ₹{Math.max(0, roundedPnL)}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>
            ₹{roundedGoal}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CalendarGrid({ year, monthIndex, entries, onSelectDate, theme }) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let firstDay = new Date(year, monthIndex, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const weekHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const gridCells = [];

  const initialPadCount = firstDay >= 5 ? 0 : firstDay;
  for (let i = 0; i < initialPadCount; i++) {
    gridCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    gridCells.push(day);
  }

  return (
    <View style={{ marginHorizontal: 12 }}>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {weekHeaders.map((header) => (
          <Text key={header} style={{ textAlign: 'center', fontSize: 12, fontWeight: '700', color: theme.textSecondary, width: '20%' }}>
            {header}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {gridCells.map((day, index) => {
          if (!day) return <View key={'empty-' + index} style={[styles.gridCard, { width: '18%' }]} />;

          const dateKey = formatDateKey(year, monthIndex, day);
          const entry = entries[dateKey];
          const rawAmount = entry ? parseFloat(entry.amount) : null;
          const amount = rawAmount !== null && !isNaN(rawAmount) ? Math.round(rawAmount) : null;

          let cardBg = theme.cardBg;
          let textColor = theme.textSecondary;

          if (amount !== null) {
            cardBg = amount > 0 ? theme.profitBg : amount < 0 ? theme.lossBg : theme.cardBg;
            textColor = amount > 0 ? theme.profitText : amount < 0 ? theme.lossText : theme.textSecondary;
          }

          return (
            <TouchableOpacity
              key={dateKey}
              style={[styles.gridCard, { backgroundColor: cardBg, width: '18%' }]}
              onPress={() => onSelectDate(dateKey)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }}>{day}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', textAlign: 'center', color: textColor }}>
                {amount === null ? '—' : amount > 0 ? '+₹' + amount : '-₹' + Math.abs(amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function WeekView({ currentDate, entries, onSelectDate, theme }) {
  const tempDate = new Date(currentDate);
  const dayOfWeek = tempDate.getDay();
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(tempDate);
  monday.setDate(tempDate.getDate() + distanceToMon);

  const days = [];
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const entry = entries[dateKey];
    const rawAmount = entry ? parseFloat(entry.amount) : null;
    const amount = rawAmount !== null && !isNaN(rawAmount) ? Math.round(rawAmount) : null;

    days.push({ label: dayLabels[i], dateNum: d.getDate(), dateKey, amount });
  }

  return (
    <View style={{ paddingHorizontal: 16, gap: 8 }}>
      {days.map((item) => {
        let cardBg = theme.cardBg;
        let textColor = theme.textSecondary;
        if (item.amount !== null) {
          cardBg = item.amount > 0 ? theme.profitBg : item.amount < 0 ? theme.lossBg : theme.cardBg;
          textColor = item.amount > 0 ? theme.profitText : item.amount < 0 ? theme.lossText : theme.textSecondary;
        }

        return (
          <TouchableOpacity
            key={item.dateKey}
            style={[styles.weekRowCard, { backgroundColor: cardBg, borderColor: theme.border }]}
            onPress={() => onSelectDate(item.dateKey)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, width: 36 }}>{item.label}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>{item.dateNum}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
              {item.amount === null ? '—' : item.amount > 0 ? '+₹' + item.amount : '-₹' + Math.abs(item.amount)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function YearView({ year, entries, selectedAccount, theme }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 }}>
      {MONTH_NAMES.map((name, index) => {
        const pnl = calculateMonthlyPnL(entries, year, index, selectedAccount);
        return (
          <View key={name} style={[styles.yearMonthCard, { backgroundColor: theme.cardBg }]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>{name}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: pnl >= 0 ? theme.profitText : theme.lossText }}>
              {pnl >= 0 ? '+₹' + pnl : '-₹' + Math.abs(pnl)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AllTimeView({ entries, theme }) {
  let totalProfit = 0;
  let totalLoss = 0;

  Object.values(entries || {}).forEach((entry) => {
    const val = parseFloat(entry?.amount || 0);
    if (val > 0) totalProfit += val;
    if (val < 0) totalLoss += Math.abs(val);
  });

  const netPnL = Math.round(totalProfit - totalLoss);
  const roundedProfit = Math.round(totalProfit);
  const roundedLoss = Math.round(totalLoss);

  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      <View style={[styles.allTimeCard, { backgroundColor: theme.cardBg }]}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Lifetime Net P&L</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: netPnL >= 0 ? theme.profitText : theme.lossText }}>
          {netPnL >= 0 ? '+₹' + netPnL : '-₹' + Math.abs(netPnL)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.halfCard, { backgroundColor: theme.profitBg }]}>
          <Text style={{ color: theme.profitText, fontSize: 12 }}>Total Profits</Text>
          <Text style={{ color: theme.profitText, fontSize: 18, fontWeight: '700' }}>+₹{roundedProfit}</Text>
        </View>
        <View style={[styles.halfCard, { backgroundColor: theme.lossBg }]}>
          <Text style={{ color: theme.lossText, fontSize: 12 }}>Total Losses</Text>
          <Text style={{ color: theme.lossText, fontSize: 18, fontWeight: '700' }}>-₹{roundedLoss}</Text>
        </View>
      </View>
    </View>
  );
}

function AnalyticsView({ year, entries = {}, selectedAccount = 'Main Account', accounts = ['Main Account', 'Trading'], currentDate = new Date(), theme }) {
  const [chartType, setChartType] = useState('All');

  const monthlyData = MONTH_NAMES.map((monthName, idx) => {
    const rawVal = calculateMonthlyPnL(entries, year, idx, selectedAccount);
    return { month: monthName.slice(0, 3), amount: Math.round(rawVal || 0) };
  });
  const maxMonthlyAbs = Math.max(...monthlyData.map((d) => Math.abs(d.amount)), 1);

  let profitDays = 0;
  let lossDays = 0;
  let totalProfitSum = 0;
  let totalLossSum = 0;

  Object.values(entries || {}).forEach((entry) => {
    const acc = entry?.account || 'Main Account';
    if (selectedAccount === 'All' || acc === selectedAccount) {
      const val = Math.round(parseFloat(entry?.amount || 0));
      if (val > 0) { profitDays++; totalProfitSum += val; }
      else if (val < 0) { lossDays++; totalLossSum += Math.abs(val); }
    }
  });

  const totalEntries = profitDays + lossDays;
  const winRate = totalEntries > 0 ? Math.round((profitDays / totalEntries) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={[styles.filterBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {['All', 'Monthly', 'Weekly', 'Equity'].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.filterBtn, chartType === mode && { backgroundColor: theme.accent }]}
            onPress={() => setChartType(mode)}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: chartType === mode ? '#FFF' : theme.textSecondary }}>
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>⚡ Key Indicators</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>Win Rate</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.accent }}>{winRate}%</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>Days Logged</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>{totalEntries}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 16 }]}>📅 Monthly Trend ({year})</Text>
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', height: 160, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {monthlyData.map((item, index) => {
            const heightPercent = Math.min((Math.abs(item.amount) / maxMonthlyAbs) * 100, 100);
            const isProfit = item.amount >= 0;
            return (
              <View key={index} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <View style={{ width: 12, height: '75%', justifyContent: 'flex-end' }}>
                  <View style={{ width: '100%', borderRadius: 4, height: item.amount === 0 ? '4%' : Math.max(heightPercent, 8) + '%', backgroundColor: isProfit ? theme.profitText : theme.lossText }} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textSecondary, marginTop: 6 }}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function AboutView({ isDarkMode, onToggleTheme, theme }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 12 }}>
      <View style={[styles.aboutCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>📈</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', color: theme.textPrimary }}>PnL & Progress Tracker</Text>
        <Text style={{ fontSize: 12, textAlign: 'center', color: theme.textSecondary, marginTop: 2 }}>Version 1.0.0 (Offline Release)</Text>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginTop: 8 }}>👨‍💻 Developer Information</Text>
      <View style={[styles.aboutCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.infoRow}><Text style={{ color: theme.textSecondary }}>Developer</Text><Text style={{ fontWeight: '600', color: theme.textPrimary }}>ItsMeParavai</Text></View>
        <View style={styles.infoRow}><Text style={{ color: theme.textSecondary }}>Engine</Text><Text style={{ fontWeight: '600', color: theme.textPrimary }}>React Native / Expo</Text></View>
        <View style={styles.infoRow}><Text style={{ color: theme.textSecondary }}>Pipeline</Text><Text style={{ fontWeight: '600', color: theme.accent }}>GitHub Actions CI/CD</Text></View>
        <View style={styles.infoRow}><Text style={{ color: theme.textSecondary }}>Privacy</Text><Text style={{ fontWeight: '600', color: theme.profitText }}>100% Offline & Local</Text></View>
      </View>
    </ScrollView>
  );
}

function BottomNavBar({ activeTab, onSelectTab, theme }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: '🏠' },
    { key: 'Analytics', label: 'Analytics', icon: '📊' },
    { key: 'About', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={{ alignItems: 'center', flex: 1 }} onPress={() => onSelectTab(tab.key)}>
            <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            <Text style={{ fontSize: 11, marginTop: 2, color: isActive ? theme.accent : theme.textSecondary, fontWeight: isActive ? '700' : '500' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- MAIN APP ---
function MainApp() {
  const [activeNavTab, setActiveNavTab] = useState('Home');
  const [activeTab, setActiveTab] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [entries, setEntries] = useState({});
  const [goal, setGoal] = useState(100);
  const [accounts, setAccounts] = useState(['Main Account', 'Trading']);
  const [selectedAccount, setSelectedAccount] = useState('Main Account');

  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    (async () => {
      try {
        const entriesJson = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
        const goalJson = await AsyncStorage.getItem(STORAGE_KEYS.GOAL);
        const themeJson = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);

        if (entriesJson) setEntries(JSON.parse(entriesJson));
        if (goalJson) setGoal(JSON.parse(goalJson));
        if (themeJson !== null) setIsDarkMode(JSON.parse(themeJson));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const handleSaveEntry = async (dateKey, amount) => {
    const updated = { ...entries, [dateKey]: { amount, account: selectedAccount } };
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updated));
    setSelectedDateKey(null);
  };

  const handleExportToExcel = async () => {
    try {
      const keys = Object.keys(entries).sort();
      if (keys.length === 0) {
        Alert.alert('No Data', 'No entries to export.');
        return;
      }

      let csvContent = 'Date,Account,Type,Amount (INR)\n';
      keys.forEach((key) => {
        const item = entries[key];
        const amt = Math.round(parseFloat(item?.amount || 0));
        csvContent += '"' + key + '","' + (item?.account || 'Main Account') + '","' + (amt >= 0 ? 'Profit' : 'Loss') + '",' + amt + '\n';
      });

      const fileUri = FileSystem.documentDirectory + 'pnl_report.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export P&L Report' });
      }
    } catch (e) {
      Alert.alert('Export Failed', e.message);
    }
  };

  const handleImportFromExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', '*/*'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const lines = content.split(/\r?\n/);
      const updated = { ...entries };
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 4 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
          let val = Math.round(parseFloat(parts[3]));
          if (!isNaN(val)) {
            if (parts[2].toLowerCase() === 'loss' && val > 0) val = -val;
            updated[parts[0]] = { amount: val, account: parts[1] || selectedAccount };
            count++;
          }
        }
      }

      if (count > 0) {
        setEntries(updated);
        await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updated));
        Alert.alert('Success', 'Imported ' + count + ' records!');
      }
    } catch (e) {
      Alert.alert('Import Failed', e.message);
    }
  };

  const totalPnL = calculateMonthlyPnL(entries, year, monthIndex, selectedAccount);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {activeNavTab === 'Home' && (
        <>
          <ViewTabs activeTab={activeTab} onSelectTab={setActiveTab} theme={theme} />

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.navHeader}>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(year, monthIndex - 1, 1))}>
                <Text style={[styles.arrow, { color: theme.textPrimary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {MONTH_NAMES[monthIndex]} {year}
              </Text>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(year, monthIndex + 1, 1))}>
                <Text style={[styles.arrow, { color: theme.textPrimary }]}>›</Text>
              </TouchableOpacity>
            </View>

            <SummaryRow totalPnL={totalPnL} goal={goal} onOpenGoalModal={() => {}} theme={theme} />

            <View style={styles.filterRow}>
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}>{selectedAccount}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={handleImportFromExcel} style={[styles.exportBtn, { backgroundColor: theme.cardBg }]}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>📥 Import</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleExportToExcel} style={[styles.exportBtn, { backgroundColor: theme.cardBg }]}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>📊 Excel</Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeTab === 'Week' && <WeekView currentDate={currentDate} entries={entries} onSelectDate={(k) => setSelectedDateKey(k)} theme={theme} />}
            {activeTab === 'Month' && <CalendarGrid year={year} monthIndex={monthIndex} entries={entries} onSelectDate={(k) => setSelectedDateKey(k)} theme={theme} />}
            {activeTab === 'Year' && <YearView year={year} entries={entries} selectedAccount={selectedAccount} theme={theme} />}
            {activeTab === 'All time' && <AllTimeView entries={entries} theme={theme} />}
          </ScrollView>
        </>
      )}

      {activeNavTab === 'Analytics' && <AnalyticsView year={year} entries={entries} selectedAccount={selectedAccount} accounts={accounts} currentDate={currentDate} theme={theme} />}
      {activeNavTab === 'About' && <AboutView isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} theme={theme} />}

      <BottomNavBar activeTab={activeNavTab} onSelectTab={setActiveNavTab} theme={theme} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 8 : 0,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  pnlValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCard: {
    height: 60,
    borderRadius: 10,
    padding: 6,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  yearMonthCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
  },
  allTimeCard: {
    padding: 20,
    borderRadius: 14,
  },
  halfCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  aboutCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
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
  exportBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
  },
  chartCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
  },
});
