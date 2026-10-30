import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getDaysInMonth, getFirstDayOfMonth, formatDateKey } from '../dateUtils';

export default function CalendarGrid({ year, monthIndex, entries, onSelectDate, theme }) {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDay = getFirstDayOfMonth(year, monthIndex);

  const weekHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const gridCells = [];

  // Pad empty cells for weekdays leading up to the 1st
  const initialPadCount = firstDay >= 5 ? 0 : firstDay;
  for (let i = 0; i < initialPadCount; i++) {
    gridCells.push(null);
  }

  // Push only Monday to Friday dates
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sat & Sun

    gridCells.push(day);
  }

  const columns = 5;

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
          const rawAmount = entry ? parseFloat(entry.amount) : null;
          const amount = rawAmount !== null && !isNaN(rawAmount) ? Math.round(rawAmount) : null;

          let cardBg = theme.cardBg;
          let textColor = theme.textSecondary;

          if (amount !== null) {
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
                  ? `+₹${amount}`
                  : `-₹${Math.abs(amount)}`}
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
