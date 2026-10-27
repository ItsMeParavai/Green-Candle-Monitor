import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getDaysInMonth, getFirstDayOfMonth, formatDateKey } from '../dateUtils';

export default function CalendarGrid({ year, monthIndex, entries, hideWeekends, onSelectDate, theme }) {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDay = getFirstDayOfMonth(year, monthIndex);

  const weekHeaders = hideWeekends
    ? ['MON', 'TUE', 'WED', 'THU', 'FRI']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const gridCells = [];
  for (let i = 0; i < firstDay; i++) {
    const dayOfWeek = i;
    if (hideWeekends && (dayOfWeek === 5 || dayOfWeek === 6)) continue;
    gridCells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthIndex, day);
    let dayOfWeek = dateObj.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    if (hideWeekends && (dayOfWeek === 5 || dayOfWeek === 6)) continue;

    gridCells.push(day);
  }

  const columns = hideWeekends ? 5 : 7;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {weekHeaders.map((header) => (
          <Text key={header} style={[styles.headerText, { color: theme.textSecondary, width: `${100 / columns}%` }]}>
            {header}
          </Text>
        ))}
      </View>

      <View style={styles.gridContainer}>
        {gridCells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={[styles.card, { width: `${100 / columns - 2}%` }]} />;
          }

          const dateKey = formatDateKey(year, monthIndex, day);
          const entry = entries[dateKey];
          const amount = entry ? parseFloat(entry.amount) : null;

          let cardBg = theme.cardBg;
          let textColor = theme.textSecondary;

          if (amount !== null && !isNaN(amount)) {
            if (amount > 0) {
              cardBg = theme.profitBg;
              textColor = theme.profitText;
            } else if (amount < 0) {
              cardBg = theme.lossBg;
              textColor = theme.lossText;
            }
          }

          return (
            <TouchableOpacity
              key={dateKey}
              style={[styles.card, { backgroundColor: cardBg, width: `${100 / columns - 2}%` }]}
              onPress={() => onSelectDate(dateKey)}
            >
              <Text style={[styles.dayText, { color: theme.textPrimary }]}>{day}</Text>
              <Text style={[styles.amountText, { color: textColor }]}>
                {amount === null
                  ? '—'
                  : amount > 0
                  ? `+₹${amount.toFixed(2)}`
                  : `-₹${Math.abs(amount).toFixed(2)}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  card: {
    height: 60,
    borderRadius: 10,
    padding: 6,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
