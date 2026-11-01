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
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
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

// --- SLIDING SEGMENTED TAB SWITCHER ---
function ViewTabs({ activeTab, onSelectTab, theme }) {
  const tabs = ['Week', 'Month', 'Year', 'All time'];
  const activeIndex = tabs.indexOf(activeTab);
  const slideAnim = useRef(new Animated.Value(activeIndex >= 0 ? activeIndex : 1)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (activeIndex >= 0) {
      Animated.spring(slideAnim, {
        toValue: activeIndex,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex]);

  const padding = 4;
  const tabWidth = containerWidth > 0 ? (containerWidth - padding * 2) / tabs.length : 0;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });

  return (
    <View
      style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              width: tabWidth,
              backgroundColor: theme.accent,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.7}
            style={styles.tabBtn}
            onPress={() => onSelectTab(tab)}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isActive ? '#FFF' : theme.textSecondary,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
          <Text style={{ color: '#FFF', fontSize: 
