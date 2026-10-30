import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MONTH_NAMES } from '../dateUtils';
import { calculateMonthlyPnL } from '../calc';

export default function AnalyticsView({ year, entries, selectedAccount, theme }) {
  // 1. Calculate monthly data for visual bar chart
  const monthlyData = MONTH_NAMES.map((monthName, idx) => {
    const rawVal = calculateMonthlyPnL(entries, year, idx, selectedAccount);
    return {
      month: monthName.slice(0, 3),
      amount: Math.round(rawVal || 0),
    };
  });

  // Calculate max absolute value for bar scaling
  const maxAbsVal = Math.max(...monthlyData.map((d) => Math.abs(d.amount)), 1);

  // 2. Calculate lifetime stats
  let profitDays = 0;
  let lossDays = 0;
  let totalProfitSum = 0;
  let totalLossSum = 0;
  let maxSingleProfit = 0;
  let maxSingleLoss = 0;

  Object.values(entries || {}).forEach((entry) => {
    const val = Math.round(parseFloat(entry?.amount || 0));
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>📊 Monthly P&L Trend ({year})</Text>

      {/* Bar Chart Container */}
      <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.chartHeight}>
          {monthlyData.map((item, index) => {
            const heightPercent = Math.min((Math.abs(item.amount) / maxAbsVal) * 100, 100);
            const isProfit = item.amount >= 0;

            return (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: item.amount === 0 ? '4%' : `${Math.max(heightPercent, 8)}%`,
                        backgroundColor: isProfit ? theme.profitText : theme.lossText,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 16 }]}>📈 Performance Metrics</Text>

      {/* Stat Grid */}
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
          <Text style={[styles.statValue, { color: theme.accent }]}>{winRate}%</Text>
          <Text style={[styles.statSub, { color: theme.textSecondary }]}>{profitDays}W / {lossDays}L</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Entries</Text>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalEntries}</Text>
          <Text style={[styles.statSub, { color: theme.textSecondary }]}>Days Logged</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.profitBg }]}>
          <Text style={[styles.statLabel, { color: theme.profitText }]}>Avg Green Day</Text>
          <Text style={[styles.statValue, { color: theme.profitText }]}>+₹{avgProfit}</Text>
          <Text style={[styles.statSub, { color: theme.profitText }]}>Max: +₹{maxSingleProfit}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.lossBg }]}>
          <Text style={[styles.statLabel, { color: theme.lossText }]}>Avg Red Day</Text>
          <Text style={[styles.statValue, { color: theme.lossText }]}>-₹{avgLoss}</Text>
          <Text style={[styles.statSub, { color: theme.lossText }]}>Max: -₹{maxSingleLoss}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  chartCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  chartHeight: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 12,
    height: '80%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 11,
    marginTop: 4,
  },
});
