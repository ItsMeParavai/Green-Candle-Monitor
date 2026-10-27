import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { toKey, WEEKDAYS } from '../dateUtils';
import { fmt } from '../calc';

export default function CalendarGrid({ weeks, cols, entries, theme, todayKey, onPressDay }) {
  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.slice(0, cols).map((w) => (
          <Text key={w} style={[styles.weekday, { color: theme.subText }]}>{w}</Text>
        ))}
      </View>
      {weeks.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={styles.cellWrap} />;
            const key = toKey(day);
            const entry = entries[key];
            let bg = theme.emptyBg;
            let color = theme.emptyText;
            let label = '—';
            if (entry) {
              label = fmt(entry.pnl);
              if (entry.pnl > 0) { bg = theme.posBg; color = theme.posText; }
              else if (entry.pnl < 0) { bg = theme.negBg; color = theme.negText; }
              else { color = theme.text; }
            }
            const isToday = key === todayKey;
            return (
              <View key={ci} style={styles.cellWrap}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => onPressDay(key)}
                  style={[styles.cell, { backgroundColor: bg }, isToday && { borderWidth: 2, borderColor: theme.todayBorder }]}
                >
                  <Text style={[styles.day, { color }]}>{day.getDate()}</Text>
                  <Text style={[styles.amount, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                    {label}
                  </Text>
                  {entry && entry.note ? <View style={[styles.noteDot, { backgroundColor: color }]} /> : null}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekdayRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row' },
  cellWrap: { flex: 1, padding: 3, aspectRatio: 0.85 },
  cell: { flex: 1, borderRadius: 12, padding: 6, justifyContent: 'space-between' },
  day: { fontSize: 11, fontWeight: '600', opacity: 0.8 },
  amount: { fontSize: 14, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  noteDot: { position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: 3, opacity: 0.8 },
});
