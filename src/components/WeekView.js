import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDateKey } from '../dateUtils';

export default function WeekView({ currentDate, entries, onSelectDate, theme }) {
  const tempDate = new Date(currentDate);
  const dayOfWeek = tempDate.getDay();
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(tempDate);
  monday.setDate(tempDate.getDate() + distanceToMon);

  const days = [];
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const dateNum = d.getDate();
    const dateKey = formatDateKey(y, m, dateNum);

    const entry = entries[dateKey];
    const rawAmount = entry ? parseFloat(entry.amount) : null;
    const amount = rawAmount !== null && !isNaN(rawAmount) ? Math.round(rawAmount) : null;

    days.push({
      label: dayLabels[i],
      dateNum,
      dateKey,
      amount,
    });
  }

  return (
    <View style={styles.container}>
      {days.map((item) => {
        let cardBg = theme.cardBg;
        let textColor = theme.textSecondary;

        if (item.amount !== null) {
          if (item.amount > 0) {
            cardBg = theme.profitBg;
            textColor = theme.profitText;
          } else if (item.amount < 0) {
            cardBg = theme.lossBg;
            textColor = theme.lossText;
          }
        }

        return (
          <TouchableOpacity
            key={item.dateKey}
            style={[styles.weekCard, { backgroundColor: cardBg, borderColor: theme.border }]}
            onPress={() => onSelectDate(item.dateKey)}
          >
            <View style={styles.dayInfo}>
              <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.dateNum, { color: theme.textPrimary }]}>{item.dateNum}</Text>
            </View>

            <Text style={[styles.amountText, { color: textColor }]}>
              {item.amount === null
                ? '—'
                : item.amount > 0
                ? `+₹${item.amount}`
                : `-₹${Math.abs(item.amount)}`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  weekCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 36,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
