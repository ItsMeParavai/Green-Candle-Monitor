import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ViewTabs({ activeTab, onSelectTab, theme }) {
  const tabs = ['Week', 'Month', 'Year', 'All time'];

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              isActive && { backgroundColor: theme.accent }
            ]}
            onPress={() => onSelectTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? '#FFFFFF' : theme.textSecondary }
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
