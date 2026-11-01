import React, { useState, useEffect, useRef } from 'react';
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
  Linking,
  Animated,
  Easing,
  UIManager,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- THEMES ---
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
  THEME_MODE: '@pnl_theme_mode',
};

// --- HELPER FUNCTIONS ---
function formatDateKey(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return year + '-' + m + '-' + d;
}

function formatPnLText(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  if (amount > 0) return '+₹' + amount;
  if (amount < 0) return '-₹' + Math.abs(amount);
  return '₹0';
}

function getWeekMonToFri(currentDate) {
  const tempDate = new Date(currentDate);
  const dayOfWeek = tempDate.getDay();
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(tempDate);
  monday.setDate(tempDate.getDate() + distanceToMon);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return { monday, friday };
}

function calculateWeeklyPnL(entries, currentDate) {
  let total = 0;
  if (!entries || typeof entries !== 'object') return 0;

  const { monday } = getWeekMonToFri(currentDate);

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const entry = entries[dateKey];
    if (entry) {
      const amt = typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0);
      if (!isNaN(amt)) total += amt;
    }
  }

  return Math.round(total);
}

function calculateMonthlyPnL(entries, year, monthIndex) {
  let total = 0;
  if (!entries || typeof entries !== 'object') return 0;

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
          if (!isNaN(amt)) total += amt;
        }
      }
    }
  });

  return Math.round(total);
}

// --- ANIMATION WRAPPERS ---
function FadeInView({ style, children, keyTrigger }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(12);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [keyTrigger]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

function ScaleButton({ onPress, style, children, activeOpacity = 0.8 }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

function AnimatedProgressBar({ progressPercent, theme }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressPercent,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.barBg, { backgroundColor: theme.barBg }]}>
      <Animated.View style={[styles.barFill, { width: widthStyle, backgroundColor: theme.accent }]} />
    </View>
  );
}

function AnimatedGaugeBar({ fillPercent, theme }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: fillPercent,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fillPercent]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{ height: '100%', width: widthStyle, backgroundColor: theme.profitText }} />
  );
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
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (initialEntry) {
        const val = typeof initialEntry === 'object' ? initialEntry.amount : initialEntry;
        setAmount(val !== undefined && val !== null ? String(val) : '');
      } else {
        setAmount('');
      }
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
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
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, transform: [{ scale: scaleAnim }] }]}>
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
              <ScaleButton style={[styles.modalBtn, { backgroundColor: theme.lossBg }]} onPress={() => onDelete(dateKey)}>
                <Text style={{ color: theme.lossText, fontWeight: '700' }}>Delete</Text>
              </ScaleButton>
            )}
            <ScaleButton style={[styles.modalBtn, { backgroundColor: theme.cardBorder }]} onPress={onClose}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </ScaleButton>
            <ScaleButton style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
            </ScaleButton>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function GoalModal({ visible, currentGoal, onSave, onClose, theme }) {
  const [goalVal, setGoalVal] = useState(String(currentGoal || 100));
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Set Monthly Goal (INR)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.cardBorder }]}
            keyboardType="numeric"
            value={goalVal}
            onChangeText={setGoalVal}
          />
          <View style={styles.modalBtnRow}>
            <ScaleButton style={[styles.modalBtn, { backgroundColor: theme.cardBorder }]} onPress={onClose}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </ScaleButton>
            <ScaleButton
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
            </ScaleButton>
          </View>
        </Animated.View>
      </Animated.View>
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

