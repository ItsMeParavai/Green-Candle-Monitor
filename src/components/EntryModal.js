import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ModalSheet from './ModalSheet';
import { parseKey, MONTHS, WEEKDAYS, mondayIndex } from '../dateUtils';

export default function EntryModal({ visible, dateKey, entry, theme, onSave, onClear, onClose }) {
  const [sign, setSign] = useState('+');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (entry) {
      setSign(entry.pnl < 0 ? '-' : '+');
      setAmount(String(Math.abs(entry.pnl)));
      setNote(entry.note || '');
    } else {
      setSign('+');
      setAmount('');
      setNote('');
    }
  }, [visible, dateKey]);

  const date = dateKey ? parseKey(dateKey) : null;
  const subtitle = date
    ? `${WEEKDAYS[mondayIndex(date)]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
    : '';

  const save = () => {
    const cleaned = amount.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (Number.isNaN(num)) {
      if (entry) onClear();
      else onClose();
      return;
    }
    onSave(sign === '-' ? -Math.abs(num) : Math.abs(num), note.trim());
  };

  const signBtn = (s) => {
    const active = sign === s;
    const bg = active ? (s === '+' ? theme.posBg : theme.negBg) : theme.inputBg;
    const color = active ? (s === '+' ? theme.posText : theme.negText) : theme.subText;
    return (
      <TouchableOpacity style={[styles.signBtn, { backgroundColor: bg }]} onPress={() => setSign(s)}>
        <Text style={{ color, fontSize: 22, fontWeight: '700' }}>{s === '+' ? 'Profit' : 'Loss'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Log P&L" subtitle={subtitle} theme={theme}>
      <View style={styles.signRow}>
        {signBtn('+')}
        {signBtn('-')}
      </View>
      <Text style={[styles.label, { color: theme.subText }]}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor={theme.emptyText}
        keyboardType="decimal-pad"
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
        autoFocus
      />
      <Text style={[styles.label, { color: theme.subText }]}>Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="What happened today?"
        placeholderTextColor={theme.emptyText}
        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, minHeight: 64, textAlignVertical: 'top' }]}
        multiline
      />
      <View style={styles.actions}>
        {entry ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.inputBg }]} onPress={onClear}>
            <Text style={{ color: theme.negInline, fontWeight: '600' }}>Clear</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent, flex: 1 }]} onPress={save}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  signRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  signBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  label: { fontSize: 12, marginBottom: 6, marginTop: 4, fontWeight: '600' },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center' },
});
