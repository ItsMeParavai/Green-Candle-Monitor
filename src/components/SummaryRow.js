import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fmt, fmtPlain } from '../calc';

export default function SummaryRow({ total, periodLabel, monthTotal, goal, onEditGoal, theme }) {
  const totalColor = total > 0 ? theme.posInline : total < 0 ? theme.negInline : theme.text;
  const pct = goal > 0 ? (monthTotal / goal) * 100 : 0;
  const fill = Math.max(0, Math.min(100, pct));

  return (
    <View style={styles.row}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Text style={[styles.label, { color: theme.subText }]}>Total P&L</Text>
        <Text style={[styles.value, { color: totalColor }]} numberOfLines={1} adjustsFontSizeToFit>
          {fmt(total)}
        </Text>
        <Text style={[styles.sub, { color: theme.subText }]} numberOfLines={1}>{periodLabel}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onEditGoal}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      >
        <View style={styles.goalHeader}>
          <Text style={[styles.label, { color: theme.subText }]}>Monthly goal</Text>
          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>Edit</Text>
        </View>
        <Text style={[styles.value, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {goal > 0 ? fmtPlain(goal) : 'Set goal'}
        </Text>
        <View style={[styles.track, { backgroundColor: theme.progressTrack }]}>
          <View style={[styles.fill, { width: `${fill}%`, backgroundColor: monthTotal >= 0 ? theme.posInline : theme.negInline }]} />
        </View>
        <Text style={[styles.sub, { color: theme.subText }]} numberOfLines={1}>
          {goal > 0 ? `${pct.toFixed(0)}% · ${fmt(monthTotal)} this month` : 'Tap to set a target'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14 },
  label: { fontSize: 12, fontWeight: '600' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  sub: { fontSize: 11, marginTop: 4 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  fill: { height: 6, borderRadius: 3 },
});
