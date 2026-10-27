import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ModalSheet from './ModalSheet';

export default function GoalModal({ visible, goal, theme, onSave, onClose }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(goal ? String(goal) : '');
  }, [visible]);

  const save = () => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    onSave(Number.isNaN(num) ? 0 : num);
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Monthly goal" subtitle="Target profit for each month" theme={theme}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="e.g. 500"
        placeholderTextColor={theme.emptyText}
        keyboardType="decimal-pad"
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        autoFocus
      />
      <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={save}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Save goal</Text>
      </TouchableOpacity>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 20 },
  btn: { marginTop: 18, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
});
