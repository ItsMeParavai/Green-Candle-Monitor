import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const VIEWS = ['Week', 'Month', 'Year', 'All time'];

export default function ViewTabs({ value, onChange, theme }) {
  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {VIEWS.map((v) => {
        const active = v === value;
        return (
          <TouchableOpacity
            key={v}
            style={[styles.tab, active && { backgroundColor: theme.tabActiveBg }]}
            onPress={() => onChange(v)}
          >
            <Text style={{ color: active ? theme.tabActiveText : theme.subText, fontWeight: active ? '700' : '500', fontSize: 14 }}>
              {v}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 4, borderRadius: 16, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12 },
});
