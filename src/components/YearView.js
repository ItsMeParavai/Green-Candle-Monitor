import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MONTH_NAMES } from '../dateUtils';
import { calculateMonthlyPnL } from '../calc';

export default function YearView({ year, entries, selectedAccount, theme }) {
  return (
    <View style={styles.container}>
      {MONTH_NAMES.map((name, index) => {
        const rawPnL = calculateMonthlyPnL(entries, year, index, selectedAccount);
        const pnl = Math.round(rawPnL || 0);
        return (
          <View key={name} style={[styles.monthCard, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.monthName, { color: theme.textSecondary }]}>{name}</Text>
            <Text
              style={[
                styles.pnlText,
                { color: pnl >= 0 ? theme.profitText : theme.lossText }
              ]}
            >
              {pnl >= 0 ? `+₹${pnl}` : `-₹${Math.abs(pnl)}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  monthCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
  },
  monthName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
