import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MONTHS_SHORT } from '../dateUtils';
import { fmt } from '../calc';

export default function YearView({ year, totals, theme, onPickMonth }) {
  return (
    <View style={styles.grid}>
      {MONTHS_SHORT.map((m, i) => {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`;
        const v = totals[key];
        let bg = theme.emptyBg;
        let color = theme.emptyText;
        if (v > 0) { bg = theme.posBg; color = theme.posText; }
        else if (v < 0) { bg = theme.negBg; color = theme.negText; }
        return (
          <View key={m} style={styles.cellWrap}>
            <TouchableOpacity style={[styles.cell, { backgroundColor: bg }]} onPress={() => onPickMonth(i)} activeOpacity={0.75}>
              <Text style={[styles.month, { color }]}>{m}</Text>
              <Text style={[styles.amount, { color }]} numberOfLines={1} adjustsFontSizeToFit>
                {v === undefined ? '—' : fmt(v)}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: '33.333%', padding: 4, aspectRatio: 1.15 },
  cell: { flex: 1, borderRadius: 14, padding: 10, justifyContent: 'space-between' },
  month: { fontSize: 13, fontWeight: '600', opacity: 0.85 },
  amount: { fontSize: 17, fontWeight: '800' },
});
