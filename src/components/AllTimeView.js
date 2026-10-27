import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fmt } from '../calc';
import { MONTHS_SHORT, parseKey } from '../dateUtils';

function Stat({ label, value, color, theme }) {
  return (
    <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[styles.statLabel, { color: theme.subText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color || theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export default function AllTimeView({ stats, totals, theme }) {
  const winRate = stats.days ? Math.round((stats.wins / stats.days) * 100) : 0;
  const months = Object.keys(totals).sort().reverse();
  const bestLabel = stats.best ? `${fmt(stats.best.v)}` : '—';
  const worstLabel = stats.worst ? `${fmt(stats.worst.v)}` : '—';

  return (
    <View>
      <View style={styles.statRow}>
        <Stat label="Days logged" value={String(stats.days)} theme={theme} />
        <Stat label="Win rate" value={`${winRate}%`} theme={theme} />
      </View>
      <View style={styles.statRow}>
        <Stat label="Best day" value={bestLabel} color={theme.posInline} theme={theme} />
        <Stat label="Worst day" value={worstLabel} color={theme.negInline} theme={theme} />
      </View>

      <Text style={[styles.heading, { color: theme.subText }]}>By month</Text>
      {months.length === 0 ? (
        <Text style={{ color: theme.subText, textAlign: 'center', marginTop: 24 }}>No entries yet. Switch to Month view and tap a day.</Text>
      ) : (
        months.map((mk) => {
          const v = totals[mk];
          const d = parseKey(`${mk}-01`);
          return (
            <View key={mk} style={[styles.monthRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
                {MONTHS_SHORT[d.getMonth()]} {d.getFullYear()}
              </Text>
              <Text style={{ color: v > 0 ? theme.posInline : v < 0 ? theme.negInline : theme.text, fontSize: 16, fontWeight: '800' }}>
                {fmt(v)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  heading: { fontSize: 13, fontWeight: '700', marginTop: 6, marginBottom: 8 },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
});
