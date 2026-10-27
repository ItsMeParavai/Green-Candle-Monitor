import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ModalSheet from './ModalSheet';

export default function AccountModal({ visible, accounts, activeId, theme, onSelect, onAdd, onClose }) {
  const [name, setName] = useState('');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Accounts" subtitle="Each account has its own calendar and goal" theme={theme}>
      {accounts.map((a) => {
        const active = a.id === activeId;
        return (
          <TouchableOpacity
            key={a.id}
            onPress={() => onSelect(a.id)}
            style={[styles.row, { backgroundColor: active ? theme.tabActiveBg : theme.inputBg, borderColor: active ? theme.accent : 'transparent' }]}
          >
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: active ? '700' : '500' }}>{a.name}</Text>
            {active ? <Text style={{ color: theme.accent, fontSize: 16 }}>✓</Text> : null}
          </TouchableOpacity>
        );
      })}
      <View style={styles.addRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New account name"
          placeholderTextColor={theme.emptyText}
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
          onSubmitEditing={add}
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.accent }]} onPress={add}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  addRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  input: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  addBtn: { paddingHorizontal: 20, borderRadius: 14, justifyContent: 'center' },
});
