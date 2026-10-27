import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export default function EntryModal({ visible, dateKey, initialEntry, onSave, onDelete, onClose, theme }) {
  const [type, setType] = useState('profit');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (initialEntry) {
      const val = parseFloat(initialEntry.amount);
      setType(val < 0 ? 'loss' : 'profit');
      setAmount(Math.abs(val).toString());
    } else {
      setType('profit');
      setAmount('');
    }
  }, [initialEntry, visible]);

  const handleSave = () => {
    if (!amount || isNaN(amount)) return;
    const numericVal = parseFloat(amount) * (type === 'loss' ? -1 : 1);
    onSave(dateKey, numericVal);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Date: {dateKey}</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, type === 'profit' && { backgroundColor: theme.profitBg }]}
              onPress={() => setType('profit')}
            >
              <Text style={{ color: theme.profitText, fontWeight: '700' }}>Profit (+₹)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, type === 'loss' && { backgroundColor: theme.lossBg }]}
              onPress={() => setType('loss')}
            >
              <Text style={{ color: theme.lossText, fontWeight: '700' }}>Loss (-₹)</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
            placeholder="₹0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={styles.btnRow}>
            {initialEntry && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.lossBg }]} onPress={() => onDelete(dateKey)}>
                <Text style={{ color: theme.lossText, fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.border }]} onPress={onClose}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
