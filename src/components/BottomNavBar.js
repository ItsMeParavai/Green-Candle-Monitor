import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BottomNavBar({ activeTab, onSelectTab, theme }) {
  const tabs = [
    { key: 'Home', label: 'Home', icon: '🏠' },
    { key: 'Analytics', label: 'Analytics', icon: '📊' },
    { key: 'About', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? theme.accent : theme.textSecondary, fontWeight: isActive ? '700' : '500' }
              ]}
            >
              {tab.label}
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
