import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SummaryRow({ totalPnL, goal, onOpenGoalModal, theme }) {
  const roundedPnL = Math.round(totalPnL || 0);
  const roundedGoal = Math.round(goal || 0);
  const progressPercent = Math.min(Math.max((totalPnL / (goal || 1)) * 100, 0), 100);

  return (
    <View style={styles.container}>
      {/* Total PnL Card */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Total P&L</Text>
        <Text style={[styles.pnlValue, { color: roundedPnL >= 0 ? theme.profitText : theme.lossText }]}>
          {roundedPnL >= 0 ? `+₹${roundedPnL}` : `-₹${Math.abs(roundedPnL)}`}
        </Text>
      </View>

      {/* Monthly Goal Card */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <View style={styles.goalHeader}>
          <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Monthly goal</Text>
          <TouchableOpacity onPress={onOpenGoalModal}>
            <Text style={{ color: theme.accent, fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.barBackground, { backgroundColor: theme.barBg }]}>
          <View style={[styles.barFill, { width: `${progressPercent}%`, backgroundColor: theme.accent }]} />
        </View>

        <View style={styles.goalFooter}>
          <Text style={[styles.goalText, { color: theme.textPrimary }]}>₹{Math.max(0, roundedPnL)}</Text>
          <Text style={[styles.goalText, { color: theme.textSecondary }]}>₹{roundedGoal}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
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
  barBackground: {
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
  goalText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