function SummaryRow({ totalPnL, goal, activeTab, onOpenGoalModal, theme }) {
  const roundedPnL = Math.round(totalPnL || 0);
  const roundedGoal = Math.round(goal || 0);
  const progressPercent = Math.min(Math.max((totalPnL / (goal || 1)) * 100, 0), 100);

  return (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>
          {activeTab === 'Week' ? 'Weekly P&L' : 'Total P&L'}
        </Text>
        <Text style={[styles.pnlValue, { color: roundedPnL > 0 ? theme.profitText : roundedPnL < 0 ? theme.lossText : theme.textPrimary }]}>
          {formatPnLText(roundedPnL)}
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Monthly goal</Text>
          <TouchableOpacity onPress={onOpenGoalModal}>
            <Text style={{ color: theme.accent, fontSize: 14 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        <AnimatedProgressBar progressPercent={progressPercent} theme={theme} />

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
          const rawAmount = entry ? (typeof entry === 'object' ? parseFloat(entry.amount) : parseFloat(entry)) : null;
          const amount = rawAmount !== null && !isNaN(rawAmount) ? Math.round(rawAmount) : null;

          let cardBg = theme.cardBg;
          let textColor = theme.textSecondary;

          if (amount !== null) {
            cardBg = amount > 0 ? theme.profitBg : amount < 0 ? theme.lossBg : theme.cardBg;
            textColor = amount > 0 ? theme.profitText : amount < 0 ? theme.lossText : theme.textSecondary;
          }

          return (
            <ScaleButton
              key={dateKey}
              style={[styles.gridCard, { backgroundColor: cardBg, borderColor: theme.cardBorder, width: '18%' }]}
              onPress={() => onSelectDate(dateKey)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textPrimary }}>{day}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', textAlign: 'center', color: textColor }}>
                {formatPnLText(amount)}
              </Text>
            </ScaleButton>
          );
        })}
      </View>
    </View>
  );
}

function WeekView({ currentDate, entries, onSelectDate, theme }) {
  const { monday } = getWeekMonToFri(currentDate);

  const days = [];
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    const entry = entries[dateKey];
    const rawAmount = entry ? (typeof entry === 'object' ? parseFloat(entry.amount) : parseFloat(entry)) : null;
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
          <ScaleButton
            key={item.dateKey}
            style={[styles.weekRowCard, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}
            onPress={() => onSelectDate(item.dateKey)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, width: 36 }}>{item.label}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>{item.dateNum}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
              {formatPnLText(item.amount)}
            </Text>
          </ScaleButton>
        );
      })}
    </View>
  );
}

