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
  background: '#0D1117',
  cardBg: '#161B22',
  cardBorder: '#30363D',
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  profitBg: '#0E2A1F',
  profitText: '#3FB950',
  lossBg: '#2D1214',
  lossText: '#F85149',
  accent: '#58A6FF',
  barBg: '#21262D',
};

const lightTheme = {
  background: '#F6F8FA',
  cardBg: '#FFFFFF',
  cardBorder: '#D0D7DE',
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

function calculateMonthlyPnL(entries, year, monthIndex, selectedAccount) {
  let total = 0;
  if (!entries || typeof entries !== 'object') return 0;
  const targetAcc = selectedAccount || 'Main Account';

  Object.keys(entries).forEach((dateKey) => {
    const parts = dateKey.split('-').map(Number);
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];

      if (y === year && m === monthIndex + 1) {
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return;

        const entry = entries[dateKey];
        if (entry) {
          const amt = typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0);
          const acc = typeof entry === 'object' ? (entry.account || 'Main Account') : 'Main Account';
          if (targetAcc === 'All' || acc === targetAcc) {
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
      const errStr = this.state.error ? this.state.error.toString() : 'Unknown error';
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0D1117', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#F85149', fontSize: 20, fontWeight: '700', marginBottom: 10 }}>Dashboard Error</Text>
          <Text style={{ color: '#FFF', fontSize: 14 }}>{errStr}</Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

// --- MODALS ---
function EntryModal({ visible, dateKey, initialEntry, onSave, onDelete, onClose, theme }) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (initialEntry) {
      const val = typeof initialEntry === 'object' ? initialEntry.amount : initialEntry;
      setAmount(val !== undefined && val !== null ? String(val) : '');
    } else {
      setAmount('');
    }
  }, [initialEntry, visible]);

  if (!visible) return null;

  const handleSave = () => {
    const numeric = parseFloat(amount);
    if (isNaN(numeric)) {
      Alert.alert('Invalid Entry', 'Please enter a valid numeric amount.');
      return;
    }
    onSave(dateKey, numeric);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
            Log P&L ({dateKey})
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
            placeholder="Enter P&L Amount (e.g. 500 or -300)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          <View style={styles.modalBtnRow}>
            {initialEntry && (
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.lossBg }]} onPress={() => onDelete(dateKey)}>
                <Text style={{ color: theme.lossText, fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.cardBorder }]} onPress={onClose}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function GoalModal({ visible, currentGoal, onSave, onClose, theme }) {
  const [goalVal, setGoalVal] = useState(String(currentGoal || 100));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Monthly Goal (INR)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
            keyboardType="numeric"
            value={goalVal}
            onChangeText={setGoalVal}
          />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.cardBorder }]} onPress={onClose}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: theme.accent }]}
              onPress={() => {
                const num = parseFloat(goalVal);
                if (!isNaN(num) && num > 0) {
                  onSave(num);
                  onClose();
                }
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AccountModal({ visible, accounts, selectedAccount, onSelect, onClose, theme }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Trading Account</Text>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc}
              style={[
                styles.accOptionBtn,
                { backgroundColor: selectedAccount === acc ? theme.accent : theme.background }
              ]}
              onPress={() => {
                onSelect(acc);
                onClose();
              }}
            >
              <Text style={{ color: selectedAccount === acc ? '#FFF' : theme.textPrimary, fontWeight: '700' }}>{acc}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.cardBorder, marginTop: 10 }]} onPress={onClose}>
            <Text style={{ color: theme.textSecondary, fontWeight: '600', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// --- SUB VIEWS ---
function ViewTabs({ activeTab, onSelectTab, theme }) {
  const tabs = ['Week', 'Month', 'Year', 'All time'];
  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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
      <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Total P&L</Text>
        <Text style={[styles.pnlValue, { color: roundedPnL >= 0 ? theme.profitText : theme.lossText }]}>
          {roundedPnL >= 0 ? '+₹' + roundedPnL : '-₹' + Math.abs(roundedPnL)}
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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
              style={[styles.gridCard, { backgroundColor: cardBg, borderColor: theme.cardBorder, width: '18%' }]}
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
            style={[styles.weekRowCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}
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
          <View key={name} style={[styles.yearMonthCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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
    const val = parseFloat(entry && entry.amount ? entry.amount : 0);
    if (val > 0) totalProfit += val;
    if (val < 0) totalLoss += Math.abs(val);
  });

  const netPnL = Math.round(totalProfit - totalLoss);
  const roundedProfit = Math.round(totalProfit);
  const roundedLoss = Math.round(totalLoss);

  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      <View style={[styles.allTimeCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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

// --- TRADER DASHBOARD ANALYTICS ---
function AnalyticsView({ year, entries, selectedAccount, accounts, currentDate, theme }) {
  const safeEntries = entries || {};
  const targetAcc = selectedAccount || 'Main Account';
  const safeAccounts = accounts || ['Main Account', 'Trading'];

  const monthlyData = MONTH_NAMES.map((monthName, idx) => {
    const rawVal = calculateMonthlyPnL(safeEntries, year, idx, targetAcc);
    return { month: monthName.slice(0, 3), amount: Math.round(rawVal || 0) };
  });
  const maxMonthlyAbs = Math.max(...monthlyData.map((d) => Math.abs(d.amount)), 1);

  const getWeeklyBreakdown = () => {
    const monthIdx = currentDate ? currentDate.getMonth() : 0;
    const currYear = currentDate ? currentDate.getFullYear() : year;
    const firstDayOfMonth = new Date(currYear, monthIdx, 1);
    const lastDayOfMonth = new Date(currYear, monthIdx + 1, 0);

    const weeks = [];
    let currentWeekStart = new Date(firstDayOfMonth);
    let weekNum = 1;

    while (currentWeekStart <= lastDayOfMonth) {
      let weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDayOfMonth) weekEnd = new Date(lastDayOfMonth);

      let weekTotal = 0;
      let d = new Date(currentWeekStart);
      while (d <= weekEnd) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const y = d.getFullYear();
          const m = d.getMonth();
          const dateNum = d.getDate();
          const key = formatDateKey(y, m, dateNum);
          const entry = safeEntries[key];
          if (entry) {
            const acc = entry.account || 'Main Account';
            if (targetAcc === 'All' || acc === targetAcc) {
              const amt = Math.round(parseFloat(entry.amount || 0));
              if (!isNaN(amt)) weekTotal += amt;
            }
          }
        }
        d.setDate(d.getDate() + 1);
      }

      weeks.push({
        label: 'W' + weekNum,
        range: currentWeekStart.getDate() + ' - ' + weekEnd.getDate() + ' ' + MONTH_NAMES[monthIdx].slice(0, 3),
        amount: Math.round(weekTotal),
      });

      weekNum++;
      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
    }
    return weeks;
  };

  const weeklyData = getWeeklyBreakdown();
  const maxWeeklyAbs = Math.max(...weeklyData.map((w) => Math.abs(w.amount)), 1);

  const getCumulativeData = () => {
    const sortedKeys = Object.keys(safeEntries).sort();
    let runningTotal = 0;
    const curve = [];

    sortedKeys.forEach((key) => {
      const parts = key.split('-').map(Number);
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];

        const dateObj = new Date(y, m - 1, d);
        if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6) {
          const entry = safeEntries[key];
          const acc = entry && entry.account ? entry.account : 'Main Account';
          if (targetAcc === 'All' || acc === targetAcc) {
            const amt = Math.round(parseFloat(entry && entry.amount ? entry.amount : 0));
            if (!isNaN(amt)) {
              runningTotal += amt;
              curve.push({
                dateKey: key,
                label: d + '/' + m,
                total: runningTotal,
              });
            }
          }
        }
      }
    });

    if (curve.length > 10) {
      const step = Math.ceil(curve.length / 8);
      return curve.filter((_, idx) => idx % step === 0 || idx === curve.length - 1);
    }
    return curve;
  };

  const cumulativeData = getCumulativeData();
  const maxCumulativeAbs = Math.max(...cumulativeData.map((c) => Math.abs(c.total)), 1);

  const accountData = safeAccounts.map((accName) => {
    let accTotal = 0;
    let accProfits = 0;
    let accLosses = 0;

    Object.values(safeEntries).forEach((entry) => {
      const acc = entry && entry.account ? entry.account : 'Main Account';
      if (acc === accName) {
        const amt = Math.round(parseFloat(entry && entry.amount ? entry.amount : 0));
        if (!isNaN(amt)) {
          accTotal += amt;
          if (amt > 0) accProfits += amt;
          if (amt < 0) accLosses += Math.abs(amt);
        }
      }
    });

    return { name: accName, net: accTotal, profits: accProfits, losses: accLosses };
  });

  let profitDays = 0;
  let lossDays = 0;
  let totalProfitSum = 0;
  let totalLossSum = 0;
  let maxSingleProfit = 0;
  let maxSingleLoss = 0;

  Object.values(safeEntries).forEach((entry) => {
    const acc = entry && entry.account ? entry.account : 'Main Account';
    if (targetAcc === 'All' || acc === targetAcc) {
      const val = Math.round(parseFloat(entry && entry.amount ? entry.amount : 0));
      if (val > 0) {
        profitDays++;
        totalProfitSum += val;
        if (val > maxSingleProfit) maxSingleProfit = val;
      } else if (val < 0) {
        lossDays++;
        totalLossSum += Math.abs(val);
        if (Math.abs(val) > maxSingleLoss) maxSingleLoss = Math.abs(val);
      }
    }
  });

  const totalEntries = profitDays + lossDays;
  const winRate = totalEntries > 0 ? Math.round((profitDays / totalEntries) * 100) : 0;
  const avgProfit = profitDays > 0 ? Math.round(totalProfitSum / profitDays) : 0;
  const avgLoss = lossDays > 0 ? Math.round(totalLossSum / lossDays) : 0;
  const netTotalPnL = totalProfitSum - totalLossSum;
  const profitFactor = totalLossSum > 0 ? (totalProfitSum / totalLossSum).toFixed(2) : (totalProfitSum > 0 ? '∞' : '0.00');

  return (
    <ScrollView contentContainerStyle={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <Text style={[styles.dashboardTitle, { color: theme.textPrimary }]}>📊 Performance Dashboard</Text>
        <Text style={[styles.dashboardSub, { color: theme.textSecondary }]}>
          Account: <Text style={{ color: theme.accent, fontWeight: '700' }}>{targetAcc}</Text>
        </Text>
      </View>

      {/* HERO NET REALIZED P&L */}
      <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>NET REALIZED P&L</Text>
        <Text style={[styles.heroValue, { color: netTotalPnL >= 0 ? theme.profitText : theme.lossText }]}>
          {netTotalPnL >= 0 ? '+₹' + netTotalPnL : '-₹' + Math.abs(netTotalPnL)}
        </Text>

        <View style={styles.heroRow}>
          <View style={styles.heroSubItem}>
            <Text style={[styles.heroSubLabel, { color: theme.textSecondary }]}>Profit Factor</Text>
            <Text style={[styles.heroSubVal, { color: theme.textPrimary }]}>{profitFactor}</Text>
          </View>

          <View style={styles.heroSubItem}>
            <Text style={[styles.heroSubLabel, { color: theme.textSecondary }]}>Win Rate</Text>
            <Text style={[styles.heroSubVal, { color: theme.accent }]}>{winRate}%</Text>
          </View>

          <View style={styles.heroSubItem}>
            <Text style={[styles.heroSubLabel, { color: theme.textSecondary }]}>Total Logged</Text>
            <Text style={[styles.heroSubVal, { color: theme.textPrimary }]}>{totalEntries} Days</Text>
          </View>
        </View>
      </View>

      {/* KPI GRID */}
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.textPrimary }]}>⚡ Key Performance Indicators</Text>
      </View>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: theme.profitBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.kpiLabel, { color: theme.profitText }]}>Avg Win / Day</Text>
          <Text style={[styles.kpiValue, { color: theme.profitText }]}>+₹{avgProfit}</Text>
          <Text style={[styles.kpiSub, { color: theme.profitText }]}>Best: +₹{maxSingleProfit}</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.lossBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.kpiLabel, { color: theme.lossText }]}>Avg Loss / Day</Text>
          <Text style={[styles.kpiValue, { color: theme.lossText }]}>-₹{avgLoss}</Text>
          <Text style={[styles.kpiSub, { color: theme.lossText }]}>Worst: -₹{maxSingleLoss}</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Green Days</Text>
          <Text style={[styles.kpiValue, { color: theme.profitText }]}>{profitDays}</Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>Profitable sessions</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Red Days</Text>
          <Text style={[styles.kpiValue, { color: theme.lossText }]}>{lossDays}</Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>Losing sessions</Text>
        </View>
      </View>

      {/* WIN/LOSS GAUGE */}
      <View style={[styles.dashboardWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.widgetTopRow}>
          <Text style={[styles.widgetTitleText, { color: theme.textPrimary }]}>🎯 Session Ratio</Text>
          <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>{winRate}% Win Consistency</Text>
        </View>

        <View style={styles.gaugeTrack}>
          <View style={{ height: '100%', width: winRate + '%', backgroundColor: theme.profitText }} />
          <View style={{ height: '100%', width: (100 - winRate) + '%', backgroundColor: theme.lossText }} />
        </View>

        <View style={styles.gaugeFooterRow}>
          <Text style={{ color: theme.profitText, fontSize: 12, fontWeight: '700' }}>🟢 Win Days: {profitDays}</Text>
          <Text style={{ color: theme.lossText, fontSize: 12, fontWeight: '700' }}>🔴 Loss Days: {lossDays}</Text>
        </View>
      </View>

      {/* MONTHLY P&L BAR CHART */}
      <View style={[styles.dashboardWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.widgetTitleText, { color: theme.textPrimary }]}>📅 Monthly P&L Trend ({year})</Text>

        <View style={styles.chartContainer}>
          {monthlyData.map((item, index) => {
            const heightPercent = Math.min((Math.abs(item.amount) / maxMonthlyAbs) * 100, 100);
            const isProfit = item.amount >= 0;
            let valDisplay = '';
            if (item.amount > 0) valDisplay = '+' + item.amount;
            else if (item.amount < 0) valDisplay = '' + item.amount;

            return (
              <View key={index} style={styles.chartColumn}>
                <Text style={[styles.chartValText, { color: isProfit ? theme.profitText : theme.lossText }]}>
                  {valDisplay}
                </Text>
                <View style={styles.chartTrack}>
                  <View style={{ width: '100%', borderRadius: 4, height: item.amount === 0 ? '4%' : Math.max(heightPercent, 8) + '%', backgroundColor: isProfit ? theme.profitText : theme.lossText }} />
                </View>
                <Text style={[styles.chartXLabel, { color: theme.textSecondary }]}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* WEEKLY BREAKDOWN */}
      <View style={[styles.dashboardWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.widgetTitleText, { color: theme.textPrimary }]}>
          📆 Weekly Breakdown ({MONTH_NAMES[currentDate ? currentDate.getMonth() : 0]})
        </Text>

        <View style={{ marginTop: 10 }}>
          {weeklyData.map((item, index) => {
            const isProfit = item.amount >= 0;
            const barWidthPercent = Math.min((Math.abs(item.amount) / maxWeeklyAbs) * 100, 100);

            return (
              <View key={index} style={styles.weeklyRow}>
                <View style={{ width: 75 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>{item.label}</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>{item.range}</Text>
                </View>

                <View style={styles.weeklyTrack}>
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 5,
                      width: item.amount === 0 ? '2%' : Math.max(barWidthPercent, 6) + '%',
                      backgroundColor: isProfit ? theme.profitText : theme.lossText,
                    }}
                  />
                </View>

                <Text style={{ fontSize: 12, fontWeight: '700', width: 65, textAlign: 'right', color: isProfit ? theme.profitText : theme.lossText }}>
                  {item.amount >= 0 ? '+₹' + item.amount : '-₹' + Math.abs(item.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* CUMULATIVE EQUITY CURVE */}
      <View style={[styles.dashboardWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.widgetTitleText, { color: theme.textPrimary }]}>📈 Cumulative Equity Trajectory</Text>

        {cumulativeData.length === 0 ? (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>
            No trade data recorded yet to render trajectory curve.
          </Text>
        ) : (
          <View style={styles.chartContainer}>
            {cumulativeData.map((item, index) => {
              const isProfit = item.total >= 0;
              const heightPercent = Math.min((Math.abs(item.total) / maxCumulativeAbs) * 100, 100);
              const displayTotal = item.total >= 0 ? '+' + item.total : '' + item.total;

              return (
                <View key={index} style={styles.chartColumn}>
                  <Text style={[styles.chartValText, { color: isProfit ? theme.profitText : theme.lossText }]}>
                    {displayTotal}
                  </Text>
                  <View style={styles.chartTrack}>
                    <View style={{ width: '100%', borderRadius: 4, height: Math.max(heightPercent, 10) + '%', backgroundColor: isProfit ? theme.accent : theme.lossText }} />
                  </View>
                  <Text style={[styles.chartXLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ACCOUNT PERFORMANCE */}
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.textPrimary }]}>💼 Account Performance Breakdown</Text>
      </View>

      <View style={{ gap: 10 }}>
        {accountData.map((acc) => (
          <View key={acc.name} style={[styles.accountCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>{acc.name}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: acc.net >= 0 ? theme.profitText : theme.lossText }}>
                {acc.net >= 0 ? '+₹' + acc.net : '-₹' + Math.abs(acc.net)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: theme.profitText, fontSize: 12, fontWeight: '600' }}>Profits: +₹{acc.profits}</Text>
              <Text style={{ color: theme.lossText, fontSize: 12, fontWeight: '600' }}>Losses: -₹{acc.losses}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function AboutView({ isDarkMode, onToggleTheme, theme }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 12 }}>
      <View style={[styles.aboutCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>📈</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', color: theme.textPrimary }}>PnL & Progress Tracker</Text>
        <Text style={{ fontSize: 12, textAlign: 'center', color: theme.textSecondary, marginTop: 2 }}>Version 1.0.0 (Offline Release)</Text>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginTop: 8 }}>👨‍💻 Developer Information</Text>
      <View style={[styles.aboutCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
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
    <View style={[styles.bottomNav, { backgroundColor: theme.cardBg, borderTopColor: theme.cardBorder }]}>
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

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

  const handleDeleteEntry = async (dateKey) => {
    const updated = { ...entries };
    delete updated[dateKey];
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
        const amt = Math.round(parseFloat(item && item.amount ? item.amount : 0));
        csvContent += '"' + key + '","' + (item && item.account ? item.account : 'Main Account') + '","' + (amt >= 0 ? 'Profit' : 'Loss') + '",' + amt + '\n';
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

            <SummaryRow totalPnL={totalPnL} goal={goal} onOpenGoalModal={() => setShowGoalModal(true)} theme={theme} />

            <View style={styles.filterRow}>
              <TouchableOpacity onPress={() => setShowAccountModal(true)}>
                <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}>{selectedAccount} ▾</Text>
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

            {activeTab === 'Week' && <WeekView currentDate={currentDate} entries={entries} onSelectDate={(k) => setSelectedDateKey(k)} theme={theme} />}
            {activeTab === 'Month' && <CalendarGrid year={year} monthIndex={monthIndex} entries={entries} onSelectDate={(k) => setSelectedDateKey(k)} theme={theme} />}
            {activeTab === 'Year' && <YearView year={year} entries={entries} selectedAccount={selectedAccount} theme={theme} />}
            {activeTab === 'All time' && <AllTimeView entries={entries} theme={theme} />}
          </ScrollView>
        </>
      )}

      {activeNavTab === 'Analytics' && (
        <AnalyticsView
          year={year}
          entries={entries}
          selectedAccount={selectedAccount}
          accounts={accounts}
          currentDate={currentDate}
          theme={theme}
        />
      )}

      {activeNavTab === 'About' && (
        <AboutView
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          theme={theme}
        />
      )}

      <BottomNavBar activeTab={activeNavTab} onSelectTab={setActiveNavTab} theme={theme} />

      <EntryModal
        visible={!!selectedDateKey}
        dateKey={selectedDateKey}
        initialEntry={selectedDateKey ? entries[selectedDateKey] : null}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        onClose={() => setSelectedDateKey(null)}
        theme={theme}
      />

      <GoalModal
        visible={showGoalModal}
        currentGoal={goal}
        onSave={async (g) => {
          setGoal(g);
          await AsyncStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(g));
        }}
        onClose={() => setShowGoalModal(false)}
        theme={theme}
      />

      <AccountModal
        visible={showAccountModal}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelect={(acc) => setSelectedAccount(acc)}
        onClose={() => setShowAccountModal(false)}
        theme={theme}
      />
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
    borderWidth: 1,
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
    justify.content: 'space-between',
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
    justify.content: 'space-between',
  },
  gridCard: {
    height: 60,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    justify.content: 'space-between',
    marginBottom: 4,
  },
  weekRowCard: {
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  yearMonthCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  allTimeCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
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
    justify.content: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  bottomNav: {
    flexDirection: 'row',
    justify.style || 'space-around',
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
    justify.content: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  exportBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justify.content: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  accOptionBtn: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },

  // DASHBOARD STYLES
  dashboardContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  dashboardHeader: {
    marginBottom: 12,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  dashboardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  heroRow: {
    flexDirection: 'row',
    justify.content: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  heroSubItem: {
    alignItems: 'flex-start',
  },
  heroSubLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  heroSubVal: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  widgetHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 10,
  },
  dashboardWidget: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  widgetTopRow: {
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center',
  },
  widgetTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gaugeTrack: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#21262D',
    marginTop: 10,
  },
  gaugeFooterRow: {
    flexDirection: 'row',
    justify.content: 'space-between',
    marginTop: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-end',
    justify.content: 'space-between',
    marginTop: 10,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justify.content: 'flex-end',
  },
  chartValText: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  chartTrack: {
    width: 12,
    height: '75%',
    justify.content: 'flex-end',
  },
  chartXLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weeklyTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    marginHorizontal: 10,
    justify.content: 'center',
  },
  accountCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
});
