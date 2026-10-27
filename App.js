import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { themes } from './src/theme';
import { defaultState, loadState, saveState } from './src/storage';
import {
  MONTHS, addDays, addMonths, formatRange, monthWeeks, weekRow, startOfMonth, endOfMonth,
  startOfWeek, toKey,
} from './src/dateUtils';
import { sumRange, stats as calcStats, monthTotals } from './src/calc';

import ViewTabs from './src/components/ViewTabs';
import SummaryRow from './src/components/SummaryRow';
import CalendarGrid from './src/components/CalendarGrid';
import YearView from './src/components/YearView';
import AllTimeView from './src/components/AllTimeView';
import EntryModal from './src/components/EntryModal';
import GoalModal from './src/components/GoalModal';
import AccountModal from './src/components/AccountModal';

export default function App() {
  const [state, setState] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('Month');
  const [anchor, setAnchor] = useState(new Date());
  const [editKey, setEditKey] = useState(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  const theme = themes[state.theme] || themes.dark;
  const acc = state.activeAccount;
  const accountName = (state.accounts.find((a) => a.id === acc) || state.accounts[0]).name;
  const entries = state.entries[acc] || {};
  const goal = state.goals[acc] || 0;
  const cols = state.weekends ? 7 : 5;
  const todayKey = toKey(new Date());

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  // ---- period math ----
  const period = useMemo(() => {
    if (view === 'Week') {
      const s = startOfWeek(anchor);
      const e = addDays(s, 6);
      return { start: toKey(s), end: toKey(e), label: formatRange(s, e), title: formatRange(s, e) };
    }
    if (view === 'Month') {
      const s = startOfMonth(anchor);
      const e = endOfMonth(anchor);
      const t = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
      return { start: toKey(s), end: toKey(e), label: t, title: t };
    }
    if (view === 'Year') {
      const y = anchor.getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31`, label: String(y), title: String(y) };
    }
    return { start: null, end: null, label: 'All time', title: 'All time' };
  }, [view, anchor]);

  const total = sumRange(entries, period.start, period.end, state.weekends).total;
  const monthStart = toKey(startOfMonth(anchor));
  const monthEnd = toKey(endOfMonth(anchor));
  const monthTotal = sumRange(entries, monthStart, monthEnd, state.weekends).total;

  const move = (dir) => {
    if (view === 'Week') setAnchor(addDays(anchor, 7 * dir));
    else if (view === 'Month') setAnchor(addMonths(anchor, dir));
    else if (view === 'Year') setAnchor(new Date(anchor.getFullYear() + dir, anchor.getMonth(), 1));
  };

  // ---- mutations ----
  const saveEntry = (key, pnl, note) => {
    setState((s) => ({
      ...s,
      entries: { ...s.entries, [acc]: { ...(s.entries[acc] || {}), [key]: { pnl, note } } },
    }));
    setEditKey(null);
  };

  const clearEntry = (key) => {
    setState((s) => {
      const copy = { ...(s.entries[acc] || {}) };
      delete copy[key];
      return { ...s, entries: { ...s.entries, [acc]: copy } };
    });
    setEditKey(null);
  };

  const addAccount = (name) => {
    const id = `acc_${Date.now()}`;
    setState((s) => ({
      ...s,
      accounts: [...s.accounts, { id, name }],
      entries: { ...s.entries, [id]: {} },
      goals: { ...s.goals, [id]: 0 },
      activeAccount: id,
    }));
    setAccountOpen(false);
  };

  // ---- derived views ----
  const weeks = view === 'Week' ? weekRow(anchor, cols) : monthWeeks(anchor, cols);
  const allStats = useMemo(() => calcStats(entries, state.weekends), [entries, state.weekends]);
  const totals = useMemo(() => monthTotals(entries, state.weekends), [entries, state.weekends]);

  if (!loaded) {
    return <View style={[styles.root, { backgroundColor: theme.bg }]} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 44 }]}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Top bar: view tabs + theme toggle */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <ViewTabs value={view} onChange={setView} theme={theme} />
          </View>
          <TouchableOpacity
            onPress={() => update({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
            style={[styles.themeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <Text style={{ fontSize: 18 }}>{state.theme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Period navigation */}
        <View style={styles.navRow}>
          {view !== 'All time' ? (
            <TouchableOpacity onPress={() => move(-1)} style={[styles.arrow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={{ color: theme.text, fontSize: 20 }}>‹</Text>
            </TouchableOpacity>
          ) : <View style={styles.arrow} />}
          <Text style={[styles.navTitle, { color: theme.text }]}>{period.title}</Text>
          {view !== 'All time' ? (
            <TouchableOpacity onPress={() => move(1)} style={[styles.arrow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={{ color: theme.text, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          ) : <View style={styles.arrow} />}
        </View>

        {/* Summary cards */}
        <SummaryRow
          total={total}
          periodLabel={period.label}
          monthTotal={monthTotal}
          goal={goal}
          onEditGoal={() => setGoalOpen(true)}
          theme={theme}
        />

        {/* Filter row */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => update({ weekends: !state.weekends })}
            style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>
              Weekends: <Text style={{ color: state.weekends ? theme.posInline : theme.subText }}>{state.weekends ? 'ON' : 'OFF'}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAccountOpen(true)}
            style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.cardBorder, flex: 1 }]}
          >
            <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{accountName}  ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={{ marginTop: 14 }}>
          {(view === 'Week' || view === 'Month') && (
            <CalendarGrid
              weeks={weeks}
              cols={cols}
              entries={entries}
              theme={theme}
              todayKey={todayKey}
              onPressDay={setEditKey}
            />
          )}
          {view === 'Year' && (
            <YearView
              year={anchor.getFullYear()}
              totals={totals}
              theme={theme}
              onPickMonth={(m) => {
                setAnchor(new Date(anchor.getFullYear(), m, 1));
                setView('Month');
              }}
            />
          )}
          {view === 'All time' && <AllTimeView stats={allStats} totals={totals} theme={theme} />}
        </View>
      </ScrollView>

      <EntryModal
        visible={!!editKey}
        dateKey={editKey}
        entry={editKey ? entries[editKey] : null}
        theme={theme}
        onSave={(pnl, note) => saveEntry(editKey, pnl, note)}
        onClear={() => clearEntry(editKey)}
        onClose={() => setEditKey(null)}
      />
      <GoalModal
        visible={goalOpen}
        goal={goal}
        theme={theme}
        onSave={(g) => {
          update({ goals: { ...state.goals, [acc]: g } });
          setGoalOpen(false);
        }}
        onClose={() => setGoalOpen(false)}
      />
      <AccountModal
        visible={accountOpen}
        accounts={state.accounts}
        activeId={acc}
        theme={theme}
        onSelect={(id) => {
          update({ activeAccount: id });
          setAccountOpen(false);
        }}
        onAdd={addAccount}
        onClose={() => setAccountOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
  arrow: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: 'transparent' },
  navTitle: { fontSize: 20, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  pill: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
});