function YearView({ year, entries, theme }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 }}>
      {MONTH_NAMES.map((name, index) => {
        const pnl = calculateMonthlyPnL(entries, year, index);
        return (
          <View key={name} style={[styles.yearMonthCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>{name}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: pnl > 0 ? theme.profitText : pnl < 0 ? theme.lossText : theme.textPrimary }}>
              {formatPnLText(pnl)}
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
    const val = parseFloat(entry && typeof entry === 'object' ? entry.amount : entry);
    if (!isNaN(val)) {
      if (val > 0) totalProfit += val;
      if (val < 0) totalLoss += Math.abs(val);
    }
  });

  const netPnL = Math.round(totalProfit - totalLoss);
  const roundedProfit = Math.round(totalProfit);
  const roundedLoss = Math.round(totalLoss);

  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      <View style={[styles.allTimeCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Lifetime Net P&L</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: netPnL > 0 ? theme.profitText : netPnL < 0 ? theme.lossText : theme.textPrimary }}>
          {formatPnLText(netPnL)}
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
function AnalyticsView({ year, entries, currentDate, theme }) {
  const safeEntries = entries || {};

  const monthlyData = MONTH_NAMES.map((monthName, idx) => {
    const rawVal = calculateMonthlyPnL(safeEntries, year, idx);
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
            const amt = Math.round(typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0));
            if (!isNaN(amt)) weekTotal += amt;
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
          const amt = Math.round(typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0));
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
    });

    if (curve.length > 10) {
      const step = Math.ceil(curve.length / 8);
      return curve.filter((_, idx) => idx % step === 0 || idx === curve.length - 1);
    }
    return curve;
  };

  const cumulativeData = getCumulativeData();
  const maxCumulativeAbs = Math.max(...cumulativeData.map((c) => Math.abs(c.total)), 1);

  let profitDays = 0;
  let lossDays = 0;
  let totalProfitSum = 0;
  let totalLossSum = 0;
  let maxSingleProfit = 0;
  let maxSingleLoss = 0;

  Object.values(safeEntries).forEach((entry) => {
    const val = Math.round(typeof entry === 'object' ? parseFloat(entry.amount || 0) : parseFloat(entry || 0));
    if (val > 0) {
      profitDays++;
      totalProfitSum += val;
      if (val > maxSingleProfit) maxSingleProfit = val;
    } else if (val < 0) {
      lossDays++;
      totalLossSum += Math.abs(val);
      if (Math.abs(val) > maxSingleLoss) maxSingleLoss = Math.abs(val);
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
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>NET REALIZED P&L</Text>
        <Text style={[styles.heroValue, { color: netTotalPnL > 0 ? theme.profitText : netTotalPnL < 0 ? theme.lossText : theme.textPrimary }]}>
          {formatPnLText(netTotalPnL)}
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

      <View style={[styles.dashboardWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.widgetTopRow}>
          <Text style={[styles.widgetTitleText, { color: theme.textPrimary }]}>🎯 Session Ratio</Text>
          <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>{winRate}% Win Consistency</Text>
        </View>

        <View style={styles.gaugeTrack}>
          <AnimatedGaugeBar fillPercent={winRate} theme={theme} />
          <View style={{ height: '100%', width: (100 - winRate) + '%', backgroundColor: theme.lossText }} />
        </View>

        <View style={styles.gaugeFooterRow}>
          <Text style={{ color: theme.profitText, fontSize: 12, fontWeight: '700' }}>🟢 Win Days: {profitDays}</Text>
          <Text style={{ color: theme.lossText, fontSize: 12, fontWeight: '700' }}>🔴 Loss Days: {lossDays}</Text>
        </View>
      </View>

      <View style={[styles.dashboardWidget, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.widgetTitleText, { color: theme.textPrimary }]}>📅 Monthly P&L Trend ({year})</Text>

        <View style={styles.chartContainer}>
          {monthlyData.map((item, index) => {
            const heightPercent = Math.min((Math.abs(item.amount) / maxMonthlyAbs) * 100, 100);
            const isProfit = item.amount >= 0;
            let valDisplay = formatPnLText(item.amount);

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
                  {formatPnLText(item.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

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

              return (
                <View key={index} style={styles.chartColumn}>
                  <Text style={[styles.chartValText, { color: isProfit ? theme.profitText : theme.lossText }]}>
                    {formatPnLText(item.total)}
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
    </ScrollView>
  );
}

function AboutView({ theme }) {
  const openGithub = () => {
    Linking.openURL('https://github.com/ItsMeParavai/Green-Candle-Monitor').catch((err) =>
      console.error('Failed opening link:', err)
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 12 }}>
      <View style={[styles.aboutCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={{ fontSize: 42, textAlign: 'center', marginBottom: 8 }}>🕯️</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', textAlign: 'center', color: theme.textPrimary }}>
          Green Candle Monitor
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', textAlign: 'center', color: theme.profitText, marginTop: 4 }}>
          Precision P&L & Performance Analytics Journal
        </Text>
        <Text style={{ fontSize: 11, textAlign: 'center', color: theme.textSecondary, marginTop: 6 }}>
          Version 1.0.0 (Production Release)
        </Text>
      </View>

      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginTop: 8 }}>
        👨‍💻 Developer & Application Info
      </Text>
      <View style={[styles.aboutCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <View style={styles.infoRow}>
          <Text style={{ color: theme.textSecondary }}>Developer</Text>
          <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Neelakandan N</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ color: theme.textSecondary }}>Repository</Text>
          <ScaleButton onPress={openGithub}>
            <Text style={{ fontWeight: '600', color: theme.accent, textDecorationLine: 'underline' }}>
              GitHub Repo ↗
            </Text>
          </ScaleButton>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ color: theme.textSecondary }}>Engine</Text>
          <Text style={{ fontWeight: '600', color: theme.textPrimary }}>React Native / Expo</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ color: theme.textSecondary }}>Pipeline</Text>
          <Text style={{ fontWeight: '600', color: theme.accent }}>GitHub Actions CI/CD</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={{ color: theme.textSecondary }}>Data Privacy</Text>
          <Text style={{ fontWeight: '600', color: theme.profitText }}>100% Offline & Local Storage</Text>
        </View>
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

  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

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

  const handlePrevDate = () => {
    const d = new Date(currentDate);
    if (activeTab === 'Week') {
      d.setDate(d.getDate() - 7);
    } else if (activeTab === 'Month') {
      d.setMonth(d.getMonth() - 1);
    } else if (activeTab === 'Year') {
      d.setFullYear(d.getFullYear() - 1);
    }
    setCurrentDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(currentDate);
    if (activeTab === 'Week') {
      d.setDate(d.getDate() + 7);
    } else if (activeTab === 'Month') {
      d.setMonth(d.getMonth() + 1);
    } else if (activeTab === 'Year') {
      d.setFullYear(d.getFullYear() + 1);
    }
    setCurrentDate(d);
  };

  const getHeaderTitle = () => {
    if (activeTab === 'Week') {
      const { monday, friday } = getWeekMonToFri(currentDate);
      const monStr = monday.getDate() + ' ' + MONTH_NAMES[monday.getMonth()].slice(0, 3);
      const friStr = friday.getDate() + ' ' + MONTH_NAMES[friday.getMonth()].slice(0, 3) + ' ' + friday.getFullYear();
      return monStr + ' - ' + friStr;
    }
    if (activeTab === 'Year') {
      return String(year);
    }
    if (activeTab === 'All time') {
      return 'Lifetime Overview';
    }
    return MONTH_NAMES[monthIndex] + ' ' + year;
  };

  const handleSaveEntry = async (dateKey, amount) => {
    const updated = { ...entries, [dateKey]: { amount } };
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

      let csvContent = 'Date,Type,Amount (INR)\n';
      keys.forEach((key) => {
        const item = entries[key];
        const amt = Math.round(typeof item === 'object' ? parseFloat(item.amount || 0) : parseFloat(item || 0));
        csvContent += '"' + key + '","' + (amt >= 0 ? 'Profit' : 'Loss') + '",' + amt + '\n';
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
        if (parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
          let valStr = parts.length >= 4 ? parts[3] : parts[2];
          let typeStr = parts.length >= 4 ? parts[2] : parts[1];
          let val = Math.round(parseFloat(valStr));
          if (!isNaN(val)) {
            if (typeStr && typeStr.toLowerCase() === 'loss' && val > 0) val = -val;
            updated[parts[0]] = { amount: val };
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

  const totalPnL = activeTab === 'Week'
    ? calculateWeeklyPnL(entries, currentDate)
    : calculateMonthlyPnL(entries, year, monthIndex);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {activeNavTab === 'Home' && (
        <FadeInView style={{ flex: 1 }} keyTrigger={activeNavTab}>
          <ViewTabs activeTab={activeTab} onSelectTab={setActiveTab} theme={theme} />

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {activeTab !== 'All time' && (
              <View style={styles.navHeader}>
                <ScaleButton onPress={handlePrevDate}>
                  <Text style={[styles.arrow, { color: theme.textPrimary }]}>‹</Text>
                </ScaleButton>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  {getHeaderTitle()}
                </Text>
                <ScaleButton onPress={handleNextDate}>
                  <Text style={[styles.arrow, { color: theme.textPrimary }]}>›</Text>
                </ScaleButton>
              </View>
            )}

            <SummaryRow totalPnL={totalPnL} goal={goal} activeTab={activeTab} onOpenGoalModal={() => setShowGoalModal(true)} theme={theme} />

            <View style={styles.filterRow}>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <ScaleButton onPress={handleImportFromExcel} style={[styles.exportBtn, { backgroundColor: theme.cardBg }]}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>📥 Import</Text>
                </ScaleButton>
                <ScaleButton onPress={handleExportToExcel} style={[styles.exportBtn, { backgroundColor: theme.cardBg }]}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>📊 Excel</Text>
                </ScaleButton>
              </View>
            </View>

            <FadeInView keyTrigger={activeTab + '_' + currentDate.getTime()}>
              {activeTab === 'Week' && <WeekView currentDate={currentDate} entries={entries} onSelectDate={(k) => setSelectedDateKey(k)} theme={theme} />}
              {activeTab === 'Month' && <CalendarGrid year={year} monthIndex={monthIndex} entries={entries} onSelectDate={(k) => setSelectedDateKey(k)} theme={theme} />}
              {activeTab === 'Year' && <YearView year={year} entries={entries} theme={theme} />}
              {activeTab === 'All time' && <AllTimeView entries={entries} theme={theme} />}
            </FadeInView>
          </ScrollView>
        </FadeInView>
      )}

      {activeNavTab === 'Analytics' && (
        <FadeInView style={{ flex: 1 }} keyTrigger={activeNavTab}>
          <AnalyticsView
            year={year}
            entries={entries}
            currentDate={currentDate}
            theme={theme}
          />
        </FadeInView>
      )}

      {activeNavTab === 'About' && (
        <FadeInView style={{ flex: 1 }} keyTrigger={activeNavTab}>
          <AboutView theme={theme} />
        </FadeInView>
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
    borderWidth: 1,
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
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
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
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartValText: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  chartTrack: {
    width: 12,
    height: '75%',
    justifyContent: 'flex-end',
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
    justifyContent: 'center',
  },
});
