import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AllTimeView({ entries, theme }) {
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
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Lifetime Net P&L</Text>
        <Text style={[styles.netVal, { color: netPnL >= 0 ? theme.profitText : theme.lossText }]}>
          {netPnL >= 0 ? `+₹${netPnL}` : `-₹${Math.abs(netPnL)}`}
        </Text>
      </View>

      <View style={styles.row}>
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    padding: 20,
    borderRadius: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  netVal: {
    fontSize: 26,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
});
